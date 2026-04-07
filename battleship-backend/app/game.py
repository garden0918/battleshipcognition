"""Battleship game logic."""

import uuid
import random
from enum import Enum
from dataclasses import dataclass, field


class CellState(str, Enum):
    EMPTY = "empty"
    SHIP = "ship"
    HIT = "hit"
    MISS = "miss"
    SUNK = "sunk"


class GamePhase(str, Enum):
    WAITING = "waiting"        # Waiting for second player
    PLACEMENT = "placement"    # Both players placing ships
    BATTLE = "battle"          # Taking turns firing
    FINISHED = "finished"      # Game over


SHIP_SIZES = {
    "carrier": 5,
    "battleship": 4,
    "cruiser": 3,
    "submarine": 3,
    "destroyer": 2,
}

BOARD_SIZE = 10


@dataclass
class Ship:
    name: str
    size: int
    cells: list[tuple[int, int]] = field(default_factory=list)
    hits: set[tuple[int, int]] = field(default_factory=set)

    @property
    def is_sunk(self) -> bool:
        return len(self.hits) == self.size


@dataclass
class PlayerState:
    player_id: str
    board: list[list[str]] = field(default_factory=list)
    ships: list[Ship] = field(default_factory=list)
    ships_placed: bool = False
    shots_fired: list[tuple[int, int]] = field(default_factory=list)

    def __post_init__(self) -> None:
        if not self.board:
            self.board = [[CellState.EMPTY] * BOARD_SIZE for _ in range(BOARD_SIZE)]

    @property
    def all_ships_sunk(self) -> bool:
        return all(ship.is_sunk for ship in self.ships) and len(self.ships) > 0


class Game:
    def __init__(self) -> None:
        self.game_id: str = uuid.uuid4().hex[:8]
        self.phase: GamePhase = GamePhase.WAITING
        self.players: dict[str, PlayerState] = {}
        self.player_order: list[str] = []
        self.current_turn_index: int = 0
        self.winner: str | None = None

    @property
    def current_turn(self) -> str | None:
        if self.phase != GamePhase.BATTLE:
            return None
        return self.player_order[self.current_turn_index]

    def add_player(self, player_id: str) -> bool:
        if len(self.players) >= 2:
            return False
        if player_id in self.players:
            return True
        self.players[player_id] = PlayerState(player_id=player_id)
        self.player_order.append(player_id)
        if len(self.players) == 2:
            self.phase = GamePhase.PLACEMENT
        return True

    def place_ships(
        self, player_id: str, placements: list[dict]
    ) -> tuple[bool, str]:
        if self.phase != GamePhase.PLACEMENT:
            return False, "Not in placement phase"

        player = self.players.get(player_id)
        if not player:
            return False, "Player not found"

        if player.ships_placed:
            return False, "Ships already placed"

        # Validate placements
        placed_names = set()
        all_cells: set[tuple[int, int]] = set()
        ships: list[Ship] = []

        for p in placements:
            name = p.get("name", "")
            row = p.get("row", 0)
            col = p.get("col", 0)
            horizontal = p.get("horizontal", True)

            if name not in SHIP_SIZES:
                return False, f"Unknown ship: {name}"
            if name in placed_names:
                return False, f"Duplicate ship: {name}"

            size = SHIP_SIZES[name]
            cells: list[tuple[int, int]] = []

            for i in range(size):
                r = row if horizontal else row + i
                c = col + i if horizontal else col
                if r < 0 or r >= BOARD_SIZE or c < 0 or c >= BOARD_SIZE:
                    return False, f"Ship {name} out of bounds"
                if (r, c) in all_cells:
                    return False, f"Ship {name} overlaps another ship"
                cells.append((r, c))

            all_cells.update(cells)
            placed_names.add(name)
            ships.append(Ship(name=name, size=size, cells=cells))

        if placed_names != set(SHIP_SIZES.keys()):
            return False, "Must place all 5 ships"

        # Apply placements
        player.ships = ships
        player.board = [[CellState.EMPTY] * BOARD_SIZE for _ in range(BOARD_SIZE)]
        for ship in ships:
            for r, c in ship.cells:
                player.board[r][c] = CellState.SHIP

        player.ships_placed = True

        # Check if both players have placed
        if all(p.ships_placed for p in self.players.values()):
            self.phase = GamePhase.BATTLE
            self.current_turn_index = random.randint(0, 1)

        return True, "Ships placed"

    def fire(
        self, player_id: str, row: int, col: int
    ) -> tuple[bool, str, dict | None]:
        if self.phase != GamePhase.BATTLE:
            return False, "Not in battle phase", None

        if self.current_turn != player_id:
            return False, "Not your turn", None

        if row < 0 or row >= BOARD_SIZE or col < 0 or col >= BOARD_SIZE:
            return False, "Out of bounds", None

        # Get opponent
        opponent_id = [pid for pid in self.player_order if pid != player_id][0]
        opponent = self.players[opponent_id]

        cell = opponent.board[row][col]
        if cell in (CellState.HIT, CellState.MISS, CellState.SUNK):
            return False, "Already fired here", None

        result: dict = {"row": row, "col": col}

        if cell == CellState.SHIP:
            opponent.board[row][col] = CellState.HIT
            # Find which ship was hit
            for ship in opponent.ships:
                if (row, col) in ship.cells:
                    ship.hits.add((row, col))
                    if ship.is_sunk:
                        # Mark all cells as sunk
                        for r, c in ship.cells:
                            opponent.board[r][c] = CellState.SUNK
                        result["result"] = "sunk"
                        result["ship_name"] = ship.name
                        result["ship_cells"] = ship.cells
                    else:
                        result["result"] = "hit"
                    break
        else:
            opponent.board[row][col] = CellState.MISS
            result["result"] = "miss"

        self.players[player_id].shots_fired.append((row, col))

        # Check win condition
        if opponent.all_ships_sunk:
            self.phase = GamePhase.FINISHED
            self.winner = player_id
            result["game_over"] = True
            result["winner"] = player_id
        else:
            # Next turn
            self.current_turn_index = 1 - self.current_turn_index

        return True, result["result"], result

    def get_state_for_player(self, player_id: str) -> dict:
        player = self.players.get(player_id)
        if not player:
            return {}

        opponent_id = [pid for pid in self.player_order if pid != player_id]
        opponent = self.players.get(opponent_id[0]) if opponent_id else None

        # Build opponent's board view (hide ship positions)
        opponent_board = None
        if opponent:
            opponent_board = []
            for r in range(BOARD_SIZE):
                row_data = []
                for c in range(BOARD_SIZE):
                    cell = opponent.board[r][c]
                    if cell == CellState.SHIP:
                        row_data.append(CellState.EMPTY)
                    else:
                        row_data.append(cell)
                opponent_board.append(row_data)

        return {
            "game_id": self.game_id,
            "phase": self.phase,
            "player_id": player_id,
            "your_board": player.board,
            "opponent_board": opponent_board,
            "ships_placed": player.ships_placed,
            "current_turn": self.current_turn,
            "is_your_turn": self.current_turn == player_id,
            "winner": self.winner,
            "player_count": len(self.players),
            "opponent_ships_placed": opponent.ships_placed if opponent else False,
            "ships_remaining": (
                sum(1 for s in opponent.ships if not s.is_sunk) if opponent else 0
            ),
            "your_ships_remaining": sum(1 for s in player.ships if not s.is_sunk),
        }


# Global game store
games: dict[str, Game] = {}


def create_game() -> Game:
    game = Game()
    games[game.game_id] = game
    return game


def get_game(game_id: str) -> Game | None:
    return games.get(game_id)
