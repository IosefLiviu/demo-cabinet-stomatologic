import { cn } from '@/lib/utils';

// Tooth outline paths - viewBox: 0 0 40 80
// Upper teeth: root at top (y≈0-40), crown at bottom (y≈40-78)
const TOOTH_SHAPES: Record<string, { outline: string; details?: string[]; cervical?: string }> = {
  centralIncisor: {
    outline: "M20,4 C17,4 14,14 13,26 C12,34 11,42 10,50 C9,58 9,64 10,68 C11,72 14,76 20,76 C26,76 29,72 30,68 C31,64 31,58 30,50 C29,42 28,34 27,26 C26,14 23,4 20,4Z",
    cervical: "M10,50 Q20,46 30,50",
  },
  lateralIncisor: {
    outline: "M20,5 C18,5 16,14 15,24 C14,32 13,40 13,48 C12,54 12,60 13,66 C14,70 16,74 20,74 C24,74 26,70 27,66 C28,60 28,54 27,48 C27,40 26,32 25,24 C24,14 22,5 20,5Z",
    cervical: "M13,48 Q20,44 27,48",
  },
  canine: {
    outline: "M20,3 C18,3 15,12 14,24 C13,34 12,42 11,50 C10,56 10,62 12,68 C14,72 17,76 20,78 C23,76 26,72 28,68 C30,62 30,56 29,50 C28,42 27,34 26,24 C25,12 22,3 20,3Z",
    cervical: "M11,50 Q20,46 29,50",
  },
  premolar: {
    outline: "M20,6 C18,6 15,14 14,24 C13,32 12,40 11,48 C10,54 10,60 11,64 C12,68 14,72 17,75 L20,72 L23,75 C26,72 28,68 29,64 C30,60 30,54 29,48 C28,40 27,32 26,24 C25,14 22,6 20,6Z",
    cervical: "M11,48 Q20,44 29,48",
    details: ["M14,60 Q20,54 26,60"],
  },
  molar: {
    outline: "M13,3 C11,3 9,10 8,20 L7,30 C7,36 9,40 13,42 C12,48 11,54 11,60 C11,66 13,72 17,75 L20,76 L23,75 C27,72 29,66 29,60 C29,54 28,48 27,42 C31,40 33,36 33,30 L32,20 C31,10 29,3 27,3 C25,3 23,8 20,14 C17,8 15,3 13,3Z",
    cervical: "M11,42 Q20,38 29,42",
    details: [
      "M14,58 Q17,52 20,56 Q23,52 26,58",
      "M16,62 Q20,58 24,62",
    ],
  },
  wisdom: {
    outline: "M15,5 C13,5 11,12 10,20 L10,30 C10,36 11,40 14,42 C13,48 12,54 12,60 C12,66 14,70 17,73 L20,74 L23,73 C26,70 28,66 28,60 C28,54 27,48 26,42 C29,40 30,36 30,30 L30,20 C30,12 27,5 25,5 C23,5 22,8 20,12 C18,8 17,5 15,5Z",
    cervical: "M12,42 Q20,38 28,42",
    details: ["M15,58 Q20,52 25,58"],
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
}: SvgToothProps) {
  const shape = getToothShape(toothNumber);
  const mirror = shouldMirror(toothNumber);
  const id = `t${toothNumber}`;

  // Build transform: flip for lower teeth, mirror for right-side quadrants
  const transforms: string[] = [];
  if (isLower) transforms.push('scaleY(-1)');
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
        opacity: isMissing ? 0.15 : 1,
        filter: isMissing ? 'grayscale(1)' : isHovered ? 'brightness(1.05) drop-shadow(0 2px 6px rgba(0,0,0,0.15))' : undefined,
        transition: 'opacity 0.3s, filter 0.3s',
      }}
    >
      <defs>
        {/* Main body gradient - warm ivory 3D */}
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7f2e8" />
          <stop offset="25%" stopColor="#f0e9d8" />
          <stop offset="55%" stopColor="#e6ddca" />
          <stop offset="85%" stopColor="#d8ceb8" />
          <stop offset="100%" stopColor="#cfc4aa" />
        </linearGradient>

        {/* Specular highlight */}
        <linearGradient id={`h-${id}`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="40%" stopColor="white" stopOpacity="0.15" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        {/* Root shadow gradient */}
        <linearGradient id={`rs-${id}`} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#b8a88a" stopOpacity="0.3" />
          <stop offset="60%" stopColor="#b8a88a" stopOpacity="0" />
        </linearGradient>

        {/* Edge shadow for depth */}
        <radialGradient id={`es-${id}`} cx="0.5" cy="0.6" r="0.5">
          <stop offset="70%" stopColor="transparent" />
          <stop offset="100%" stopColor="#a0926e" stopOpacity="0.15" />
        </radialGradient>
      </defs>

      <g transform={groupTransform}>
        {/* Drop shadow */}
        <path
          d={shape.outline}
          fill="rgba(0,0,0,0.06)"
          transform="translate(1.2, 1.5)"
        />

        {/* Main tooth fill */}
        <path
          d={shape.outline}
          fill={`url(#g-${id})`}
          stroke="#c4b898"
          strokeWidth="0.7"
          strokeLinejoin="round"
        />

        {/* Root darkening */}
        <path
          d={shape.outline}
          fill={`url(#rs-${id})`}
        />

        {/* Edge depth */}
        <path
          d={shape.outline}
          fill={`url(#es-${id})`}
        />

        {/* Specular highlight */}
        <path
          d={shape.outline}
          fill={`url(#h-${id})`}
        />

        {/* Cervical line */}
        {shape.cervical && (
          <path
            d={shape.cervical}
            fill="none"
            stroke="#c4b898"
            strokeWidth="0.5"
            strokeLinecap="round"
            opacity={0.5}
          />
        )}

        {/* Anatomical details (fissures) */}
        {shape.details?.map((detail, i) => (
          <path
            key={i}
            d={detail}
            fill="none"
            stroke="#b8a680"
            strokeWidth="0.6"
            strokeLinecap="round"
            opacity={0.45}
          />
        ))}

        {/* Status color overlay */}
        {statusColor && !isMissing && (
          <path
            d={shape.outline}
            fill={statusColor}
            opacity={isHovered ? 0.4 : 0.25}
          />
        )}
      </g>
    </svg>
  );
}

// Get appropriate dimensions based on tooth type
export function getToothDimensions(toothNumber: number, isDeciduous: boolean = false) {
  if (isDeciduous) {
    return { width: 26, height: 36 };
  }
  const pos = toothNumber % 10;
  switch (pos) {
    case 1: return { width: 34, height: 54 };
    case 2: return { width: 30, height: 50 };
    case 3: return { width: 32, height: 56 };
    case 4: return { width: 32, height: 48 };
    case 5: return { width: 30, height: 46 };
    case 6: return { width: 40, height: 54 };
    case 7: return { width: 38, height: 52 };
    case 8: return { width: 34, height: 46 };
    default: return { width: 32, height: 48 };
  }
}
