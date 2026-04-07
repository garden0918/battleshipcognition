import json
import uuid
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.game import create_game, get_game

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


# Track WebSocket connections per game: {game_id: {player_id: websocket}}
connections: dict[str, dict[str, WebSocket]] = {}


async def broadcast_to_game(game_id: str, exclude_player: str | None = None) -> None:
    """Send updated game state to all players in a game."""
    game = get_game(game_id)
    if not game:
        return
    conns = connections.get(game_id, {})
    for pid, ws in conns.items():
        if pid == exclude_player:
            continue
        state = game.get_state_for_player(pid)
        try:
            await ws.send_json({"type": "game_state", "data": state})
        except Exception:
            pass


async def send_to_player(game_id: str, player_id: str, message: dict) -> None:
    """Send a message to a specific player."""
    conns = connections.get(game_id, {})
    ws = conns.get(player_id)
    if ws:
        try:
            await ws.send_json(message)
        except Exception:
            pass


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.post("/api/games")
async def create_new_game():
    game = create_game()
    return {"game_id": game.game_id}


@app.get("/api/games/{game_id}")
async def get_game_info(game_id: str):
    game = get_game(game_id)
    if not game:
        return {"error": "Game not found"}
    return {
        "game_id": game.game_id,
        "phase": game.phase,
        "player_count": len(game.players),
    }


@app.websocket("/ws/{game_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str):
    await websocket.accept()

    game = get_game(game_id)
    if not game:
        await websocket.send_json({"type": "error", "data": {"message": "Game not found"}})
        await websocket.close()
        return

    # Assign player ID
    player_id = uuid.uuid4().hex[:8]

    if not game.add_player(player_id):
        await websocket.send_json({"type": "error", "data": {"message": "Game is full"}})
        await websocket.close()
        return

    # Track connection
    if game_id not in connections:
        connections[game_id] = {}
    connections[game_id][player_id] = websocket

    # Send player their ID and initial state
    await websocket.send_json({
        "type": "connected",
        "data": {
            "player_id": player_id,
            "game_id": game_id,
            "player_number": len(game.players),
        },
    })

    # Send game state to all players
    await broadcast_to_game(game_id)

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            msg_type = data.get("type", "")

            if msg_type == "place_ships":
                placements = data.get("placements", [])
                success, message = game.place_ships(player_id, placements)
                await websocket.send_json({
                    "type": "placement_result",
                    "data": {"success": success, "message": message},
                })
                await broadcast_to_game(game_id)

            elif msg_type == "fire":
                row = data.get("row", 0)
                col = data.get("col", 0)
                success, message, result = game.fire(player_id, row, col)
                if success and result:
                    await websocket.send_json({
                        "type": "fire_result",
                        "data": result,
                    })
                    opponent_id = [
                        pid for pid in game.player_order if pid != player_id
                    ][0]
                    await send_to_player(game_id, opponent_id, {
                        "type": "incoming_fire",
                        "data": result,
                    })
                    await broadcast_to_game(game_id)
                else:
                    await websocket.send_json({
                        "type": "error",
                        "data": {"message": message},
                    })

            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        if game_id in connections and player_id in connections[game_id]:
            del connections[game_id][player_id]
        for pid in game.player_order:
            if pid != player_id:
                await send_to_player(game_id, pid, {
                    "type": "opponent_disconnected",
                    "data": {"message": "Your opponent disconnected"},
                })
    except Exception:
        if game_id in connections and player_id in connections[game_id]:
            del connections[game_id][player_id]
