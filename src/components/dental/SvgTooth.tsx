import { cn } from '@/lib/utils';

// Tooth outline paths - viewBox: 0 0 40 80
// Upper teeth: root at top (y≈0-40), crown at bottom (y≈40-78)
const TOOTH_SHAPES: Record<string, { outline: string; details?: string[]; cervical?: string; rootLines?: string[] }> = {
  centralIncisor: {
    outline: "M20,2 C18,2 15,8 14,18 C13,28 12,36 11,44 C10,50 9,56 9,62 C9,66 11,72 15,75 Q20,78 25,75 C29,72 31,66 31,62 C31,56 30,50 29,44 C28,36 27,28 26,18 C25,8 22,2 20,2Z",
    cervical: "M11,46 Q20,42 29,46",
    rootLines: [
      "M16,10 Q18,20 17,34",
      "M24,10 Q22,20 23,34",
    ],
  },
  lateralIncisor: {
    outline: "M20,3 C18,3 16,10 15,18 C14,28 13,36 13,44 C12,50 12,56 12,62 C13,66 15,72 18,74 Q20,76 22,74 C25,72 27,66 28,62 C28,56 28,50 27,44 C27,36 26,28 25,18 C24,10 22,3 20,3Z",
    cervical: "M13,44 Q20,40 27,44",
    rootLines: [
      "M17,8 Q18,22 17,36",
      "M23,8 Q22,22 23,36",
    ],
  },
  canine: {
    outline: "M20,2 C18,2 15,8 14,20 C13,30 12,38 11,46 C10,52 10,58 11,64 C13,70 16,74 20,78 C24,74 27,70 29,64 C30,58 30,52 29,46 C28,38 27,30 26,20 C25,8 22,2 20,2Z",
    cervical: "M11,46 Q20,42 29,46",
    rootLines: [
      "M17,6 Q18,22 17,38",
      "M23,6 Q22,22 23,38",
    ],
  },
  premolar: {
    outline: "M20,4 C18,4 15,10 14,20 C13,28 12,36 11,44 C10,50 10,56 11,62 C12,66 14,70 17,74 L20,72 L23,74 C26,70 28,66 29,62 C30,56 30,50 29,44 C28,36 27,28 26,20 C25,10 22,4 20,4Z",
    cervical: "M11,44 Q20,40 29,44",
    details: ["M14,58 Q20,52 26,58"],
    rootLines: [
      "M17,8 Q18,22 17,36",
      "M23,8 Q22,22 23,36",
    ],
  },
  molar: {
    outline: "M13,2 C11,2 9,8 8,16 L7,28 C7,34 9,38 13,40 C12,46 11,52 11,58 C11,64 13,70 17,74 L20,76 L23,74 C27,70 29,64 29,58 C29,52 28,46 27,40 C31,38 33,34 33,28 L32,16 C31,8 29,2 27,2 C25,2 23,6 20,12 C17,6 15,2 13,2Z",
    cervical: "M11,40 Q20,36 29,40",
    details: [
      "M14,56 Q17,50 20,54 Q23,50 26,56",
      "M16,60 Q20,56 24,60",
    ],
    rootLines: [
      "M11,6 Q12,18 11,30",
      "M20,14 Q20,22 20,32",
      "M29,6 Q28,18 29,30",
    ],
  },
  wisdom: {
    outline: "M15,4 C13,4 11,10 10,18 L10,28 C10,34 11,38 14,40 C13,46 12,52 12,58 C12,64 14,68 17,72 L20,74 L23,72 C26,68 28,64 28,58 C28,52 27,46 26,40 C29,38 30,34 30,28 L30,18 C30,10 27,4 25,4 C23,4 22,6 20,10 C18,6 17,4 15,4Z",
    cervical: "M12,40 Q20,36 28,40",
    details: ["M15,56 Q20,50 25,56"],
    rootLines: [
      "M14,8 Q14,18 14,30",
      "M26,8 Q26,18 26,30",
    ],
  },
};

function getToothShape(toothNumber: number) {
  const pos = toothNumber % 10;
  const quadrant = Math.floor(toothNumber / 10);
  const isDeciduous = quadrant >= 5;

  if (isDeciduous) {
    switch (pos) {
      case 1: case 2: return TOOTH_SHAPES.centralIncisor;
      case 3: return TOOTH_SHAPES.canine;
      case 4: case 5: return TOOTH_SHAPES.molar;
      default: return TOOTH_SHAPES.centralIncisor;
    }
  }

  switch (pos) {
    case 1: return TOOTH_SHAPES.centralIncisor;
    case 2: return TOOTH_SHAPES.lateralIncisor;
    case 3: return TOOTH_SHAPES.canine;
    case 4: case 5: return TOOTH_SHAPES.premolar;
    case 6: case 7: return TOOTH_SHAPES.molar;
    case 8: return TOOTH_SHAPES.wisdom;
    default: return TOOTH_SHAPES.centralIncisor;
  }
}

function shouldMirror(toothNumber: number): boolean {
  const quadrant = Math.floor(toothNumber / 10);
  return quadrant === 1 || quadrant === 4 || quadrant === 5 || quadrant === 8;
}

interface SvgToothProps {
  toothNumber: number;
  isLower?: boolean;
  isMissing?: boolean;
  statusColor?: string | null;
  isHovered?: boolean;
  className?: string;
  width?: number;
  height?: number;
  /** Extra SVG elements rendered inside the tooth group (e.g. condition overlays) */
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
  const shape = getToothShape(toothNumber);
  const mirror = shouldMirror(toothNumber);
  const id = `t${toothNumber}`;

  // Build transform: flip for lower teeth, mirror for right-side quadrants
  const transforms: string[] = [];
  // Lower teeth: no vertical flip — roots face the bite line (anatomical convention)
  if (mirror) transforms.push('scaleX(-1)');
  const groupTransform = transforms.length > 0
    ? `translate(20,40) ${transforms.join(' ')} translate(-20,-40)`
    : undefined;

  return (
    <svg
      viewBox="0 0 40 80"
      width={width}
      height={height}
      className={className}
      style={{
        filter: !isMissing && isHovered ? 'brightness(1.05) drop-shadow(0 2px 6px rgba(0,0,0,0.15))' : undefined,
        transition: 'filter 0.3s',
      }}
    >
      {isMissing ? (
        /* Absent tooth: dashed outline only */
        <g transform={groupTransform}>
          <path
            d={shape.outline}
            fill="none"
            stroke="#b0a89a"
            strokeWidth="0.8"
            strokeDasharray="3 2"
            opacity={0.35}
          />
          {/* Small X in the middle to indicate absence */}
          {(!overlays || overlays.length === 0) && (
            <>
              <line x1="16" y1="36" x2="24" y2="44" stroke="#b0a89a" strokeWidth="0.8" opacity="0.3" />
              <line x1="24" y1="36" x2="16" y2="44" stroke="#b0a89a" strokeWidth="0.8" opacity="0.3" />
            </>
          )}
          {/* Condition overlays (e.g. implant) */}
          {overlays && overlays}
        </g>
      ) : (
        <>
          <defs>
            {/* Main body gradient - warm ivory 3D */}
            <linearGradient id={`g-${id}`} x1="0.15" y1="0" x2="0.85" y2="1">
              <stop offset="0%" stopColor="#faf6ee" />
              <stop offset="20%" stopColor="#f3ecda" />
              <stop offset="45%" stopColor="#ebe2cc" />
              <stop offset="70%" stopColor="#ddd3b8" />
              <stop offset="90%" stopColor="#d2c7a8" />
              <stop offset="100%" stopColor="#c9bd9c" />
            </linearGradient>

            {/* Crown enamel - brighter white on the crown portion */}
            <linearGradient id={`ce-${id}`} x1="0.5" y1="0.5" x2="0.5" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="30%" stopColor="white" stopOpacity="0.15" />
              <stop offset="70%" stopColor="white" stopOpacity="0.25" />
              <stop offset="100%" stopColor="white" stopOpacity="0.1" />
            </linearGradient>

            {/* Specular highlight - left edge shine */}
            <linearGradient id={`h-${id}`} x1="0" y1="0.3" x2="1" y2="0.7">
              <stop offset="0%" stopColor="white" stopOpacity="0.45" />
              <stop offset="30%" stopColor="white" stopOpacity="0.12" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            {/* Root shadow gradient - darker toward apex */}
            <linearGradient id={`rs-${id}`} x1="0.5" y1="0" x2="0.5" y2="0.6">
              <stop offset="0%" stopColor="#a89878" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#a89878" stopOpacity="0" />
            </linearGradient>

            {/* Edge shadow for depth */}
            <radialGradient id={`es-${id}`} cx="0.5" cy="0.55" r="0.5">
              <stop offset="65%" stopColor="transparent" />
              <stop offset="100%" stopColor="#8a7c5e" stopOpacity="0.12" />
            </radialGradient>
          </defs>

          <g transform={groupTransform}>
            {/* Drop shadow */}
            <path
              d={shape.outline}
              fill="rgba(0,0,0,0.05)"
              transform="translate(1, 1.2)"
            />

            {/* Main tooth fill */}
            <path
              d={shape.outline}
              fill={`url(#g-${id})`}
              stroke="#bfb494"
              strokeWidth="0.6"
              strokeLinejoin="round"
            />

            {/* Root darkening */}
            <path d={shape.outline} fill={`url(#rs-${id})`} />

            {/* Edge depth */}
            <path d={shape.outline} fill={`url(#es-${id})`} />

            {/* Crown enamel brightness */}
            <path d={shape.outline} fill={`url(#ce-${id})`} />

            {/* Specular highlight */}
            <path d={shape.outline} fill={`url(#h-${id})`} />

            {/* Root canal lines (subtle internal anatomy) */}
            {shape.rootLines?.map((line, i) => (
              <path
                key={`rl-${i}`}
                d={line}
                fill="none"
                stroke="#c4b898"
                strokeWidth="0.35"
                strokeLinecap="round"
                opacity={0.3}
              />
            ))}

            {/* Cervical line */}
            {shape.cervical && (
              <path
                d={shape.cervical}
                fill="none"
                stroke="#bfb494"
                strokeWidth="0.6"
                strokeLinecap="round"
                opacity={0.55}
              />
            )}

            {/* Anatomical details (fissures) */}
            {shape.details?.map((detail, i) => (
              <path
                key={i}
                d={detail}
                fill="none"
                stroke="#b0a070"
                strokeWidth="0.5"
                strokeLinecap="round"
                opacity={0.4}
              />
            ))}

            {/* Status color overlay */}
            {statusColor && (
              <path
                d={shape.outline}
                fill={statusColor}
                opacity={isHovered ? 0.4 : 0.25}
              />
            )}

            {/* Condition overlays */}
            {overlays && overlays}
          </g>
        </>
      )}
    </svg>
  );
}

// Get appropriate dimensions based on tooth type
export function getToothDimensions(toothNumber: number, isDeciduous: boolean = false) {
  if (isDeciduous) {
    return { width: 62, height: 86 };
  }
  const pos = toothNumber % 10;
  switch (pos) {
    case 1: return { width: 72, height: 120 };
    case 2: return { width: 64, height: 110 };
    case 3: return { width: 68, height: 126 };
    case 4: return { width: 68, height: 108 };
    case 5: return { width: 64, height: 104 };
    case 6: return { width: 86, height: 120 };
    case 7: return { width: 82, height: 116 };
    case 8: return { width: 72, height: 104 };
    default: return { width: 68, height: 108 };
  }
}
