import { cn } from '@/lib/utils';

// ─── Realistic anatomical tooth shapes ───────────────────────────────────────
// viewBox: 0 0 40 80
// Upper teeth: root at top (y≈0-35), cervical line (~y38-42), crown at bottom (y≈42-78)
// Multi-rooted teeth have furcation notches in outline and a furcationArea path
// for gum-coloured depth shading between separated roots.

const TOOTH_SHAPES: Record<string, {
  outline: string;
  cervical?: string;
  rootLines?: string[];
  details?: string[];
  cusps?: string[];
  innerHighlight?: string;
  shadowEdge?: string;
  /** Crown-only path for enamel cap gradient (brighter white on crown surface only) */
  crownArea?: string;
  /** Gum-coloured fill between separated roots for depth perception */
  furcationArea?: string;
}> = {
  // ── Central Incisor: broad spatulate crown, single conical root ──
  centralIncisor: {
    outline: "M20,1 C18.5,1 16.5,4 15.5,10 C14.5,16 14,22 13.5,28 C13,33 12.5,37 12,41 C11.5,45 11,48 10.5,52 C10,56 9.8,60 10,64 C10.3,68 11.5,71 14,74 C16,76 18,77.5 20,78 C22,77.5 24,76 26,74 C28.5,71 29.7,68 30,64 C30.2,60 30,56 29.5,52 C29,48 28.5,45 28,41 C27.5,37 27,33 26.5,28 C26,22 25.5,16 24.5,10 C23.5,4 21.5,1 20,1Z",
    crownArea: "M12,41 C11.5,45 11,48 10.5,52 C10,56 9.8,60 10,64 C10.3,68 11.5,71 14,74 C16,76 18,77.5 20,78 C22,77.5 24,76 26,74 C28.5,71 29.7,68 30,64 C30.2,60 30,56 29.5,52 C29,48 28.5,45 28,41 Q24,39 20,38 Q16,39 12,41Z",
    innerHighlight: "M20,6 C19,6 17.5,10 16.5,18 C15.5,26 15,34 14.5,40 C14,44 13.5,48 13,53 C12.8,57 13,62 14,66 C15.5,70 17.5,73 20,74 C22.5,73 24.5,70 26,66 C27,62 27.2,57 27,53 C26.5,48 26,44 25.5,40 C25,34 24.5,26 23.5,18 C22.5,10 21,6 20,6Z",
    cervical: "M12,41 Q16,38 20,37 Q24,38 28,41",
    rootLines: [
      "M17,5 Q18,15 17.5,32",
      "M23,5 Q22,15 22.5,32",
    ],
    cusps: [
      "M13,64 Q16,58 20,56 Q24,58 27,64",
    ],
  },

  // ── Lateral Incisor: narrower crown, single root ──
  lateralIncisor: {
    outline: "M20,3 C18.5,3 17,6 16,12 C15,18 14.5,24 14,30 C13.5,35 13,39 12.8,43 C12.5,47 12.3,51 12.5,55 C12.7,59 13,63 14.5,67 C16,70 17.5,73 20,74 C22.5,73 24,70 25.5,67 C27,63 27.3,59 27.5,55 C27.7,51 27.5,47 27.2,43 C27,39 26.5,35 26,30 C25.5,24 25,18 24,12 C23,6 21.5,3 20,3Z",
    crownArea: "M12.8,43 C12.5,47 12.3,51 12.5,55 C12.7,59 13,63 14.5,67 C16,70 17.5,73 20,74 C22.5,73 24,70 25.5,67 C27,63 27.3,59 27.5,55 C27.7,51 27.5,47 27.2,43 Q23.5,40 20,39 Q16.5,40 12.8,43Z",
    innerHighlight: "M20,7 C19,7 17.8,10 17,16 C16,23 15.5,29 15.2,34 C15,38 14.8,42 14.8,46 C14.8,50 15,55 16,60 C17,65 18.5,69 20,70 C21.5,69 23,65 24,60 C25,55 25.2,50 25.2,46 C25.2,42 25,38 24.8,34 C24.5,29 24,23 23,16 C22.2,10 21,7 20,7Z",
    cervical: "M13,43 Q16.5,40 20,39 Q23.5,40 27,43",
    rootLines: [
      "M17.5,6 Q18,18 17.8,36",
      "M22.5,6 Q22,18 22.2,36",
    ],
    cusps: [
      "M14,62 Q17,57 20,55 Q23,57 26,62",
    ],
  },

  // ── Canine: pointed crown with prominent cusp, long single root ──
  canine: {
    outline: "M20,1 C18.5,1 16,4 15,10 C14,17 13.2,24 12.5,30 C12,35 11.5,39 11,43 C10.5,47 10.2,51 10.5,55 C10.8,59 11.5,63 13.5,67 C15.5,71 17.5,74 20,78 C22.5,74 24.5,71 26.5,67 C28.5,63 29.2,59 29.5,55 C29.8,51 29.5,47 29,43 C28.5,39 28,35 27.5,30 C26.8,24 26,17 25,10 C24,4 21.5,1 20,1Z",
    crownArea: "M11,43 C10.5,47 10.2,51 10.5,55 C10.8,59 11.5,63 13.5,67 C15.5,71 17.5,74 20,78 C22.5,74 24.5,71 26.5,67 C28.5,63 29.2,59 29.5,55 C29.8,51 29.5,47 29,43 Q24.5,39 20,38 Q15.5,39 11,43Z",
    innerHighlight: "M20,5 C19,5 17,8 16,15 C15,22 14.2,29 13.8,34 C13.3,39 13,43 12.8,47 C12.6,51 13,56 14.5,61 C16,65 18,70 20,73 C22,70 24,65 25.5,61 C27,56 27.4,51 27.2,47 C27,43 26.7,39 26.2,34 C25.8,29 25,22 24,15 C23,8 21,5 20,5Z",
    cervical: "M11,43 Q15.5,39 20,38 Q24.5,39 29,43",
    rootLines: [
      "M17,4 Q18,18 17.5,36",
      "M23,4 Q22,18 22.5,36",
    ],
    cusps: [
      "M13,62 Q16.5,56 20,52 Q23.5,56 27,62",
    ],
  },

  // ── First Premolar: bicuspid crown, bifurcated root with visible furcation ──
  firstPremolar: {
    outline: "M20,4 C17.5,4 15.5,7 14.5,13 C13.5,19 13,25 13,30 C13,34 13.5,37 16,40 L14,40 C13,40 12,42 11.5,45 C11,48 10.8,52 11,56 C11.2,60 12,64 14,68 C15.5,71 17.5,73 20,74 C22.5,73 24.5,71 26,68 C28,64 28.8,60 29,56 C29.2,52 29,48 28.5,45 C28,42 27,40 26,40 L24,40 C26.5,37 27,34 27,30 C27,25 26.5,19 25.5,13 C24.5,7 22.5,4 20,4Z",
    crownArea: "M14,40 C13,40 12,42 11.5,45 C11,48 10.8,52 11,56 C11.2,60 12,64 14,68 C15.5,71 17.5,73 20,74 C22.5,73 24.5,71 26,68 C28,64 28.8,60 29,56 C29.2,52 29,48 28.5,45 C28,42 27,40 26,40 Q23,38 20,37 Q17,38 14,40Z",
    furcationArea: "M16,40 C17,36 18.5,34 20,34 C21.5,34 23,36 24,40 Q22,38 20,37 Q18,38 16,40Z",
    innerHighlight: "M20,8 C18.5,8 17,12 16,18 C15,24 14.5,30 14.8,35 C15,38 16,39 17,40 Q18.5,38 20,37 Q21.5,38 23,40 C24,39 25,38 25.2,35 C25.5,30 25,24 24,18 C23,12 21.5,8 20,8Z",
    cervical: "M14,40 Q17,37 20,36 Q23,37 26,40",
    rootLines: [
      "M15.5,8 Q16,18 15.5,32",
      "M24.5,8 Q24,18 24.5,32",
    ],
    details: ["M14.5,58 Q17,53 20,52 Q23,53 25.5,58"],
    cusps: [
      "M14,60 L17,54 L20,56 L23,54 L26,60",
    ],
  },

  // ── Second Premolar: bicuspid crown, single root ──
  secondPremolar: {
    outline: "M20,4 C18,4 16,8 15,14 C14,20 13.5,26 13,32 C12.5,36 12,40 11.5,44 C11,48 10.8,52 11,56 C11.2,60 12,64 14,68 C15.5,71 17.5,73 20,74 C22.5,73 24.5,71 26,68 C28,64 28.8,60 29,56 C29.2,52 29,48 28.5,44 C28,40 27.5,36 27,32 C26.5,26 26,20 25,14 C24,8 22,4 20,4Z",
    crownArea: "M11.5,44 C11,48 10.8,52 11,56 C11.2,60 12,64 14,68 C15.5,71 17.5,73 20,74 C22.5,73 24.5,71 26,68 C28,64 28.8,60 29,56 C29.2,52 29,48 28.5,44 Q24,40 20,39 Q16,40 11.5,44Z",
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

  // ── First Molar: wide crown, two clearly separated roots with deep furcation V-notch ──
  firstMolar: {
    outline: "M14,2 C12,2 10,6 9,12 C8,18 7.5,24 7.5,30 C8,34 9.5,37 12,39 L12,39 C11,40 10,42 9.5,46 C9,50 9,54 9.5,58 C10,62 11.5,66 14,70 C16,73 18,75 20,76 C22,75 24,73 26,70 C28.5,66 30,62 30.5,58 C31,54 31,50 30.5,46 C30,42 29,40 28,39 L28,39 C30.5,37 32,34 32.5,30 C32.5,24 32,18 31,12 C30,6 28,2 26,2 C24.5,2 22.5,5 20,10 C17.5,5 15.5,2 14,2Z",
    crownArea: "M12,39 C11,40 10,42 9.5,46 C9,50 9,54 9.5,58 C10,62 11.5,66 14,70 C16,73 18,75 20,76 C22,75 24,73 26,70 C28.5,66 30,62 30.5,58 C31,54 31,50 30.5,46 C30,42 29,40 28,39 Q24,36 20,35 Q16,36 12,39Z",
    furcationArea: "M12,39 C14,34 17,30 20,28 C23,30 26,34 28,39 Q24,36 20,35 Q16,36 12,39Z",
    innerHighlight: "M14.5,6 C13,6 11.5,10 10.5,16 C9.5,22 9.2,28 9.8,33 C10.5,36 11.5,38 13,39 Q16.5,36 20,35 Q23.5,36 27,39 C28.5,38 29.5,36 30.2,33 C30.8,28 30.5,22 29.5,16 C28.5,10 27,6 25.5,6 C24,6 22.5,8 20,12 C17.5,8 16,6 14.5,6Z",
    cervical: "M12,39 Q16,36 20,35 Q24,36 28,39",
    details: [
      "M13,58 Q16,53 20,56 Q24,53 27,58",
      "M15,62 Q20,58 25,62",
    ],
    rootLines: [
      "M12,5 Q13,16 12,30",
      "M20,12 Q20,20 20,30",
      "M28,5 Q27,16 28,30",
    ],
    cusps: [
      "M12,60 L15,54 L18,56 L20,53 L22,56 L25,54 L28,60",
    ],
  },

  // ── Second Molar: slightly smaller than first molar, two roots with furcation ──
  secondMolar: {
    outline: "M15,3 C13,3 11,7 10,13 C9,19 8.5,25 8.5,30 C9,34 10,37 12.5,39 L12.5,39 C11.5,40 10.5,43 10,47 C9.5,51 9.5,55 10,59 C10.5,63 12,66 14.5,69 C16.5,72 18.5,74 20,74.5 C21.5,74 23.5,72 25.5,69 C28,66 29.5,63 30,59 C30.5,55 30.5,51 30,47 C29.5,43 28.5,40 27.5,39 L27.5,39 C30,37 31,34 31.5,30 C31.5,25 31,19 30,13 C29,7 27,3 25,3 C23.5,3 22,5.5 20,9 C18,5.5 16.5,3 15,3Z",
    crownArea: "M12.5,39 C11.5,40 10.5,43 10,47 C9.5,51 9.5,55 10,59 C10.5,63 12,66 14.5,69 C16.5,72 18.5,74 20,74.5 C21.5,74 23.5,72 25.5,69 C28,66 29.5,63 30,59 C30.5,55 30.5,51 30,47 C29.5,43 28.5,40 27.5,39 Q24,36.5 20,35.5 Q16,36.5 12.5,39Z",
    furcationArea: "M12.5,39 C14,34.5 17,31 20,29 C23,31 26,34.5 27.5,39 Q24,36.5 20,35.5 Q16,36.5 12.5,39Z",
    innerHighlight: "M15.5,7 C14,7 12.5,11 11.5,17 C10.5,23 10.2,28 10.5,33 C11,36 12,38 13.5,39 Q17,36.5 20,35.5 Q23,36.5 26.5,39 C28,38 29,36 29.5,33 C29.8,28 29.5,23 28.5,17 C27.5,11 26,7 24.5,7 C23.2,7 22,9 20,12 C18,9 16.8,7 15.5,7Z",
    cervical: "M12.5,39 Q16,36.5 20,35.5 Q24,36.5 27.5,39",
    details: ["M13.5,57 Q17,52 20,55 Q23,52 26.5,57"],
    rootLines: [
      "M13,6 Q13.5,17 13,30",
      "M27,6 Q26.5,17 27,30",
    ],
    cusps: [
      "M13,59 L16,54 L18.5,56 L20,53 L21.5,56 L24,54 L27,59",
    ],
  },

  // ── Wisdom (Third Molar): short, partially fused roots with shallow furcation ──
  wisdom: {
    outline: "M15.5,6 C14,6 12,10 11,16 C10,22 10,27 10.2,31 C10.5,34.5 11.5,37 14,39 L14,39 C13,40 12,43 11.5,47 C11,51 11,55 11.5,59 C12,63 13.5,66 15.5,69 C17,71 18.5,72.5 20,73 C21.5,72.5 23,71 24.5,69 C26.5,66 28,63 28.5,59 C29,55 29,51 28.5,47 C28,43 27,40 26,39 L26,39 C28.5,37 29.5,34.5 29.8,31 C30,27 30,22 29,16 C28,10 26,6 24.5,6 C23.2,6 22,8 20,11 C18,8 16.8,6 15.5,6Z",
    crownArea: "M14,39 C13,40 12,43 11.5,47 C11,51 11,55 11.5,59 C12,63 13.5,66 15.5,69 C17,71 18.5,72.5 20,73 C21.5,72.5 23,71 24.5,69 C26.5,66 28,63 28.5,59 C29,55 29,51 28.5,47 C28,43 27,40 26,39 Q23,37 20,36 Q17,37 14,39Z",
    furcationArea: "M14,39 C15.5,36 17.5,34 20,33 C22.5,34 24.5,36 26,39 Q23,37 20,36 Q17,37 14,39Z",
    innerHighlight: "M16,10 C14.8,10 13,14 12.2,20 C11.5,25 11.5,29 12,33 C12.5,35.5 13.5,37 15,38 Q17.5,37 20,36 Q22.5,37 25,38 C26.5,37 27.5,35.5 28,33 C28.5,29 28.5,25 27.8,20 C27,14 25.2,10 24,10 C23,10 22,12 20,14 C18,12 17,10 16,10Z",
    cervical: "M14,39 Q17,37 20,36 Q23,37 26,39",
    details: ["M14.5,57 Q17,52 20,55 Q23,52 25.5,57"],
    rootLines: [
      "M14,10 Q14.5,20 14,32",
      "M26,10 Q25.5,20 26,32",
    ],
    cusps: [
      "M14,59 L17,54 L20,56 L23,54 L26,59",
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
      case 4: case 5: return TOOTH_SHAPES.firstMolar;
      default: return TOOTH_SHAPES.centralIncisor;
    }
  }

  switch (pos) {
    case 1: return TOOTH_SHAPES.centralIncisor;
    case 2: return TOOTH_SHAPES.lateralIncisor;
    case 3: return TOOTH_SHAPES.canine;
    case 4: return TOOTH_SHAPES.firstPremolar;
    case 5: return TOOTH_SHAPES.secondPremolar;
    case 6: return TOOTH_SHAPES.firstMolar;
    case 7: return TOOTH_SHAPES.secondMolar;
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
            {/* Main body gradient - ivory/bone with root-specific darkening */}
            <linearGradient id={`g-${id}`} x1="0.1" y1="0" x2="0.9" y2="1">
              <stop offset="0%" stopColor="#e8dfc8" />
              <stop offset="20%" stopColor="#e2d8b8" />
              <stop offset="40%" stopColor="#ddd3b0" />
              <stop offset="55%" stopColor="#d8ccaa" />
              <stop offset="75%" stopColor="#d4c9a4" />
              <stop offset="90%" stopColor="#c8bb94" />
              <stop offset="100%" stopColor="#bfb088" />
            </linearGradient>

            {/* Enamel cap - bright white sheen on CROWN only */}
            {shape.crownArea && (
              <linearGradient id={`ce-${id}`} x1="0.5" y1="0.4" x2="0.5" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.05" />
                <stop offset="15%" stopColor="white" stopOpacity="0.18" />
                <stop offset="40%" stopColor="white" stopOpacity="0.28" />
                <stop offset="65%" stopColor="white" stopOpacity="0.2" />
                <stop offset="85%" stopColor="white" stopOpacity="0.12" />
                <stop offset="100%" stopColor="white" stopOpacity="0.06" />
              </linearGradient>
            )}

            {/* Left specular highlight */}
            <linearGradient id={`h-${id}`} x1="0" y1="0.2" x2="0.6" y2="0.8">
              <stop offset="0%" stopColor="white" stopOpacity="0.45" />
              <stop offset="20%" stopColor="white" stopOpacity="0.18" />
              <stop offset="50%" stopColor="white" stopOpacity="0.04" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            {/* Right edge shadow */}
            <linearGradient id={`rs2-${id}`} x1="1" y1="0.3" x2="0.3" y2="0.7">
              <stop offset="0%" stopColor="#8a7c5e" stopOpacity="0.22" />
              <stop offset="40%" stopColor="#8a7c5e" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#8a7c5e" stopOpacity="0" />
            </linearGradient>

            {/* Root darkening toward apex - roots appear darker/more yellow than crown */}
            <linearGradient id={`rs-${id}`} x1="0.5" y1="0" x2="0.5" y2="0.55">
              <stop offset="0%" stopColor="#9a8860" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#a09070" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#a09070" stopOpacity="0" />
            </linearGradient>

            {/* Furcation depth shadow - gum-coloured radial gradient */}
            {shape.furcationArea && (
              <radialGradient id={`fur-${id}`} cx="0.5" cy="0.7" r="0.5">
                <stop offset="0%" stopColor="#c4908a" stopOpacity="0.5" />
                <stop offset="40%" stopColor="#d4a098" stopOpacity="0.3" />
                <stop offset="80%" stopColor="#e0bab2" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#e0bab2" stopOpacity="0" />
              </radialGradient>
            )}

            {/* Ambient occlusion - edge depth for 3D roundness */}
            <radialGradient id={`ao-${id}`} cx="0.5" cy="0.52" r="0.48">
              <stop offset="55%" stopColor="transparent" />
              <stop offset="82%" stopColor="#7a6c50" stopOpacity="0.09" />
              <stop offset="100%" stopColor="#7a6c50" stopOpacity="0.2" />
            </radialGradient>

            {/* Inner body highlight for 3D volume */}
            <radialGradient id={`ih-${id}`} cx="0.42" cy="0.55" r="0.35" fx="0.38" fy="0.5">
              <stop offset="0%" stopColor="white" stopOpacity="0.2" />
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
              stroke="#b0a278"
              strokeWidth="0.5"
              strokeLinejoin="round"
            />

            {/* Root darkening - roots are darker/more yellow */}
            <path d={shape.outline} fill={`url(#rs-${id})`} />

            {/* Furcation depth shadow between separated roots */}
            {shape.furcationArea && (
              <path d={shape.furcationArea} fill={`url(#fur-${id})`} />
            )}

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

            {/* Enamel cap - bright sheen on crown portion ONLY */}
            {shape.crownArea && (
              <path d={shape.crownArea} fill={`url(#ce-${id})`} />
            )}

            {/* Left specular highlight */}
            <path d={shape.outline} fill={`url(#h-${id})`} />

            {/* Root canal lines (subtle internal anatomy) */}
            {shape.rootLines?.map((line, i) => (
              <path
                key={`rl-${i}`}
                d={line}
                fill="none"
                stroke="#b8a880"
                strokeWidth="0.35"
                strokeLinecap="round"
                opacity={0.22}
              />
            ))}

            {/* Cervical line - anatomical neck between root and crown */}
            {shape.cervical && (
              <path
                d={shape.cervical}
                fill="none"
                stroke="#a89870"
                strokeWidth="0.8"
                strokeLinecap="round"
                opacity={0.55}
              />
            )}

            {/* Cusp ridges on crown */}
            {shape.cusps?.map((cusp, i) => (
              <path
                key={`cusp-${i}`}
                d={cusp}
                fill="none"
                stroke="#c0b490"
                strokeWidth="0.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.4}
              />
            ))}

            {/* Anatomical details (fissures/grooves) */}
            {shape.details?.map((detail, i) => (
              <path
                key={i}
                d={detail}
                fill="none"
                stroke="#a08858"
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
