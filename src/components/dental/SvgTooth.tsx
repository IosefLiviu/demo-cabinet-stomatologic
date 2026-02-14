import { cn } from '@/lib/utils';

// Realistic tooth outline paths - viewBox: 0 0 40 80
// Upper teeth: root at top (y≈0-40), crown at bottom (y≈40-78)
const TOOTH_SHAPES: Record<string, {
  outline: string;
  cervical?: string;
  rootLines?: string[];
  details?: string[];
  cusps?: string[];
  // Additional shape layers for 3D realism
  innerHighlight?: string;
  shadowEdge?: string;
}> = {
  centralIncisor: {
    outline: "M20,1 C18.5,1 16.5,4 15.5,10 C14.5,16 14,22 13.5,28 C13,33 12.5,37 12,41 C11.5,45 11,48 10.5,52 C10,56 9.8,60 10,64 C10.3,68 11.5,71 14,74 C16,76 18,77.5 20,78 C22,77.5 24,76 26,74 C28.5,71 29.7,68 30,64 C30.2,60 30,56 29.5,52 C29,48 28.5,45 28,41 C27.5,37 27,33 26.5,28 C26,22 25.5,16 24.5,10 C23.5,4 21.5,1 20,1Z",
    innerHighlight: "M20,6 C19,6 17.5,10 16.5,18 C15.5,26 15,34 14.5,40 C14,44 13.5,48 13,53 C12.8,57 13,62 14,66 C15.5,70 17.5,73 20,74 C22.5,73 24.5,70 26,66 C27,62 27.2,57 27,53 C26.5,48 26,44 25.5,40 C25,34 24.5,26 23.5,18 C22.5,10 21,6 20,6Z",
    cervical: "M12,42 Q16,39 20,38 Q24,39 28,42",
    rootLines: [
      "M17,5 Q18,15 17.5,32",
      "M23,5 Q22,15 22.5,32",
    ],
    cusps: [
      "M13,64 Q16,58 20,56 Q24,58 27,64",
    ],
  },
  lateralIncisor: {
    outline: "M20,3 C18.5,3 17,6 16,12 C15,18 14.5,24 14,30 C13.5,35 13,39 12.8,43 C12.5,47 12.3,51 12.5,55 C12.7,59 13,63 14.5,67 C16,70 17.5,73 20,74 C22.5,73 24,70 25.5,67 C27,63 27.3,59 27.5,55 C27.7,51 27.5,47 27.2,43 C27,39 26.5,35 26,30 C25.5,24 25,18 24,12 C23,6 21.5,3 20,3Z",
    innerHighlight: "M20,7 C19,7 17.8,10 17,16 C16,23 15.5,29 15.2,34 C15,38 14.8,42 14.8,46 C14.8,50 15,55 16,60 C17,65 18.5,69 20,70 C21.5,69 23,65 24,60 C25,55 25.2,50 25.2,46 C25.2,42 25,38 24.8,34 C24.5,29 24,23 23,16 C22.2,10 21,7 20,7Z",
    cervical: "M13,44 Q16.5,41 20,40 Q23.5,41 27,44",
    rootLines: [
      "M17.5,6 Q18,18 17.8,36",
      "M22.5,6 Q22,18 22.2,36",
    ],
    cusps: [
      "M14,62 Q17,57 20,55 Q23,57 26,62",
    ],
  },
  canine: {
    outline: "M20,1 C18.5,1 16,4 15,10 C14,17 13.2,24 12.5,30 C12,35 11.5,39 11,43 C10.5,47 10.2,51 10.5,55 C10.8,59 11.5,63 13.5,67 C15.5,71 17.5,74 20,78 C22.5,74 24.5,71 26.5,67 C28.5,63 29.2,59 29.5,55 C29.8,51 29.5,47 29,43 C28.5,39 28,35 27.5,30 C26.8,24 26,17 25,10 C24,4 21.5,1 20,1Z",
    innerHighlight: "M20,5 C19,5 17,8 16,15 C15,22 14.2,29 13.8,34 C13.3,39 13,43 12.8,47 C12.6,51 13,56 14.5,61 C16,65 18,70 20,73 C22,70 24,65 25.5,61 C27,56 27.4,51 27.2,47 C27,43 26.7,39 26.2,34 C25.8,29 25,22 24,15 C23,8 21,5 20,5Z",
    cervical: "M11,44 Q15.5,40 20,39 Q24.5,40 29,44",
    rootLines: [
      "M17,4 Q18,18 17.5,36",
      "M23,4 Q22,18 22.5,36",
    ],
    cusps: [
      "M13,62 Q16.5,56 20,52 Q23.5,56 27,62",
    ],
  },
  premolar: {
    outline: "M20,4 C18,4 16,8 15,14 C14,20 13.5,26 13,32 C12.5,36 12,40 11.5,44 C11,48 10.8,52 11,56 C11.2,60 12,64 14,68 C15.5,71 17.5,73 20,74 C22.5,73 24.5,71 26,68 C28,64 28.8,60 29,56 C29.2,52 29,48 28.5,44 C28,40 27.5,36 27,32 C26.5,26 26,20 25,14 C24,8 22,4 20,4Z",
    innerHighlight: "M20,8 C18.5,8 17,12 16,18 C15,24 14.5,30 14.2,35 C14,39 13.8,43 13.5,47 C13.3,51 13.5,55 14.5,60 C15.5,64 17.5,68 20,70 C22.5,68 24.5,64 25.5,60 C26.5,55 26.7,51 26.5,47 C26.2,43 26,39 25.8,35 C25.5,30 25,24 24,18 C23,12 21.5,8 20,8Z",
    cervical: "M12,44 Q16,40 20,39 Q24,40 28,44",
    details: ["M14.5,58 Q17,53 20,52 Q23,53 25.5,58"],
    rootLines: [
      "M16,8 Q17,20 16.5,36",
      "M24,8 Q23,20 23.5,36",
    ],
    cusps: [
      "M14,60 L17,55 L20,57 L23,55 L26,60",
    ],
  },
  molar: {
    outline: "M14,2 C12,2 10,6 9,12 C8,18 7.5,24 7.5,30 C8,35 9,38 12,41 C11.5,45 11,50 11,55 C11,60 12,64 14.5,68 C16.5,71 18,73 20,74 C22,73 23.5,71 25.5,68 C28,64 29,60 29,55 C29,50 28.5,45 28,41 C31,38 32,35 32.5,30 C32.5,24 32,18 31,12 C30,6 28,2 26,2 C24.5,2 22.5,5 20,10 C17.5,5 15.5,2 14,2Z",
    innerHighlight: "M14.5,6 C13,6 11.5,10 10.5,16 C9.5,22 9.2,28 9.8,33 C10.5,37 12,39 14,40 C13,45 12.5,50 12.5,55 C12.5,59 13.5,63 15.5,66 C17.5,69 19,71 20,71 C21,71 22.5,69 24.5,66 C26.5,63 27.5,59 27.5,55 C27.5,50 27,45 26,40 C28,39 29.5,37 30.2,33 C30.8,28 30.5,22 29.5,16 C28.5,10 27,6 25.5,6 C24,6 22.5,8 20,12 C17.5,8 16,6 14.5,6Z",
    cervical: "M12,42 Q16,38 20,37 Q24,38 28,42",
    details: [
      "M14.5,56 Q17,51 20,54 Q23,51 25.5,56",
      "M16,60 Q20,56 24,60",
    ],
    rootLines: [
      "M12,5 Q13,16 12,30",
      "M20,12 Q20,20 20,32",
      "M28,5 Q27,16 28,30",
    ],
    cusps: [
      "M13.5,58 L16,53 L18.5,55 L20,52 L21.5,55 L24,53 L26.5,58",
    ],
  },
  wisdom: {
    outline: "M15.5,4 C14,4 12,8 11,14 C10,20 10,26 10.2,31 C10.5,35 11.5,38 14,41 C13.5,45 13,50 13,55 C13,59 14,63 16,67 C17.5,70 19,72 20,73 C21,72 22.5,70 24,67 C26,63 27,59 27,55 C27,50 26.5,45 26,41 C28.5,38 29.5,35 29.8,31 C30,26 30,20 29,14 C28,8 26,4 24.5,4 C23.2,4 22,6 20,9 C18,6 16.8,4 15.5,4Z",
    innerHighlight: "M16,8 C14.8,8 13,12 12.2,18 C11.5,24 11.5,29 12,33 C12.5,36 13.5,38 15,40 C14.5,44 14,49 14,54 C14,58 15,61 16.5,64 C18,67 19.5,68 20,68 C20.5,68 22,67 23.5,64 C25,61 26,58 26,54 C26,49 25.5,44 25,40 C26.5,38 27.5,36 28,33 C28.5,29 28.5,24 27.8,18 C27,12 25.2,8 24,8 C23,8 22,10 20,12 C18,10 17,8 16,8Z",
    cervical: "M14,42 Q17,38 20,37 Q23,38 26,42",
    details: ["M15.5,56 Q20,50 24.5,56"],
    rootLines: [
      "M14,7 Q14.5,18 14,32",
      "M26,7 Q25.5,18 26,32",
    ],
    cusps: [
      "M15,58 L18,53 L20,55 L22,53 L25,58",
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

  const transforms: string[] = [];
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
        transform: isLower ? 'rotate(180deg)' : undefined,
        filter: !isMissing && isHovered ? 'brightness(1.08) drop-shadow(0 2px 8px rgba(0,0,0,0.18))' : undefined,
        transition: 'filter 0.3s',
      }}
    >
      {isMissing ? (
        <g transform={groupTransform}>
          <path
            d={shape.outline}
            fill="none"
            stroke="#b0a89a"
            strokeWidth="0.8"
            strokeDasharray="3 2"
            opacity={0.35}
          />
          {(!overlays || overlays.length === 0) && (
            <>
              <line x1="16" y1="36" x2="24" y2="44" stroke="#b0a89a" strokeWidth="0.8" opacity="0.3" />
              <line x1="24" y1="36" x2="16" y2="44" stroke="#b0a89a" strokeWidth="0.8" opacity="0.3" />
            </>
          )}
          {overlays && overlays}
        </g>
      ) : (
        <>
          <defs>
            {/* Main body gradient - realistic ivory/bone 3D feel */}
            <linearGradient id={`g-${id}`} x1="0.1" y1="0" x2="0.9" y2="1">
              <stop offset="0%" stopColor="#f5f0e4" />
              <stop offset="15%" stopColor="#efe8d6" />
              <stop offset="35%" stopColor="#e8dfc8" />
              <stop offset="55%" stopColor="#ddd3b6" />
              <stop offset="75%" stopColor="#d4c9a4" />
              <stop offset="90%" stopColor="#c8bb94" />
              <stop offset="100%" stopColor="#bfb088" />
            </linearGradient>

            {/* Crown enamel - brighter white sheen on crown */}
            <linearGradient id={`ce-${id}`} x1="0.5" y1="0.45" x2="0.5" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="20%" stopColor="white" stopOpacity="0.08" />
              <stop offset="50%" stopColor="white" stopOpacity="0.22" />
              <stop offset="80%" stopColor="white" stopOpacity="0.15" />
              <stop offset="100%" stopColor="white" stopOpacity="0.05" />
            </linearGradient>

            {/* Left specular highlight - simulates light from left */}
            <linearGradient id={`h-${id}`} x1="0" y1="0.2" x2="0.6" y2="0.8">
              <stop offset="0%" stopColor="white" stopOpacity="0.5" />
              <stop offset="20%" stopColor="white" stopOpacity="0.2" />
              <stop offset="50%" stopColor="white" stopOpacity="0.05" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            {/* Right edge shadow - depth on right side */}
            <linearGradient id={`rs2-${id}`} x1="1" y1="0.3" x2="0.3" y2="0.7">
              <stop offset="0%" stopColor="#8a7c5e" stopOpacity="0.2" />
              <stop offset="40%" stopColor="#8a7c5e" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#8a7c5e" stopOpacity="0" />
            </linearGradient>

            {/* Root darkening toward apex */}
            <linearGradient id={`rs-${id}`} x1="0.5" y1="0" x2="0.5" y2="0.55">
              <stop offset="0%" stopColor="#a09070" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#a09070" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#a09070" stopOpacity="0" />
            </linearGradient>

            {/* Ambient occlusion - edge darkening for 3D roundness */}
            <radialGradient id={`ao-${id}`} cx="0.5" cy="0.52" r="0.48">
              <stop offset="60%" stopColor="transparent" />
              <stop offset="85%" stopColor="#7a6c50" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#7a6c50" stopOpacity="0.18" />
            </radialGradient>

            {/* Inner body highlight for 3D volume */}
            <radialGradient id={`ih-${id}`} cx="0.42" cy="0.55" r="0.35" fx="0.38" fy="0.5">
              <stop offset="0%" stopColor="white" stopOpacity="0.18" />
              <stop offset="50%" stopColor="white" stopOpacity="0.06" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>

            {/* Clip for inner highlight */}
            <clipPath id={`clip-${id}`}>
              <path d={shape.outline} />
            </clipPath>
          </defs>

          <g transform={groupTransform}>
            {/* Soft drop shadow */}
            <path
              d={shape.outline}
              fill="rgba(0,0,0,0.06)"
              transform="translate(0.8, 1.5)"
            />

            {/* Main tooth fill */}
            <path
              d={shape.outline}
              fill={`url(#g-${id})`}
              stroke="#b5a880"
              strokeWidth="0.55"
              strokeLinejoin="round"
            />

            {/* Root darkening */}
            <path d={shape.outline} fill={`url(#rs-${id})`} />

            {/* Right edge shadow */}
            <path d={shape.outline} fill={`url(#rs2-${id})`} />

            {/* Ambient occlusion (edge depth) */}
            <path d={shape.outline} fill={`url(#ao-${id})`} />

            {/* Inner volume highlight */}
            {shape.innerHighlight && (
              <g clipPath={`url(#clip-${id})`}>
                <path d={shape.innerHighlight} fill={`url(#ih-${id})`} />
              </g>
            )}

            {/* Crown enamel brightness */}
            <path d={shape.outline} fill={`url(#ce-${id})`} />

            {/* Left specular highlight */}
            <path d={shape.outline} fill={`url(#h-${id})`} />

            {/* Root canal lines (subtle internal anatomy) */}
            {shape.rootLines?.map((line, i) => (
              <path
                key={`rl-${i}`}
                d={line}
                fill="none"
                stroke="#c0b490"
                strokeWidth="0.4"
                strokeLinecap="round"
                opacity={0.25}
              />
            ))}

            {/* Cervical line - anatomical neck */}
            {shape.cervical && (
              <path
                d={shape.cervical}
                fill="none"
                stroke="#b0a480"
                strokeWidth="0.7"
                strokeLinecap="round"
                opacity={0.5}
              />
            )}

            {/* Cusp ridges on crown */}
            {shape.cusps?.map((cusp, i) => (
              <path
                key={`cusp-${i}`}
                d={cusp}
                fill="none"
                stroke="#c5b898"
                strokeWidth="0.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.35}
              />
            ))}

            {/* Anatomical details (fissures/grooves) */}
            {shape.details?.map((detail, i) => (
              <path
                key={i}
                d={detail}
                fill="none"
                stroke="#a89868"
                strokeWidth="0.5"
                strokeLinecap="round"
                opacity={0.35}
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
