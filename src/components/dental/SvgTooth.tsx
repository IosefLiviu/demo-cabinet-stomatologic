import React from 'react';

// ─── Anatomically accurate dental SVG tooth paths ────────────────────────────
// Each tooth type has a clean outline with distinct crown, cervical constriction,
// and visible root(s). Molars have 2-3 roots with furcation areas.
// All paths drawn in a 0 0 40 80 viewBox (crown at top, root at bottom).

interface ToothPathData {
  outline: string;       // Full tooth outline path
  crownLine: string;     // Cervical/CEJ line separating crown from root
  rootLines?: string[];  // Internal root separation lines
  cusps?: string[];      // Cusp/surface detail lines
  viewBox: string;
}

// 8 tooth types mapped to FDI position number (1-8)
const TOOTH_PATHS: Record<number, ToothPathData> = {
  // 1 = Central Incisor - wide flat crown, single tapered root
  1: {
    outline: "M12,2 C12,2 10,1 8,2 C6,3 5,5 5,8 L5,12 C5,15 6,18 7,20 C8,22 8,24 8,26 L8,28 C8,30 7,32 7,34 C7,36 7,38 7,40 L7,42 C7,48 8,56 9,62 C9.5,66 10,70 11,74 C11.5,76 12,78 13,80 L14,82 C14.5,84 15,86 16,88 L17,88 C18,86 18.5,84 19,82 L20,80 C21,78 21.5,76 22,74 C23,70 23.5,66 24,62 C25,56 26,48 26,42 L26,40 C26,38 26,36 26,34 C26,32 25,30 25,28 L25,26 C25,24 25,22 26,20 C27,18 28,15 28,12 L28,8 C28,5 27,3 25,2 C23,1 21,2 21,2 L12,2 Z",
    crownLine: "M6,28 Q10,26 17,26 Q23,26 27,28",
    cusps: [
      "M10,5 Q17,3 23,5",   // Incisal edge detail
    ],
    viewBox: "3 -1 28 92",
  },

  // 2 = Lateral Incisor - slightly narrower than central, single root
  2: {
    outline: "M13,2 C11,1.5 9,2 8,4 C7,6 6.5,8 6.5,11 L6.5,14 C6.5,17 7,19 8,21 C9,23 9,25 9,27 L9,30 C9,33 8.5,36 8.5,40 C8.5,44 9,52 10,60 C10.5,64 11,68 12,72 C12.5,75 13,78 14,80 L15,82 C15.5,83 16,84 17,84 C18,84 18.5,83 19,82 L20,80 C21,78 21.5,75 22,72 C23,68 23.5,64 24,60 C25,52 25.5,44 25.5,40 C25.5,36 25,33 25,30 L25,27 C25,25 25,23 26,21 C27,19 27.5,17 27.5,14 L27.5,11 C27.5,8 27,6 26,4 C25,2 23,1.5 21,2 L13,2 Z",
    crownLine: "M7.5,30 Q11,28 17,28 Q23,28 26.5,30",
    cusps: [
      "M11,4 Q17,2.5 23,4",
    ],
    viewBox: "4 -1 26 88",
  },

  // 3 = Canine - pointed crown, long single root
  3: {
    outline: "M11,6 C9,5 7,6 6,8 C5,10 5,13 5,16 L5,19 C5,21 6,23 7,24 L9,26 C10,27 10,28 10,30 L10,33 C10,36 9.5,40 9.5,44 C9.5,48 10,56 11,64 C11.5,68 12,72 13,76 C13.5,79 14,82 15,85 C15.5,87 16,90 17,92 C18,90 18.5,87 19,85 C20,82 20.5,79 21,76 C22,72 22.5,68 23,64 C24,56 24.5,48 24.5,44 C24.5,40 24,36 24,33 L24,30 C24,28 24,27 25,26 L27,24 C28,23 29,21 29,19 L29,16 C29,13 29,10 28,8 C27,6 25,5 23,6 L18,10 L17,2 L16,10 L11,6 Z",
    crownLine: "M7,33 Q11,31 17,31 Q23,31 27,33",
    cusps: [
      "M11,7 L17,2 L23,7",   // Canine cusp tip
    ],
    viewBox: "3 -1 28 96",
  },

  // 4 = First Premolar - two cusps, bifurcated root (or single)
  4: {
    outline: "M10,5 C8,4 6,5 5.5,8 C5,10 5,13 5,16 L5,19 C5,21 5.5,23 6.5,25 L8,27 C9,28 9,29 9,30 L9,32 C9,34 8.5,37 8.5,40 C8.5,43 8,48 8,52 C8,56 8.5,60 9,64 C9.5,68 10,72 11,76 C11.5,78 12,80 12.5,80 C13,80 13.5,78 14,74 C14.5,70 15,66 15,62 L15,58 C15.5,56 16,55 17,55 C18,55 18.5,56 19,58 L19,62 C19,66 19.5,70 20,74 C20.5,78 21,80 21.5,80 C22,80 22.5,78 23,76 C24,72 24.5,68 25,64 C25.5,60 26,56 26,52 C26,48 25.5,43 25.5,40 C25.5,37 25,34 25,32 L25,30 C25,29 25,28 26,27 L27.5,25 C28.5,23 29,21 29,19 L29,16 C29,13 29,10 28.5,8 C28,5 26,4 24,5 L20,8 L17,3 L14,8 L10,5 Z",
    crownLine: "M7,32 Q11,30 17,30 Q23,30 27,32",
    rootLines: [
      "M15,55 L17,42",  // Root bifurcation
      "M19,55 L17,42",
    ],
    cusps: [
      "M10,6 L14,8 L17,3 L20,8 L24,6",  // Two cusps
    ],
    viewBox: "3 0 28 84",
  },

  // 5 = Second Premolar - two cusps, single root
  5: {
    outline: "M10,5 C8,4 6.5,5.5 6,8 C5.5,10 5.5,13 5.5,16 L5.5,19 C5.5,21 6,23 7,25 L8.5,27 C9.5,28 9.5,29 9.5,31 L9.5,33 C9.5,36 9,39 9,42 C9,46 9.5,52 10,58 C10.5,62 11,66 12,70 C12.5,73 13,76 14,79 C14.5,81 15.5,83 17,84 C18.5,83 19.5,81 20,79 C21,76 21.5,73 22,70 C23,66 23.5,62 24,58 C24.5,52 25,46 25,42 C25,39 24.5,36 24.5,33 L24.5,31 C24.5,29 24.5,28 25.5,27 L27,25 C28,23 28.5,21 28.5,19 L28.5,16 C28.5,13 28.5,10 28,8 C27.5,5.5 26,4 24,5 L20,8 L17,3 L14,8 L10,5 Z",
    crownLine: "M7.5,33 Q12,31 17,31 Q22,31 26.5,33",
    cusps: [
      "M10,6 L14,8 L17,3 L20,8 L24,6",
    ],
    viewBox: "3 0 28 88",
  },

  // 6 = First Molar (upper) - wide crown, 3 roots
  6: {
    outline: "M7,6 C5,5 3.5,7 3,10 C2.5,13 2.5,16 2.5,19 L2.5,22 C2.5,24 3,26 4,28 L5.5,30 C6.5,31 7,32 7,34 L7,36 C7,38 6.5,40 6.5,42 C6.5,44 6,48 5.5,52 C5,56 4.5,60 4.5,64 C4.5,68 5,72 5.5,74 C6,76 6.5,77 7,77 C7.5,77 8,76 8.5,73 C9,70 9.5,66 10,62 L10.5,58 C11,55 12,53 13,53 C14,53 14.5,55 14.5,58 L14.5,62 C14.5,66 15,72 15.5,76 C16,80 16.5,84 17,86 L18,86 C18.5,84 19,80 19.5,76 C20,72 20.5,66 20.5,62 L20.5,58 C20.5,55 21,53 22,53 C23,53 24,55 24.5,58 L25,62 C25.5,66 26,70 26.5,73 C27,76 27.5,77 28,77 C28.5,77 29,76 29.5,74 C30,72 30.5,68 30.5,64 C30.5,60 30,56 29.5,52 C29,48 28.5,44 28.5,42 C28.5,40 28,38 28,36 L28,34 C28,32 28.5,31 29.5,30 L31,28 C32,26 32.5,24 32.5,22 L32.5,19 C32.5,16 32.5,13 32,10 C31.5,7 30,5 28,6 L23,10 L20,7 L17,4 L14,7 L11,10 L7,6 Z",
    crownLine: "M5,36 Q10,34 17.5,34 Q25,34 30,36",
    rootLines: [
      "M10.5,58 L13,44",   // Left root (palatal)
      "M14.5,58 L17,44",   // Center
      "M20.5,58 L17,44",   // Center
      "M24.5,58 L22,44",   // Right root (buccal)
    ],
    cusps: [
      "M7,7 L11,10 L14,7 L17,4 L20,7 L23,10 L28,7",  // Multi-cusp
      "M10,12 Q17.5,10 25,12",   // Ridge line
    ],
    viewBox: "0 1 35 90",
  },

  // 7 = Second Molar - similar to first molar, slightly smaller, 3 roots
  7: {
    outline: "M8,6 C6,5 4.5,7 4,10 C3.5,12 3.5,15 3.5,18 L3.5,21 C3.5,23 4,25 5,27 L6.5,29 C7.5,30 7.5,31 7.5,33 L7.5,35 C7.5,37 7,39 7,41 C7,44 6.5,48 6,52 C5.5,56 5.5,60 5.5,63 C5.5,66 6,70 6.5,72 C7,74 7.5,75 8,75 C8.5,75 9,73 9.5,70 C10,67 10.5,64 11,60 L11.5,56 C12,54 12.5,52 14,52 C15,52 15.5,54 15.5,56 L16,62 C16.5,66 17,72 17.5,76 C18,78 18.5,80 19,80 C19.5,80 20,78 20.5,76 C21,72 21.5,66 22,62 L22.5,56 C22.5,54 23,52 24,52 C25.5,52 26,54 26.5,56 L27,60 C27.5,64 28,67 28.5,70 C29,73 29.5,75 30,75 C30.5,75 31,74 31.5,72 C32,70 32.5,66 32.5,63 C32.5,60 32.5,56 32,52 C31.5,48 31,44 31,41 C31,39 30.5,37 30.5,35 L30.5,33 C30.5,31 30.5,30 31.5,29 L33,27 C34,25 34.5,23 34.5,21 L34.5,18 C34.5,15 34.5,12 34,10 C33.5,7 32,5 30,6 L25,9 L21,6 L17,4 L13,6 L9,9 L8,6 Z",
    crownLine: "M6,35 Q12,33 19,33 Q26,33 32,35",
    rootLines: [
      "M11.5,56 L14,44",
      "M15.5,56 L17,44",
      "M22,56 L19,44",
      "M26.5,56 L24,44",
    ],
    cusps: [
      "M8,7 L13,6 L17,4 L21,6 L25,9 L30,7",
      "M11,11 Q19,9 27,11",
    ],
    viewBox: "1 1 36 82",
  },

  // 8 = Third Molar (Wisdom) - smaller, irregular crown, 2-3 fused roots
  8: {
    outline: "M10,6 C8,5 6.5,7 6,10 C5.5,12 5.5,15 5.5,17 L5.5,20 C5.5,22 6,24 7,25.5 L8,27 C9,28 9,29 9,31 L9,33 C9,35 8.5,38 8.5,40 C8.5,43 8,47 7.5,51 C7,55 7,58 7,61 C7,64 7.5,67 8,69 C8.5,71 9,73 10,75 C10.5,76 11.5,77 13,78 C14,78.5 15.5,79 17,79 C18.5,79 20,78.5 21,78 C22.5,77 23.5,76 24,75 C25,73 25.5,71 26,69 C26.5,67 27,64 27,61 C27,58 27,55 26.5,51 C26,47 25.5,43 25.5,40 C25.5,38 25,35 25,33 L25,31 C25,29 25,28 26,27 L27,25.5 C28,24 28.5,22 28.5,20 L28.5,17 C28.5,15 28.5,12 28,10 C27.5,7 26,5 24,6 L21,8 L17,4 L13,8 L10,6 Z",
    crownLine: "M7,33 Q11,31 17,31 Q23,31 27,33",
    cusps: [
      "M10,7 L13,8 L17,4 L21,8 L24,7",
      "M12,10 Q17,8.5 22,10",
    ],
    viewBox: "4 1 26 82",
  },
};

// ─── FDI to tooth type mapping ──────────────────────────────────────────────
function getToothTypeAndMirror(toothNumber: number): { type: number; mirror: boolean } {
  const quadrant = Math.floor(toothNumber / 10);
  const position = toothNumber % 10;

  // For deciduous teeth (5x-8x), map to closest permanent type
  if (quadrant >= 5) {
    const deciduousMap: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };
    const type = deciduousMap[position] || 1;
    const mirror = quadrant === 5 || quadrant === 8;
    return { type, mirror };
  }

  // Quadrants 1,4 = right side (mirror), 2,3 = left side
  const mirror = quadrant === 1 || quadrant === 4;
  return { type: position, mirror };
}

// ─── Component ─────────────────────────────────────────────────────────────
interface SvgToothProps {
  toothNumber: number;
  isLower?: boolean;
  isMissing?: boolean;
  statusColor?: string | null;
  isHovered?: boolean;
  className?: string;
  width?: number;
  height?: number;
  overlays?: React.ReactNode[];
}

export function SvgTooth({
  toothNumber,
  isLower = false,
  isMissing = false,
  statusColor,
  isHovered = false,
  className,
  width = 36,
  height = 52,
  overlays,
}: SvgToothProps) {
  const { type, mirror } = getToothTypeAndMirror(toothNumber);
  const toothData = TOOTH_PATHS[type] || TOOTH_PATHS[1];
  const id = `t${toothNumber}`;

  const vbParts = toothData.viewBox.split(' ').map(Number);
  const [vbX, , vbW, vbH] = vbParts;
  const centerX = vbX + vbW / 2;

  const mirrorTransform = mirror
    ? `translate(${centerX * 2}, 0) scale(-1, 1)`
    : undefined;

  return (
    <svg
      viewBox={toothData.viewBox}
      width={width}
      height={height}
      className={className}
      style={{
        transform: isLower ? 'rotate(180deg)' : undefined,
        filter: !isMissing && isHovered
          ? 'brightness(1.08) drop-shadow(0 2px 8px rgba(0,0,0,0.18))'
          : undefined,
        transition: 'filter 0.3s',
      }}
    >
      <defs>
        {/* Crown gradient - ivory white */}
        <linearGradient id={`gc-${id}`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#fefefe" />
          <stop offset="30%" stopColor="#faf7f0" />
          <stop offset="70%" stopColor="#f0ebe0" />
          <stop offset="100%" stopColor="#e8e0d2" />
        </linearGradient>

        {/* Root gradient - slightly darker, bone color */}
        <linearGradient id={`gr-${id}`} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#f0ebe0" />
          <stop offset="50%" stopColor="#e5ddd0" />
          <stop offset="100%" stopColor="#d8cfc0" />
        </linearGradient>

        {/* Enamel highlight */}
        <linearGradient id={`gh-${id}`} x1="0.3" y1="0" x2="0.7" y2="0.5">
          <stop offset="0%" stopColor="white" stopOpacity="0.6" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        <clipPath id={`clip-${id}`}>
          <path d={toothData.outline} />
        </clipPath>
      </defs>

      {isMissing ? (
        <g transform={mirrorTransform}>
          <path
            d={toothData.outline}
            fill="none"
            stroke="#b0a89a"
            strokeWidth="0.8"
            strokeDasharray="3 2"
            opacity={0.35}
          />
          {(!overlays || overlays.length === 0) && (
            <>
              <line
                x1={vbX + vbW * 0.3} y1={vbParts[1] + vbH * 0.3}
                x2={vbX + vbW * 0.7} y2={vbParts[1] + vbH * 0.7}
                stroke="#b0a89a" strokeWidth="0.8" opacity="0.3"
              />
              <line
                x1={vbX + vbW * 0.7} y1={vbParts[1] + vbH * 0.3}
                x2={vbX + vbW * 0.3} y2={vbParts[1] + vbH * 0.7}
                stroke="#b0a89a" strokeWidth="0.8" opacity="0.3"
              />
            </>
          )}
          {overlays && overlays}
        </g>
      ) : (
        <g transform={mirrorTransform}>
          {/* Soft drop shadow */}
          <path
            d={toothData.outline}
            fill="rgba(0,0,0,0.04)"
            transform="translate(0.6, 1.2)"
          />

          {/* Main tooth body - root color (base layer) */}
          <path
            d={toothData.outline}
            fill={`url(#gr-${id})`}
            stroke="#c0b8a8"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Crown area - brighter enamel overlay (clipped to outline) */}
          <g clipPath={`url(#clip-${id})`}>
            {/* Enamel cap - paint the crown portion brighter */}
            <rect
              x={vbX}
              y={vbParts[1]}
              width={vbW + vbX * 2}
              height={35}
              fill={`url(#gc-${id})`}
            />
            {/* Highlight sheen */}
            <rect
              x={vbX}
              y={vbParts[1]}
              width={vbW + vbX * 2}
              height={25}
              fill={`url(#gh-${id})`}
            />
          </g>

          {/* Cervical line (CEJ) */}
          <path
            d={toothData.crownLine}
            fill="none"
            stroke="#c8bfb0"
            strokeWidth="0.5"
            strokeLinecap="round"
            opacity={0.7}
          />

          {/* Root separation lines */}
          {toothData.rootLines?.map((d, i) => (
            <path
              key={`rl-${i}`}
              d={d}
              fill="none"
              stroke="#c8bfb0"
              strokeWidth="0.4"
              strokeLinecap="round"
              opacity={0.5}
            />
          ))}

          {/* Cusp detail lines */}
          {toothData.cusps?.map((d, i) => (
            <path
              key={`cp-${i}`}
              d={d}
              fill="none"
              stroke="#d0c8b8"
              strokeWidth="0.4"
              strokeLinecap="round"
              opacity={0.5}
            />
          ))}

          {/* Status color overlay */}
          {statusColor && (
            <path
              d={toothData.outline}
              fill={statusColor}
              opacity={isHovered ? 0.4 : 0.25}
            />
          )}

          {/* Condition overlays */}
          {overlays && overlays}
        </g>
      )}
    </svg>
  );
}

export function getToothDimensions(toothNumber: number, isDeciduous: boolean = false) {
  if (isDeciduous) {
    return { width: 34, height: 56 };
  }
  const pos = toothNumber % 10;
  switch (pos) {
    case 1: return { width: 36, height: 70 };
    case 2: return { width: 34, height: 66 };
    case 3: return { width: 36, height: 72 };
    case 4: return { width: 36, height: 66 };
    case 5: return { width: 36, height: 66 };
    case 6: return { width: 46, height: 74 };
    case 7: return { width: 44, height: 70 };
    case 8: return { width: 36, height: 64 };
    default: return { width: 36, height: 66 };
  }
}
