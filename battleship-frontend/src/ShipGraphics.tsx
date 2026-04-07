import React from "react";

interface ShipSVGProps {
  className?: string;
  style?: React.CSSProperties;
}

export function getShipSVG(
  shipName: string
): React.FC<ShipSVGProps> {
  switch (shipName) {
    case "carrier":
      return CarrierSVG;
    case "battleship":
      return BattleshipSVG;
    case "cruiser":
      return CruiserSVG;
    case "submarine":
      return SubmarineSVG;
    case "destroyer":
      return DestroyerSVG;
    default:
      return DestroyerSVG;
  }
}

const CarrierSVG: React.FC<ShipSVGProps> = ({ className, style }) => (
  <svg viewBox="0 0 260 55" className={className} style={style} fill="none">
    <defs>
      <linearGradient id="hull-carrier" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7a8694" />
        <stop offset="100%" stopColor="#4a5568" />
      </linearGradient>
    </defs>
    <path
      d="M8,32 L25,18 L235,18 L252,32 L248,40 L12,40 Z"
      fill="url(#hull-carrier)"
      stroke="#2d3748"
      strokeWidth="1.2"
    />
    <rect x="30" y="20" width="200" height="4" rx="1" fill="#5a6577" opacity="0.8" />
    <rect
      x="185" y="7" width="22" height="11" rx="2"
      fill="#5a6577" stroke="#2d3748" strokeWidth="0.8"
    />
    <rect x="192" y="2" width="3" height="5" fill="#8a95a5" />
    <rect x="198" y="4" width="2" height="3" fill="#8a95a5" />
    <line x1="50" y1="22" x2="175" y2="22" stroke="#8a95a5" strokeWidth="0.4" strokeDasharray="5,4" />
    <polygon points="70,21 75,19 80,21" fill="#8a95a5" opacity="0.5" />
    <polygon points="110,21 115,19 120,21" fill="#8a95a5" opacity="0.5" />
    <polygon points="150,21 155,19 160,21" fill="#8a95a5" opacity="0.5" />
  </svg>
);

const BattleshipSVG: React.FC<ShipSVGProps> = ({ className, style }) => (
  <svg viewBox="0 0 220 55" className={className} style={style} fill="none">
    <defs>
      <linearGradient id="hull-battleship" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7a8694" />
        <stop offset="100%" stopColor="#4a5568" />
      </linearGradient>
    </defs>
    <path
      d="M5,34 L30,20 L190,20 L215,34 L210,42 L10,42 Z"
      fill="url(#hull-battleship)"
      stroke="#2d3748"
      strokeWidth="1.2"
    />
    <rect
      x="90" y="10" width="40" height="10" rx="2"
      fill="#5a6577" stroke="#2d3748" strokeWidth="0.8"
    />
    <circle cx="55" cy="24" r="6" fill="#5a6577" stroke="#2d3748" strokeWidth="0.8" />
    <line x1="42" y1="24" x2="55" y2="24" stroke="#4a5568" strokeWidth="2" />
    <circle cx="165" cy="24" r="6" fill="#5a6577" stroke="#2d3748" strokeWidth="0.8" />
    <line x1="165" y1="24" x2="178" y2="24" stroke="#4a5568" strokeWidth="2" />
    <line x1="110" y1="10" x2="110" y2="2" stroke="#8a95a5" strokeWidth="1.5" />
  </svg>
);

const CruiserSVG: React.FC<ShipSVGProps> = ({ className, style }) => (
  <svg viewBox="0 0 180 50" className={className} style={style} fill="none">
    <defs>
      <linearGradient id="hull-cruiser" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7a8694" />
        <stop offset="100%" stopColor="#4a5568" />
      </linearGradient>
    </defs>
    <path
      d="M5,30 L25,18 L155,18 L175,30 L170,37 L10,37 Z"
      fill="url(#hull-cruiser)"
      stroke="#2d3748"
      strokeWidth="1.2"
    />
    <rect
      x="70" y="9" width="30" height="9" rx="2"
      fill="#5a6577" stroke="#2d3748" strokeWidth="0.8"
    />
    <circle cx="45" cy="22" r="5" fill="#5a6577" stroke="#2d3748" strokeWidth="0.8" />
    <line x1="35" y1="22" x2="45" y2="22" stroke="#4a5568" strokeWidth="1.5" />
    <line x1="85" y1="9" x2="85" y2="2" stroke="#8a95a5" strokeWidth="1" />
  </svg>
);

const SubmarineSVG: React.FC<ShipSVGProps> = ({ className, style }) => (
  <svg viewBox="0 0 180 50" className={className} style={style} fill="none">
    <defs>
      <linearGradient id="hull-sub" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5a6577" />
        <stop offset="100%" stopColor="#3a4556" />
      </linearGradient>
    </defs>
    <ellipse cx="90" cy="30" rx="80" ry="14" fill="url(#hull-sub)" stroke="#2d3748" strokeWidth="1.2" />
    <rect
      x="75" y="14" width="25" height="10" rx="3"
      fill="#5a6577" stroke="#2d3748" strokeWidth="0.8"
    />
    <line x1="90" y1="14" x2="90" y2="6" stroke="#8a95a5" strokeWidth="1.5" />
    <rect x="88" y="5" width="4" height="3" rx="1" fill="#8a95a5" />
    <path d="M170,28 L175,25 L175,35 L170,32 Z" fill="#4a5568" />
  </svg>
);

const DestroyerSVG: React.FC<ShipSVGProps> = ({ className, style }) => (
  <svg viewBox="0 0 150 45" className={className} style={style} fill="none">
    <defs>
      <linearGradient id="hull-destroyer" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7a8694" />
        <stop offset="100%" stopColor="#4a5568" />
      </linearGradient>
    </defs>
    <path
      d="M5,28 L25,18 L125,18 L145,28 L140,34 L10,34 Z"
      fill="url(#hull-destroyer)"
      stroke="#2d3748"
      strokeWidth="1.2"
    />
    <rect
      x="55" y="10" width="20" height="8" rx="2"
      fill="#5a6577" stroke="#2d3748" strokeWidth="0.8"
    />
    <circle cx="35" cy="21" r="3.5" fill="#5a6577" stroke="#2d3748" strokeWidth="0.8" />
    <line x1="28" y1="21" x2="35" y2="21" stroke="#4a5568" strokeWidth="1.5" />
    <line x1="65" y1="10" x2="65" y2="4" stroke="#8a95a5" strokeWidth="1" />
  </svg>
);
