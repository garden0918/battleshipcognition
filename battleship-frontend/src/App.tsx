import { useState, useRef } from "react";
import "./App.css";
import "./animations.css";
import { audioManager } from "./audio";
import { GameOverlay, AnimationEvent } from "./GameOverlay";

const BOARD_SIZE = 10;
const SHIPS = [
  { name: "carrier", size: 5, label: "Carrier" },
  { name: "battleship", size: 4, label: "Battleship" },
  { name: "cruiser", size: 3, label: "Cruiser" },
  { name: "submarine", size: 3, label: "Submarine" },
  { name: "destroyer", size: 2, label: "Destroyer" },
];

type CellState = "empty" | "ship" | "hit" | "miss" | "sunk";
type Phase = "placement" | "battle" | "finished";

interface ShipData {
  name: string;
  size: number;
  cells: [number, number][];
  hits: Set<string>;
}

interface Placement {
  name: string;
  row: number;
  col: number;
  horizontal: boolean;
}

// --- AI Logic ---

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function placeShipsRandomly(): { board: CellState[][]; ships: ShipData[] } {
  const board: CellState[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill("empty")
  );
  const ships: ShipData[] = [];

  for (const ship of SHIPS) {
    let placed = false;
    while (!placed) {
      const horizontal = Math.random() > 0.5;
      const row = randomInt(BOARD_SIZE);
      const col = randomInt(BOARD_SIZE);
      const cells: [number, number][] = [];
      let valid = true;

      for (let i = 0; i < ship.size; i++) {
        const r = horizontal ? row : row + i;
        const c = horizontal ? col + i : col;
        if (r >= BOARD_SIZE || c >= BOARD_SIZE || board[r][c] !== "empty") {
          valid = false;
          break;
        }
        cells.push([r, c]);
      }

      if (valid) {
        for (const [r, c] of cells) {
          board[r][c] = "ship";
        }
        ships.push({ name: ship.name, size: ship.size, cells, hits: new Set() });
        placed = true;
      }
    }
  }
  return { board, ships };
}

interface AIState {
  mode: "hunt" | "target";
  targetQueue: [number, number][];
  lastHit: [number, number] | null;
  hitStack: [number, number][];
}

function createAI(): AIState {
  return {
    mode: "hunt",
    targetQueue: [],
    lastHit: null,
    hitStack: [],
  };
}

function getAIShot(
  ai: AIState,
  playerBoard: CellState[][]
): [number, number] {
  // Target mode: try adjacent cells of hits
  while (ai.targetQueue.length > 0) {
    const [r, c] = ai.targetQueue.pop()!;
    if (
      r >= 0 &&
      r < BOARD_SIZE &&
      c >= 0 &&
      c < BOARD_SIZE &&
      playerBoard[r][c] !== "hit" &&
      playerBoard[r][c] !== "miss" &&
      playerBoard[r][c] !== "sunk"
    ) {
      return [r, c];
    }
  }

  // Hunt mode: random shot using checkerboard pattern for efficiency
  const available: [number, number][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (
        playerBoard[r][c] !== "hit" &&
        playerBoard[r][c] !== "miss" &&
        playerBoard[r][c] !== "sunk" &&
        (r + c) % 2 === 0
      ) {
        available.push([r, c]);
      }
    }
  }

  // If checkerboard exhausted, try any remaining
  if (available.length === 0) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (
          playerBoard[r][c] !== "hit" &&
          playerBoard[r][c] !== "miss" &&
          playerBoard[r][c] !== "sunk"
        ) {
          available.push([r, c]);
        }
      }
    }
  }

  return available[randomInt(available.length)];
}

function addAdjacentTargets(ai: AIState, row: number, col: number) {
  const dirs: [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [dr, dc] of dirs) {
    ai.targetQueue.push([row + dr, col + dc]);
  }
}

// --- Board rendering helpers ---

function getCellColor(cell: CellState, isOwn: boolean): string {
  switch (cell) {
    case "ship":
      return isOwn ? "bg-gray-500" : "bg-blue-900";
    case "hit":
      return "bg-red-500";
    case "miss":
      return "bg-blue-300";
    case "sunk":
      return "bg-red-800";
    default:
      return "bg-blue-900";
  }
}

function getCellSymbol(cell: CellState, isOwn: boolean): string {
  switch (cell) {
    case "ship":
      return isOwn ? "" : "";
    case "hit":
      return "X";
    case "miss":
      return "\u2022";
    case "sunk":
      return "X";
    default:
      return "";
  }
}

// --- Main App ---

function App() {
  const [phase, setPhase] = useState<Phase>("placement");
  const [message, setMessage] = useState("Place your ships on the board!");
  const [error, setError] = useState("");

  // Player state
  const [playerBoard, setPlayerBoard] = useState<CellState[][]>(
    () => Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill("empty"))
  );
  const [playerShips, setPlayerShips] = useState<ShipData[]>([]);

  // AI state
  const [aiBoard, setAiBoard] = useState<CellState[][]>([]);
  const [aiShips, setAiShips] = useState<ShipData[]>([]);
  const [aiState, setAiState] = useState<AIState>(createAI);

  // Display board for AI (hides ships)
  const [aiDisplayBoard, setAiDisplayBoard] = useState<CellState[][]>(
    () => Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill("empty"))
  );

  // Placement state
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [horizontal, setHorizontal] = useState(true);
  const [hoverCells, setHoverCells] = useState<[number, number][]>([]);

  // Turn state
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<"player" | "ai" | null>(null);

  // Animation
  const [lastHitCell, setLastHitCell] = useState<{ row: number; col: number } | null>(null);
  const [shakeBoard, setShakeBoard] = useState(false);

  // Game overlay animation
  const [gameAnimation, setGameAnimation] = useState<AnimationEvent | null>(null);
  const pendingActionRef = useRef<"ai-turn" | "player-turn" | null>(null);

  // Audio
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Ship placement helpers
  const getShipCells = (
    row: number,
    col: number,
    size: number,
    horiz: boolean
  ): [number, number][] => {
    const cells: [number, number][] = [];
    for (let i = 0; i < size; i++) {
      const r = horiz ? row : row + i;
      const c = horiz ? col + i : col;
      if (r >= BOARD_SIZE || c >= BOARD_SIZE) return [];
      cells.push([r, c]);
    }
    return cells;
  };

  const isValidPlacement = (cells: [number, number][]): boolean => {
    if (cells.length === 0) return false;
    return cells.every(
      ([r, c]) =>
        !placements.some((p) => {
          const ship = SHIPS.find((s) => s.name === p.name);
          if (!ship) return false;
          const pCells = getShipCells(p.row, p.col, ship.size, p.horizontal);
          return pCells.some(([pr, pc]) => pr === r && pc === c);
        })
    );
  };

  const handlePlacementHover = (row: number, col: number) => {
    if (currentShipIndex >= SHIPS.length) return;
    const ship = SHIPS[currentShipIndex];
    const cells = getShipCells(row, col, ship.size, horizontal);
    setHoverCells(cells);
  };

  const handlePlacementClick = (row: number, col: number) => {
    if (currentShipIndex >= SHIPS.length) return;
    const ship = SHIPS[currentShipIndex];
    const cells = getShipCells(row, col, ship.size, horizontal);
    if (!isValidPlacement(cells)) {
      setError("Invalid placement!");
      return;
    }
    setError("");

    // Update player board
    const newBoard = playerBoard.map((r) => [...r]);
    for (const [r, c] of cells) {
      newBoard[r][c] = "ship";
    }
    setPlayerBoard(newBoard);

    const newPlacements = [
      ...placements,
      { name: ship.name, row, col, horizontal },
    ];
    setPlacements(newPlacements);
    setCurrentShipIndex(currentShipIndex + 1);
    setHoverCells([]);

    // If all ships placed, start battle
    if (newPlacements.length === SHIPS.length) {
      const pShips: ShipData[] = newPlacements.map((p) => {
        const s = SHIPS.find((s) => s.name === p.name)!;
        const shipCells = getShipCells(p.row, p.col, s.size, p.horizontal);
        return { name: p.name, size: s.size, cells: shipCells, hits: new Set<string>() };
      });
      setPlayerShips(pShips);

      // AI places ships
      const { board: aBoard, ships: aShips } = placeShipsRandomly();
      setAiBoard(aBoard);
      setAiShips(aShips);

      setPhase("battle");
      setMessage("Your turn! Click on the enemy board to fire.");
      setIsPlayerTurn(true);
    }
  };

  const resetPlacement = () => {
    setPlacements([]);
    setCurrentShipIndex(0);
    setHoverCells([]);
    setError("");
    setPlayerBoard(
      Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill("empty"))
    );
  };

  // Animation completion handler
  const handleAnimationComplete = () => {
    setGameAnimation(null);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action === "ai-turn") {
      setIsPlayerTurn(false);
      setMessage("AI is thinking...");
      setTimeout(() => doAITurn(), 400);
    } else if (action === "player-turn") {
      setIsPlayerTurn(true);
      setMessage("Your turn!");
    }
  };

  const toggleAudio = () => { audioManager.toggle(); setAudioEnabled(audioManager.enabled); };

  // Fire at AI board
  const handleFire = (row: number, col: number) => {
    if (phase !== "battle" || !isPlayerTurn || gameAnimation) return;
    if (aiDisplayBoard[row][col] !== "empty") return;

    const newAiBoard = aiBoard.map((r) => [...r]);
    const newDisplayBoard = aiDisplayBoard.map((r) => [...r]);

    if (newAiBoard[row][col] === "ship") {
      newAiBoard[row][col] = "hit";
      newDisplayBoard[row][col] = "hit";

      const newAiShips = aiShips.map((s) => ({ ...s, hits: new Set(s.hits) }));
      let hitShipName = "", hitShipLabel = "", hitShipSize = 0, didSink = false;
      for (const ship of newAiShips) {
        if (ship.cells.some(([r, c]) => r === row && c === col)) {
          hitShipName = ship.name;
          hitShipLabel = SHIPS.find((s) => s.name === ship.name)?.label || ship.name;
          hitShipSize = ship.size;
          ship.hits.add(`${row},${col}`);
          if (ship.hits.size === ship.size) {
            didSink = true;
            for (const [r, c] of ship.cells) { newAiBoard[r][c] = "sunk"; newDisplayBoard[r][c] = "sunk"; }
          }
          break;
        }
      }
      setAiShips(newAiShips); setAiBoard(newAiBoard); setAiDisplayBoard(newDisplayBoard);
      setLastHitCell({ row, col }); setTimeout(() => setLastHitCell(null), 600);

      // Check win
      if (newAiShips.every((s) => s.hits.size === s.size)) {
        setPhase("finished"); setWinner("player"); setMessage("YOU WIN!");
        audioManager.playVictory();
        setTimeout(() => { setGameAnimation({ type: "victory" }); }, 300);
        return;
      }
      if (didSink) { audioManager.playSink(hitShipSize); setMessage("You sunk the " + hitShipLabel + "!"); }
      else { audioManager.playHit(); setMessage("Hit!"); }
      setGameAnimation({ type: didSink ? "sink" : "hit", shipName: hitShipName, shipLabel: hitShipLabel, shipSize: hitShipSize, isPlayer: false });
      pendingActionRef.current = "ai-turn";
    } else {
      newAiBoard[row][col] = "miss"; newDisplayBoard[row][col] = "miss";
      setAiBoard(newAiBoard); setAiDisplayBoard(newDisplayBoard);
      audioManager.playMiss(); setMessage("Miss! AI is thinking..."); setIsPlayerTurn(false);
      setTimeout(() => doAITurn(), 800);
    }
  };

  const doAITurn = () => {
    const newPlayerBoard = playerBoard.map((r) => [...r]);
    const newAi = { ...aiState, targetQueue: [...aiState.targetQueue], hitStack: [...aiState.hitStack] };
    const [sr, sc] = getAIShot(newAi, newPlayerBoard);

    if (newPlayerBoard[sr][sc] === "ship") {
      newPlayerBoard[sr][sc] = "hit";
      addAdjacentTargets(newAi, sr, sc);
      newAi.hitStack.push([sr, sc]);
      const newPlayerShips = playerShips.map((s) => ({ ...s, hits: new Set(s.hits) }));
      let hitShipName = "", hitShipLabel = "", hitShipSize = 0, didSink = false;
      for (const ship of newPlayerShips) {
        if (ship.cells.some(([r, c]) => r === sr && c === sc)) {
          hitShipName = ship.name;
          hitShipLabel = SHIPS.find((s) => s.name === ship.name)?.label || ship.name;
          hitShipSize = ship.size;
          ship.hits.add(`${sr},${sc}`);
          if (ship.hits.size === ship.size) {
            didSink = true;
            for (const [r, c] of ship.cells) { newPlayerBoard[r][c] = "sunk"; }
            newAi.targetQueue = []; newAi.hitStack = []; newAi.mode = "hunt";
          } else { newAi.mode = "target"; }
          break;
        }
      }
      setPlayerShips(newPlayerShips); setPlayerBoard(newPlayerBoard); setAiState(newAi);
      setShakeBoard(true); setTimeout(() => setShakeBoard(false), 500);

      // Check AI win
      if (newPlayerShips.every((s) => s.hits.size === s.size)) {
        setPhase("finished"); setWinner("ai"); setMessage("DEFEAT!");
        audioManager.playDefeat();
        setTimeout(() => { setGameAnimation({ type: "defeat" }); }, 300);
        return;
      }
      if (didSink) { audioManager.playSink(hitShipSize); setMessage("Your " + hitShipLabel + " is sunk!"); }
      else { audioManager.playHit(); setMessage("Your " + hitShipLabel + " is hit!"); }
      setGameAnimation({ type: didSink ? "sink" : "hit", shipName: hitShipName, shipLabel: hitShipLabel, shipSize: hitShipSize, isPlayer: true });
      pendingActionRef.current = "player-turn";
    } else {
      newPlayerBoard[sr][sc] = "miss"; setPlayerBoard(newPlayerBoard); setAiState(newAi);
      audioManager.playMiss(); setIsPlayerTurn(true); setMessage("AI missed! Your turn!");
    }
  };

  const startNewGame = () => {
    setPhase("placement");
    setMessage("Place your ships on the board!");
    setError("");
    setPlayerBoard(
      Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill("empty"))
    );
    setPlayerShips([]);
    setAiBoard([]);
    setAiShips([]);
    setAiDisplayBoard(
      Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill("empty"))
    );
    setPlacements([]);
    setCurrentShipIndex(0);
    setHorizontal(true);
    setHoverCells([]);
    setIsPlayerTurn(true);
    setWinner(null);
    setAiState(createAI());
    setLastHitCell(null);
    setShakeBoard(false);
    setGameAnimation(null);
    pendingActionRef.current = null;
  };

  // Counts
  const playerShipsRemaining = playerShips.filter((s) => s.hits.size < s.size).length;
  const aiShipsRemaining = aiShips.filter((s) => s.hits.size < s.size).length;

  // --- Render board ---
  const renderBoard = (
    board: CellState[][],
    isOwn: boolean,
    onClick?: (row: number, col: number) => void,
    onHover?: (row: number, col: number) => void
  ) => {
    const colLabels = "ABCDEFGHIJ".split("");

    return (
      <div className={`inline-block ${shakeBoard && isOwn ? "animate-pulse" : ""}`}>
        <div className="flex">
          <div className="w-7 h-7 sm:w-8 sm:h-8" />
          {colLabels.map((l) => (
            <div
              key={l}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs text-blue-300 font-mono"
            >
              {l}
            </div>
          ))}
        </div>
        {board.map((row, ri) => (
          <div key={ri} className="flex">
            <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs text-blue-300 font-mono">
              {ri + 1}
            </div>
            {row.map((cell, ci) => {
              let extraClasses = "";

              if (
                isOwn &&
                phase === "placement" &&
                placements.some((p) => {
                  const ship = SHIPS.find((s) => s.name === p.name);
                  if (!ship) return false;
                  const cells = getShipCells(p.row, p.col, ship.size, p.horizontal);
                  return cells.some(([r, c]) => r === ri && c === ci);
                })
              ) {
                extraClasses = "bg-gray-500";
              } else if (
                isOwn &&
                phase === "placement" &&
                hoverCells.some(([r, c]) => r === ri && c === ci)
              ) {
                extraClasses = isValidPlacement(hoverCells)
                  ? "bg-green-500/60"
                  : "bg-red-500/60";
              } else {
                extraClasses = getCellColor(cell, isOwn);
              }

              if (lastHitCell && !isOwn && lastHitCell.row === ri && lastHitCell.col === ci) {
                extraClasses += " ring-2 ring-yellow-400 scale-110";
              }

              const clickable =
                !isOwn && phase === "battle" && isPlayerTurn && cell === "empty" && !gameAnimation;

              return (
                <div
                  key={ci}
                  onClick={() => onClick?.(ri, ci)}
                  onMouseEnter={() => onHover?.(ri, ci)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 border border-blue-800/50 flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-150 ${extraClasses} ${
                    clickable ? "cursor-crosshair hover:bg-blue-700" : "cursor-default"
                  }`}
                >
                  <span
                    className={
                      cell === "hit" || cell === "sunk" ? "text-white" : "text-blue-400"
                    }
                  >
                    {getCellSymbol(cell, isOwn)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <div className="text-center py-3 sm:py-4 border-b border-blue-800/50 px-2 relative">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">BATTLESHIP</h1>
        <p className="text-xs sm:text-sm text-slate-400">You vs AI</p>
        <p className="text-blue-300 mt-1 text-sm sm:text-base">{message}</p>
        {error && <p className="text-red-400 text-xs sm:text-sm mt-1">{error}</p>}
        <button onClick={toggleAudio}
          className={`absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-all ${audioEnabled ? "bg-green-800/80 text-green-300 hover:bg-green-700/80" : "bg-slate-700/80 text-slate-400 hover:bg-slate-600/80"}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            {audioEnabled ? (<><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></>) : (<><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></>)}
          </svg>
          <span className="hidden sm:inline">{audioEnabled ? "ON" : "OFF"}</span>
        </button>
      </div>

      {/* Ship placement UI */}
      {phase === "placement" && (
        <div className="flex flex-col items-center py-4 sm:py-6 gap-3 sm:gap-4 px-2">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-1 sm:mb-2">
            <div className="bg-slate-800 rounded-lg px-3 sm:px-4 py-2">
              <span className="text-blue-300 text-xs sm:text-sm">
                Placing:{" "}
                <strong className="text-white">
                  {currentShipIndex < SHIPS.length
                    ? `${SHIPS[currentShipIndex].label} (${SHIPS[currentShipIndex].size})`
                    : "All placed!"}
                </strong>
              </span>
            </div>
            <button
              onClick={() => setHorizontal(!horizontal)}
              className="bg-slate-700 hover:bg-slate-600 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-all"
            >
              {horizontal ? "Horizontal \u2194" : "Vertical \u2195"}
            </button>
            <button
              onClick={resetPlacement}
              className="bg-red-800 hover:bg-red-700 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-all"
            >
              Reset
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-1 sm:gap-2 mb-1 sm:mb-2 px-2">
            {SHIPS.map((ship, i) => (
              <div
                key={ship.name}
                className={`px-2 sm:px-3 py-1 rounded text-[10px] sm:text-xs font-mono ${
                  i < currentShipIndex
                    ? "bg-green-800 text-green-300"
                    : i === currentShipIndex
                    ? "bg-blue-700 text-white ring-1 ring-blue-400"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {ship.label}
              </div>
            ))}
          </div>

          {renderBoard(playerBoard, true, handlePlacementClick, handlePlacementHover)}
        </div>
      )}

      {/* Battle phase */}
      {(phase === "battle" || phase === "finished") && (
        <div className="flex flex-col items-center py-4 sm:py-6 px-2">
          {/* Status bar */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm ${
                phase === "finished"
                  ? winner === "player"
                    ? "bg-green-800 text-green-300 ring-1 ring-green-500"
                    : "bg-red-800 text-red-300 ring-1 ring-red-500"
                  : isPlayerTurn
                  ? "bg-green-800 text-green-300 ring-1 ring-green-500"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {phase === "finished"
                ? winner === "player"
                  ? "VICTORY!"
                  : "DEFEAT"
                : isPlayerTurn
                ? "YOUR TURN"
                : "AI THINKING..."}
            </div>
            <div className="bg-slate-800 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm">
              <span className="text-blue-300">Enemy ships: </span>
              <span className="text-white font-bold">{aiShipsRemaining}</span>
            </div>
            <div className="bg-slate-800 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm">
              <span className="text-blue-300">Your ships: </span>
              <span className="text-white font-bold">{playerShipsRemaining}</span>
            </div>
          </div>

          {/* Enemy Ship Legend */}
          <div className="bg-slate-800/60 rounded-lg px-3 sm:px-4 py-2 sm:py-3 mb-4 sm:mb-6 w-full max-w-md">
            <h3 className="text-[10px] sm:text-xs text-blue-400 uppercase tracking-wider font-bold mb-1 sm:mb-2 text-center">Enemy Fleet</h3>
            <div className="flex flex-wrap justify-center gap-x-3 sm:gap-x-4 gap-y-1">
              {SHIPS.map((ship) => {
                const aiShip = aiShips.find(s => s.name === ship.name);
                const isSunk = aiShip ? aiShip.hits.size === aiShip.size : false;
                return (
                  <div
                    key={ship.name}
                    className={`flex items-center gap-1 text-[11px] sm:text-sm transition-all duration-300 ${
                      isSunk ? 'line-through text-red-400/60' : 'text-blue-200'
                    }`}
                  >
                    <span className={`inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                      isSunk ? 'bg-red-500' : 'bg-green-500'
                    }`} />
                    {ship.label}
                    <span className={isSunk ? 'text-red-400/40' : 'text-blue-400/70'}>({ship.size})</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Boards */}
          <div className="flex flex-col md:flex-row justify-center gap-4 sm:gap-8">
            <div className="text-center">
              <h2 className="text-blue-300 text-xs sm:text-sm font-bold mb-2 uppercase tracking-wider">
                Enemy Waters
              </h2>
              {renderBoard(
                aiDisplayBoard,
                false,
                phase === "battle" ? handleFire : undefined
              )}
            </div>
            <div className="text-center">
              <h2 className="text-blue-300 text-xs sm:text-sm font-bold mb-2 uppercase tracking-wider">
                Your Fleet
              </h2>
              {renderBoard(playerBoard, true)}
            </div>
          </div>

        </div>
      )}

      <GameOverlay event={gameAnimation} onComplete={handleAnimationComplete} onPlayAgain={startNewGame} />
    </div>
  );
}

export default App;
