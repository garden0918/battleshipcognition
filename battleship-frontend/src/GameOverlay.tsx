import React, { useEffect, useState, useRef } from "react";
import { getShipSVG } from "./ShipGraphics";

export interface AnimationEvent {
  type: "hit" | "sink" | "victory" | "defeat";
  shipName?: string;
  shipLabel?: string;
  shipSize?: number;
  isPlayer?: boolean;
}

interface GameOverlayProps {
  event: AnimationEvent | null;
  onComplete: () => void;
  onPlayAgain: () => void;
}

function ExplosionParticles({
  count,
  spread,
  duration,
}: {
  count: number;
  spread: number;
  duration: number;
}) {
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const dist = spread * (0.5 + Math.random() * 0.5);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const size = 4 + Math.random() * 10;
    const delay = Math.random() * 0.4;
    const colors = ["#ff6b00", "#ff9500", "#ffcc00", "#ff4400", "#ff8800"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return { dx, dy, size, delay, color, key: i };
  });

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.key}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: "50%",
            top: "50%",
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
            animation: `particle-fly ${duration}s ease-out ${p.delay}s forwards`,
            "--dx": `${p.dx}px`,
            "--dy": `${p.dy}px`,
            opacity: 0,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

function ShipOnFire({ intensity }: { intensity: number }) {
  const fires = Array.from({ length: intensity * 3 + 2 }, (_, i) => ({
    key: i,
    left: 10 + Math.random() * 80,
    top: 10 + Math.random() * 60,
    delay: Math.random() * 0.5,
    size: 8 + Math.random() * 14,
  }));

  return (
    <>
      {fires.map((f) => (
        <div
          key={f.key}
          className="absolute"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: f.size,
            height: f.size * 1.5,
            background:
              "radial-gradient(circle, #ffcc00 0%, #ff6b00 40%, transparent 70%)",
            borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
            animation: `fire-flicker 0.3s ease-in-out ${f.delay}s infinite alternate`,
            filter: "blur(1px)",
          }}
        />
      ))}
    </>
  );
}

function Confetti({ count, isSink }: { count: number; isSink: boolean }) {
  const id = useRef(Math.random().toString(36).slice(2, 8));
  const pieces = useRef(
    Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
      const spread = isSink ? 300 : 180;
      const dist = spread * (0.3 + Math.random() * 0.7);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist * 0.6 - dist * 0.4;
      const endDx = dx * 1.5 + (Math.random() - 0.5) * 60;
      const endDy = dy * 0.5 + 200 + Math.random() * 150;
      const size = 8 + Math.random() * 10;
      const delay = Math.random() * 0.25;
      const duration = 1.0 + Math.random() * 0.8;
      const spin = (Math.random() - 0.5) * 1080;
      const colors = ["#FFD700", "#FF1493", "#00FFFF", "#FF6600", "#39FF14", "#4488FF", "#FF4444", "#FFAA00", "#FF66CC", "#FFFFFF", "#FFA500"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const isRibbon = Math.random() > 0.6;
      return { dx, dy, endDx, endDy, size, delay, duration, spin, color, isRibbon, key: i };
    })
  ).current;

  const keyframes = pieces.map((p) => {
    const name = `cf-${id.current}-${p.key}`;
    return `@keyframes ${name} {
      0% { transform: translate(0px, 0px) rotate(0deg) scale(0.3); opacity: 1; }
      15% { transform: translate(${p.dx * 0.4}px, ${p.dy * 0.4}px) rotate(${p.spin * 0.2}deg) scale(1.2); opacity: 1; }
      60% { transform: translate(${p.dx}px, ${p.dy}px) rotate(${p.spin * 0.6}deg) scale(1); opacity: 0.9; }
      100% { transform: translate(${p.endDx}px, ${p.endDy}px) rotate(${p.spin}deg) scale(0.4); opacity: 0; }
    }`;
  });

  return (
    <>
      <style>{keyframes.join("\n")}</style>
      {pieces.map((p) => (
        <div
          key={p.key}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: p.isRibbon ? p.size * 0.35 : p.size,
            height: p.isRibbon ? p.size * 2 : p.size,
            backgroundColor: p.color,
            borderRadius: p.isRibbon ? "2px" : Math.random() > 0.5 ? "50%" : "3px",
            animation: `cf-${id.current}-${p.key} ${p.duration}s cubic-bezier(0.25,0.46,0.45,0.94) ${p.delay}s both`,
            boxShadow: `0 0 6px ${p.color}80`,
            zIndex: 60,
          }}
        />
      ))}
    </>
  );
}

function SmokePuffs({ count }: { count: number }) {
  const puffs = Array.from({ length: count }, (_, i) => ({
    key: i,
    left: 20 + Math.random() * 60,
    delay: Math.random() * 1.5,
    size: 20 + Math.random() * 30,
  }));

  return (
    <>
      {puffs.map((p) => (
        <div
          key={p.key}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: "40%",
            width: p.size,
            height: p.size,
            background: "radial-gradient(circle, rgba(100,100,100,0.6) 0%, transparent 70%)",
            animation: `smoke-rise 2s ease-out ${p.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}
    </>
  );
}

export const GameOverlay: React.FC<GameOverlayProps> = ({
  event,
  onComplete,
  onPlayAgain,
}) => {
  const [showPlayAgain, setShowPlayAgain] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const onPlayAgainRef = useRef(onPlayAgain);
  onCompleteRef.current = onComplete;
  onPlayAgainRef.current = onPlayAgain;

  useEffect(() => {
    if (!event) {
      setShowPlayAgain(false);
      return;
    }
    setShowPlayAgain(false);

    let duration: number;
    if (event.type === "hit") {
      duration = 1600;
    } else if (event.type === "sink") {
      duration = 2200 + (event.shipSize || 3) * 450;
    } else {
      duration = 4000;
    }

    const doneTimer = setTimeout(() => {
      if (event.type === "victory" || event.type === "defeat") {
        setShowPlayAgain(true);
      } else {
        onCompleteRef.current();
      }
    }, duration);

    return () => {
      clearTimeout(doneTimer);
    };
  }, [event]);

  if (!event) return null;

  // Victory / Defeat screen
  if (event.type === "victory" || event.type === "defeat") {
    const isVictory = event.type === "victory";
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 game-overlay-bg"
          style={{
            background: isVictory
              ? "radial-gradient(ellipse at center, rgba(20,83,45,0.85) 0%, rgba(15,23,42,0.95) 50%, rgba(0,0,0,0.98) 100%)"
              : "radial-gradient(ellipse at center, rgba(127,29,29,0.85) 0%, rgba(15,23,42,0.95) 50%, rgba(0,0,0,0.98) 100%)",
          }}
        />

        <div className="relative flex flex-col items-center z-10">
          {/* Particles */}
          <div
            className="absolute"
            style={{ width: 500, height: 500, left: -250, top: -250 }}
          >
            <ExplosionParticles
              count={isVictory ? 40 : 20}
              spread={250}
              duration={3}
            />
          </div>

          <div className={`game-result-text ${isVictory ? "victory-text" : "defeat-text"}`}>
            <h1
              className="text-5xl sm:text-8xl font-black mb-3"
              style={{
                background: isVictory
                  ? "linear-gradient(to bottom, #fde047, #f59e0b, #ea580c)"
                  : "linear-gradient(to bottom, #f87171, #dc2626, #7f1d1d)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "none",
                filter: `drop-shadow(0 0 30px ${isVictory ? "rgba(245,158,11,0.5)" : "rgba(220,38,38,0.5)"})`,
              }}
            >
              {isVictory ? "VICTORY!" : "DEFEAT"}
            </h1>
            <p
              className={`text-lg sm:text-2xl font-semibold ${
                isVictory ? "text-yellow-300" : "text-red-300"
              }`}
            >
              {isVictory
                ? "All enemy ships destroyed!"
                : "Your fleet has been destroyed."}
            </p>
          </div>

          {showPlayAgain && (
            <button
              onClick={() => onPlayAgainRef.current()}
              className="mt-10 play-again-fade-in"
              style={{
                background: isVictory
                  ? "linear-gradient(135deg, #f59e0b, #ea580c)"
                  : "linear-gradient(135deg, #3b82f6, #1e40af)",
                color: "white",
                fontSize: "1.25rem",
                fontWeight: 800,
                padding: "16px 48px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                boxShadow: isVictory
                  ? "0 0 30px rgba(245,158,11,0.4)"
                  : "0 0 30px rgba(59,130,246,0.4)",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              Play Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Hit or Sink animation
  const ShipComponent = event.shipName ? getShipSVG(event.shipName) : null;
  const shipSize = event.shipSize || 3;
  const isSink = event.type === "sink";
  const svgWidth = 120 + shipSize * 35;
  const sinkDuration = 1.5 + shipSize * 0.35;
  const isPlayerAttack = !event.isPlayer;

  return (
    <>
      {/* Confetti layer - OUTSIDE the overlay stacking context */}
      {isPlayerAttack && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, pointerEvents: "none", overflow: "hidden" }}>
          {/* Screen flash */}
          <div style={{
            position: "absolute", inset: 0,
            background: isSink
              ? "radial-gradient(circle at center, rgba(255,215,0,0.4) 0%, rgba(255,165,0,0.2) 40%, transparent 70%)"
              : "radial-gradient(circle at center, rgba(0,255,100,0.25) 0%, rgba(0,200,80,0.1) 40%, transparent 70%)",
            animation: "celebration-flash 0.8s ease-out forwards",
          }} />
          <Confetti count={isSink ? shipSize * 15 + 25 : 30} isSink={isSink} />
        </div>
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="absolute inset-0 bg-black/50 game-overlay-bg" />

        <div className="relative flex flex-col items-center z-10">
          {/* Ship graphic */}
          {ShipComponent && (
            <div
              className={`relative ${isSink ? "ship-sink-crack" : "ship-hit-shake"}`}
              style={{
                width: svgWidth,
                animationDuration: isSink ? `${sinkDuration}s` : "0.8s",
              }}
            >
              {isSink ? (
                <>
                  {/* Left half cracks away */}
                  <div
                    className="ship-crack-left"
                    style={{
                      animationDuration: `${sinkDuration}s`,
                      animationDelay: "0.6s",
                    }}
                  >
                    <div style={{ clipPath: "inset(0 50% 0 0)" }}>
                      <ShipComponent style={{ width: svgWidth }} />
                    </div>
                  </div>
                  {/* Right half cracks away */}
                  <div
                    className="ship-crack-right absolute top-0 left-0"
                    style={{
                      animationDuration: `${sinkDuration}s`,
                      animationDelay: "0.6s",
                    }}
                  >
                    <div style={{ clipPath: "inset(0 0 0 50%)" }}>
                      <ShipComponent style={{ width: svgWidth }} />
                    </div>
                  </div>
                </>
              ) : (
                <ShipComponent style={{ width: svgWidth }} />
              )}

              {/* Fire on ship */}
              <div className="absolute inset-0">
                <ShipOnFire intensity={isSink ? shipSize : 1} />
              </div>

              {/* Smoke for sinking */}
              {isSink && (
                <div className="absolute inset-0">
                  <SmokePuffs count={shipSize * 2} />
                </div>
              )}
            </div>
          )}

          {/* Explosion particles */}
          <div
            className="absolute"
            style={{
              width: svgWidth * 1.8,
              height: svgWidth * 1.2,
              left: -(svgWidth * 0.4),
              top: -(svgWidth * 0.1),
            }}
          >
            <ExplosionParticles
              count={isSink ? shipSize * 8 : 10}
              spread={isSink ? svgWidth * 0.7 : svgWidth * 0.35}
              duration={isSink ? 1.8 : 0.8}
            />
          </div>

          {/* Message */}
          <div className={`mt-8 text-center ${isPlayerAttack ? "celebration-text" : "animation-text-pop"}`}>
            <p
              className="font-black"
              style={{
                fontSize: isSink ? "clamp(1.5rem, 5vw, 2.5rem)" : "clamp(1.2rem, 4vw, 1.8rem)",
                background: isPlayerAttack
                  ? isSink
                    ? "linear-gradient(to bottom, #fde047, #f59e0b, #ea580c)"
                    : "linear-gradient(to bottom, #a3e635, #22c55e)"
                  : isSink
                  ? "linear-gradient(to bottom, #fb923c, #dc2626)"
                  : "linear-gradient(to bottom, #fdba74, #f97316)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: isPlayerAttack
                  ? "drop-shadow(0 2px 12px rgba(245,200,0,0.7))"
                  : "drop-shadow(0 2px 8px rgba(255,100,0,0.6))",
              }}
            >
              {event.isPlayer
                ? isSink
                  ? `Your ${event.shipLabel} is sunk!`
                  : `Your ${event.shipLabel} is hit!`
                : isSink
                ? `You sunk the ${event.shipLabel}!`
                : "Direct Hit!"}
            </p>
            {isPlayerAttack && !isSink && (
              <p className="text-green-400 text-sm mt-1 font-semibold" style={{ opacity: 0, animation: "text-pop-in 0.4s ease-out 0.6s forwards" }}>
                Keep firing!
              </p>
            )}
            {isPlayerAttack && isSink && (
              <p className="text-yellow-300 text-sm mt-1 font-bold" style={{ opacity: 0, animation: "text-pop-in 0.4s ease-out 0.6s forwards" }}>
                Enemy ship destroyed!
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
