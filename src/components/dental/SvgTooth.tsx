import { cn } from '@/lib/utils';

// ─── Realistic anatomical tooth shapes ───────────────────────────────────────
// viewBox: 0 0 40 80
// Upper teeth: root at top (y≈0-38), cervical line (~y38-42), crown at bottom (y≈42-78)
// Multi-rooted teeth have VISIBLE furcation notches – the outline path traces
// around each root separately with a V-notch between them.

const TOOTH_SHAPES: Record<string, {
  outline: string;
  cervical?: string;
  rootLines?: string[];
  details?: string[];
  cusps?: string[];
  innerHighlight?: string;
  /** Crown-only path for enamel cap gradient */
  crownArea?: string;
  /** Gum-coloured fill between separated roots */
  furcationArea?: string;
}> = {
  // ── Central Incisor: broad spatulate crown, single conical root ──
  centralIncisor: {
    outline: "M20,2 C18,2 16,6 15,12 C14,20 13.5,28 13,34 C12.5,38 12,41 11.5,45 C11,49 10.5,54 10.5,59 C10.8,64 12,68 14.5,72 C16.5,75 18.5,77 20,78 C21.5,77 23.5,75 25.5,72 C28,68 29.2,64 29.5,59 C29.5,54 29,49 28.5,45 C28,41 27.5,38 27,34 C26.5,28 26,20 25,12 C24,6 22,2 20,2Z",
    crownArea: "M12,42 C11.5,46 11,50 10.8,55 C10.8,60 11.5,65 13.5,70 C15.5,74 18,77 20,78 C22,77 24.5,74 26.5,70 C28.5,65 29.2,60 29.2,55 C29,50 28.5,46 28,42 Q24,39 20,38 Q16,39 12,42Z",
    innerHighlight: "M20,6 C19,6 17.5,10 16.5,18 C16,24 15.5,30 15,36 C14.5,40 14,44 13.5,49 C13.2,54 13.5,60 15,65 C16.5,70 18.5,74 20,75 C21.5,74 23.5,70 25,65 C26.5,60 26.8,54 26.5,49 C26,44 25.5,40 25,36 C24.5,30 24,24 23.5,18 C22.5,10 21,6 20,6Z",
    cervical: "M12.5,42 Q16,39 20,38 Q24,39 27.5,42",
    rootLines: [
      "M18,6 Q19,16 18.5,34",
      "M22,6 Q21,16 21.5,34",
    ],
    cusps: [
      "M13,62 Q16.5,56 20,54 Q23.5,56 27,62",
    ],
  },

  // ── Lateral Incisor: narrower crown, single root ──
  lateralIncisor: {
    outline: "M20,3 C18.5,3 17,7 16,13 C15,20 14.5,27 14,33 C13.5,37 13.2,41 13,44 C12.8,48 12.5,52 12.8,57 C13,62 14,66 16,70 C17.5,73 19,75 20,75.5 C21,75 22.5,73 24,70 C26,66 27,62 27.2,57 C27.5,52 27.2,48 27,44 C26.8,41 26.5,37 26,33 C25.5,27 25,20 24,13 C23,7 21.5,3 20,3Z",
    crownArea: "M13,44 C12.8,48 12.5,52 12.8,57 C13,62 14,66 16,70 C17.5,73 19,75 20,75.5 C21,75 22.5,73 24,70 C26,66 27,62 27.2,57 C27.5,52 27.2,48 27,44 Q23.5,41 20,40 Q16.5,41 13,44Z",
    innerHighlight: "M20,7 C19,7 17.8,11 17,17 C16.2,24 15.5,30 15.2,35 C15,39 14.8,43 14.8,47 C14.8,52 15.2,57 16.5,62 C17.5,66 19,70 20,71 C21,70 22.5,66 23.5,62 C24.8,57 25.2,52 25.2,47 C25.2,43 25,39 24.8,35 C24.5,30 23.8,24 23,17 C22.2,11 21,7 20,7Z",
    cervical: "M13,44 Q16.5,41 20,40 Q23.5,41 27,44",
    rootLines: [
      "M18,7 Q18.5,18 18.2,36",
      "M22,7 Q21.5,18 21.8,36",
    ],
    cusps: [
      "M14.5,62 Q17,57 20,55 Q23,57 25.5,62",
    ],
  },

  // ── Canine: pointed crown with prominent cusp, long single root ──
  canine: {
    outline: "M20,1 C18,1 16,5 15,12 C14,20 13.2,27 12.5,33 C12,37 11.5,41 11,44 C10.5,48 10.2,52 10.5,57 C10.8,62 12,66 14.5,70 C16.5,73 18.5,76 20,78 C21.5,76 23.5,73 25.5,70 C28,66 29.2,62 29.5,57 C29.8,52 29.5,48 29,44 C28.5,41 28,37 27.5,33 C26.8,27 26,20 25,12 C24,5 22,1 20,1Z",
    crownArea: "M11,44 C10.5,48 10.2,52 10.5,57 C10.8,62 12,66 14.5,70 C16.5,73 18.5,76 20,78 C21.5,76 23.5,73 25.5,70 C28,66 29.2,62 29.5,57 C29.8,52 29.5,48 29,44 Q24.5,41 20,40 Q15.5,41 11,44Z",
    innerHighlight: "M20,5 C19,5 17,9 16,16 C15,23 14.2,30 13.8,35 C13.5,39 13,43 12.8,47 C12.6,52 13,57 14.5,62 C16,66 18,72 20,74 C22,72 24,66 25.5,62 C27,57 27.4,52 27.2,47 C27,43 26.5,39 26.2,35 C25.8,30 25,23 24,16 C23,9 21,5 20,5Z",
    cervical: "M11,44 Q15.5,41 20,40 Q24.5,41 29,44",
    rootLines: [
      "M17.5,4 Q18.5,18 18,36",
      "M22.5,4 Q21.5,18 22,36",
    ],
    cusps: [
      "M13,62 Q16.5,56 20,52 Q23.5,56 27,62",
    ],
  },

  // ── First Premolar: bicuspid crown, bifurcated root with VISIBLE furcation notch ──
  firstPremolar: {
    // Two roots clearly separated with V-notch at ~y28
    outline: "M15,4 C13.5,4 12,8 11.5,14 C11,20 11,25 11.5,28 L11.5,28 C12,32 12.5,36 13,39 Q16.5,37 20,36 Q23.5,37 27,39 C27.5,36 28,32 28.5,28 L28.5,28 C29,25 29,20 28.5,14 C28,8 26.5,4 25,4 C23.5,4 22,8 20,16 C18,8 16.5,4 15,4Z M13,39 C12.5,43 12,47 11.8,51 C11.5,56 12,61 13.5,65 C15,68 17.5,71 20,72 C22.5,71 25,68 26.5,65 C28,61 28.5,56 28.2,51 C28,47 27.5,43 27,39 Q23.5,37 20,36 Q16.5,37 13,39Z",
    crownArea: "M13,39 C12.5,43 12,47 11.8,51 C11.5,56 12,61 13.5,65 C15,68 17.5,71 20,72 C22.5,71 25,68 26.5,65 C28,61 28.5,56 28.2,51 C28,47 27.5,43 27,39 Q23.5,37 20,36 Q16.5,37 13,39Z",
    furcationArea: "M11.5,28 C13,24 16,20 20,16 C24,20 27,24 28.5,28 C28,32 27.5,36 27,39 Q23.5,37 20,36 Q16.5,37 13,39 C12.5,36 12,32 11.5,28Z",
    innerHighlight: "M16,8 C15,12 14,18 13.5,23 C13,26 13,29 13.5,33 C14,36 15,38 17,39 Q18.5,37.5 20,37 Q21.5,37.5 23,39 C25,38 26,36 26.5,33 C27,29 27,26 26.5,23 C26,18 25,12 24,8 C22.8,8 21.5,12 20,18 C18.5,12 17.2,8 16,8Z",
    cervical: "M13,39 Q16.5,37 20,36 Q23.5,37 27,39",
    rootLines: [
      "M14,8 Q14.5,16 14,28",
      "M26,8 Q25.5,16 26,28",
    ],
    details: ["M15,56 Q17.5,52 20,51 Q22.5,52 25,56"],
    cusps: [
      "M14.5,58 L17,53 L20,55 L23,53 L25.5,58",
    ],
  },

  // ── Second Premolar: bicuspid crown, single root ──
  secondPremolar: {
    outline: "M20,4 C18,4 16,8 15,15 C14,22 13.5,28 13,34 C12.5,38 12.2,41 12,44 C11.8,48 11.5,52 11.8,57 C12,62 13,66 15,69 C16.5,72 18.5,74 20,74.5 C21.5,74 23.5,72 25,69 C27,66 28,62 28.2,57 C28.5,52 28.2,48 28,44 C27.8,41 27.5,38 27,34 C26.5,28 26,22 25,15 C24,8 22,4 20,4Z",
    crownArea: "M12,44 C11.8,48 11.5,52 11.8,57 C12,62 13,66 15,69 C16.5,72 18.5,74 20,74.5 C21.5,74 23.5,72 25,69 C27,66 28,62 28.2,57 C28.5,52 28.2,48 28,44 Q24,41 20,40 Q16,41 12,44Z",
    innerHighlight: "M20,8 C18.5,8 17,12 16,19 C15,25 14.5,31 14.2,36 C14,40 13.8,43 13.8,47 C13.8,52 14.2,57 15.5,62 C16.5,66 18.5,70 20,71 C21.5,70 23.5,66 24.5,62 C25.8,57 26.2,52 26.2,47 C26.2,43 26,40 25.8,36 C25.5,31 25,25 24,19 C23,12 21.5,8 20,8Z",
    cervical: "M12,44 Q16,41 20,40 Q24,41 28,44",
    details: ["M15,58 Q17.5,53 20,52 Q22.5,53 25,58"],
    rootLines: [
      "M17,8 Q17.5,20 17,36",
      "M23,8 Q22.5,20 23,36",
    ],
    cusps: [
      "M14.5,60 L17,55 L20,57 L23,55 L25.5,60",
    ],
  },

  // ── First Molar: wide crown, TWO clearly separated roots with deep furcation V-notch ──
  firstMolar: {
    // Root paths split at ~y22 with a deep V-notch, then join at cervical ~y39
    outline: "M13,2 C11,2 9,7 8,14 C7.5,20 7.5,25 9,30 C10,33 11,36 12.5,38 Q16,36 20,35 Q24,36 27.5,38 C29,36 30,33 31,30 C32.5,25 32.5,20 32,14 C31,7 29,2 27,2 C25,2 23,7 20,16 C17,7 15,2 13,2Z M12.5,38 C12,41 11.5,44 11,48 C10.5,53 10.5,58 11,62 C11.5,66 13,69 15.5,72 C17.5,74 19,75 20,75.5 C21,75 22.5,74 24.5,72 C27,69 28.5,66 29,62 C29.5,58 29.5,53 29,48 C28.5,44 28,41 27.5,38 Q24,36 20,35 Q16,36 12.5,38Z",
    crownArea: "M12.5,38 C12,41 11.5,44 11,48 C10.5,53 10.5,58 11,62 C11.5,66 13,69 15.5,72 C17.5,74 19,75 20,75.5 C21,75 22.5,74 24.5,72 C27,69 28.5,66 29,62 C29.5,58 29.5,53 29,48 C28.5,44 28,41 27.5,38 Q24,36 20,35 Q16,36 12.5,38Z",
    furcationArea: "M9,30 C11,26 15,20 20,16 C25,20 29,26 31,30 C30,33 29,36 27.5,38 Q24,36 20,35 Q16,36 12.5,38 C11,36 10,33 9,30Z",
    innerHighlight: "M14,6 C12.5,6 11,11 10,17 C9.5,22 9.5,27 10.5,31 C11.5,34 12.5,37 14,38 Q17,36 20,35.5 Q23,36 26,38 C27.5,37 28.5,34 29.5,31 C30.5,27 30.5,22 30,17 C29,11 27.5,6 26,6 C24.5,6 23,9 20,14 C17,9 15.5,6 14,6Z",
    cervical: "M12.5,38 Q16,36 20,35 Q24,36 27.5,38",
    details: [
      "M14,56 Q17,51 20,54 Q23,51 26,56",
      "M16,60 Q20,56 24,60",
    ],
    rootLines: [
      "M11,6 Q11.5,14 11,28",
      "M20,16 Q20,22 20,32",
      "M29,6 Q28.5,14 29,28",
    ],
    cusps: [
      "M14,60 L16.5,54 L19,56 L20,53 L21,56 L23.5,54 L26,60",
    ],
  },

  // ── Second Molar: similar to first molar but slightly smaller ──
  secondMolar: {
    outline: "M14,3 C12,3 10.5,8 9.5,15 C9,21 9,26 10,30 C11,33 12,36 13,38 Q16.5,36 20,35 Q23.5,36 27,38 C28,36 29,33 30,30 C31,26 31,21 30.5,15 C29.5,8 28,3 26,3 C24.5,3 22.5,7 20,14 C17.5,7 15.5,3 14,3Z M13,38 C12.5,41 12,44 11.5,48 C11,53 11,57 11.5,61 C12,65 13.5,68 15.5,71 C17.5,73 19,74 20,74.5 C21,74 22.5,73 24.5,71 C26.5,68 28,65 28.5,61 C29,57 29,53 28.5,48 C28,44 27.5,41 27,38 Q23.5,36 20,35 Q16.5,36 13,38Z",
    crownArea: "M13,38 C12.5,41 12,44 11.5,48 C11,53 11,57 11.5,61 C12,65 13.5,68 15.5,71 C17.5,73 19,74 20,74.5 C21,74 22.5,73 24.5,71 C26.5,68 28,65 28.5,61 C29,57 29,53 28.5,48 C28,44 27.5,41 27,38 Q23.5,36 20,35 Q16.5,36 13,38Z",
    furcationArea: "M10,30 C12,26 15.5,20 20,14 C24.5,20 28,26 30,30 C29,33 28,36 27,38 Q23.5,36 20,35 Q16.5,36 13,38 C12,36 11,33 10,30Z",
    innerHighlight: "M15,7 C13.5,7 12,12 11,18 C10.5,23 10.5,27 11.5,31 C12,34 13,37 14,38 Q17,36.5 20,35.5 Q23,36.5 26,38 C27,37 28,34 28.5,31 C29.5,27 29.5,23 29,18 C28,12 26.5,7 25,7 C24,7 22.5,10 20,15 C17.5,10 16,7 15,7Z",
    cervical: "M13,38 Q16.5,36 20,35 Q23.5,36 27,38",
    details: ["M14,56 Q17.5,52 20,54 Q22.5,52 26,56"],
    rootLines: [
      "M12,7 Q12.5,16 12,28",
      "M28,7 Q27.5,16 28,28",
    ],
    cusps: [
      "M14,58 L16.5,53 L19,55 L20,52 L21,55 L23.5,53 L26,58",
    ],
  },

  // ── Wisdom (Third Molar): short, partially fused roots with shallow furcation ──
  wisdom: {
    outline: "M15,8 C13.5,8 12,12 11.5,17 C11,22 11,26 11.5,30 C12,33 12.5,35 14,37 Q17,35 20,34 Q23,35 26,37 C27.5,35 28,33 28.5,30 C29,26 29,22 28.5,17 C28,12 26.5,8 25,8 C23.5,8 22,11 20,15 C18,11 16.5,8 15,8Z M14,37 C13.5,40 13,43 12.5,47 C12,51 12,55 12.5,59 C13,62 14.5,65 16.5,68 C18,70 19.5,71 20,71.5 C20.5,71 22,70 23.5,68 C25.5,65 27,62 27.5,59 C28,55 28,51 27.5,47 C27,43 26.5,40 26,37 Q23,35 20,34 Q17,35 14,37Z",
    crownArea: "M14,37 C13.5,40 13,43 12.5,47 C12,51 12,55 12.5,59 C13,62 14.5,65 16.5,68 C18,70 19.5,71 20,71.5 C20.5,71 22,70 23.5,68 C25.5,65 27,62 27.5,59 C28,55 28,51 27.5,47 C27,43 26.5,40 26,37 Q23,35 20,34 Q17,35 14,37Z",
    furcationArea: "M11.5,30 C13,27 16,22 20,15 C24,22 27,27 28.5,30 C28,33 27.5,35 26,37 Q23,35 20,34 Q17,35 14,37 C12.5,35 12,33 11.5,30Z",
    innerHighlight: "M16,12 C15,14 14,18 13.5,23 C13,26 13,29 13.5,32 C14,34 14.5,36 15.5,37 Q17.5,35.5 20,35 Q22.5,35.5 24.5,37 C25.5,36 26,34 26.5,32 C27,29 27,26 26.5,23 C26,18 25,14 24,12 C23,12 22,13 20,16 C18,13 17,12 16,12Z",
    cervical: "M14,37 Q17,35 20,34 Q23,35 26,37",
    details: ["M15,55 Q17.5,51 20,53 Q22.5,51 25,55"],
    rootLines: [
      "M14,12 Q14.5,20 14,30",
      "M26,12 Q25.5,20 26,30",
    ],
    cusps: [
      "M15,57 L17.5,53 L20,55 L22.5,53 L25,57",
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
            fillRule="evenodd"
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
            {/* Main body gradient - root portion darker/more yellow */}
            <linearGradient id={`g-${id}`} x1="0.1" y1="0" x2="0.9" y2="1">
              <stop offset="0%" stopColor="#ddd5b8" />
              <stop offset="25%" stopColor="#e0d8bc" />
              <stop offset="45%" stopColor="#e5ddc4" />
              <stop offset="60%" stopColor="#e8e0c8" />
              <stop offset="80%" stopColor="#ebe5d0" />
              <stop offset="100%" stopColor="#ede7d4" />
            </linearGradient>

            {/* Enamel cap - bright white sheen on CROWN only */}
            {shape.crownArea && (
              <linearGradient id={`ce-${id}`} x1="0.5" y1="0.35" x2="0.5" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.04" />
                <stop offset="15%" stopColor="white" stopOpacity="0.16" />
                <stop offset="35%" stopColor="white" stopOpacity="0.26" />
                <stop offset="55%" stopColor="white" stopOpacity="0.22" />
                <stop offset="75%" stopColor="white" stopOpacity="0.14" />
                <stop offset="100%" stopColor="white" stopOpacity="0.08" />
              </linearGradient>
            )}

            {/* Left specular highlight */}
            <linearGradient id={`h-${id}`} x1="0" y1="0.2" x2="0.65" y2="0.8">
              <stop offset="0%" stopColor="white" stopOpacity="0.42" />
              <stop offset="18%" stopColor="white" stopOpacity="0.16" />
              <stop offset="45%" stopColor="white" stopOpacity="0.04" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            {/* Right edge shadow */}
            <linearGradient id={`rs2-${id}`} x1="1" y1="0.3" x2="0.3" y2="0.7">
              <stop offset="0%" stopColor="#8a7c5e" stopOpacity="0.2" />
              <stop offset="35%" stopColor="#8a7c5e" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#8a7c5e" stopOpacity="0" />
            </linearGradient>

            {/* Root darkening toward apex */}
            <linearGradient id={`rs-${id}`} x1="0.5" y1="0" x2="0.5" y2="0.5">
              <stop offset="0%" stopColor="#9a8860" stopOpacity="0.3" />
              <stop offset="40%" stopColor="#a09070" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#a09070" stopOpacity="0" />
            </linearGradient>

            {/* Furcation depth shadow - gum-coloured radial gradient */}
            {shape.furcationArea && (
              <radialGradient id={`fur-${id}`} cx="0.5" cy="0.6" r="0.5">
                <stop offset="0%" stopColor="#c89888" stopOpacity="0.55" />
                <stop offset="35%" stopColor="#d4a898" stopOpacity="0.35" />
                <stop offset="70%" stopColor="#e0bab0" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#e0bab0" stopOpacity="0" />
              </radialGradient>
            )}

            {/* Ambient occlusion */}
            <radialGradient id={`ao-${id}`} cx="0.5" cy="0.52" r="0.48">
              <stop offset="55%" stopColor="transparent" />
              <stop offset="82%" stopColor="#7a6c50" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#7a6c50" stopOpacity="0.18" />
            </radialGradient>

            {/* Inner body highlight */}
            <radialGradient id={`ih-${id}`} cx="0.42" cy="0.55" r="0.35" fx="0.38" fy="0.5">
              <stop offset="0%" stopColor="white" stopOpacity="0.18" />
              <stop offset="50%" stopColor="white" stopOpacity="0.05" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>

            <clipPath id={`clip-${id}`}>
              <path d={shape.outline} fillRule="evenodd" />
            </clipPath>
          </defs>

          <g transform={groupTransform}>
            {/* Soft drop shadow */}
            <path
              d={shape.outline}
              fill="rgba(0,0,0,0.05)"
              fillRule="evenodd"
              transform="translate(0.8, 1.5)"
            />

            {/* Main tooth fill */}
            <path
              d={shape.outline}
              fill={`url(#g-${id})`}
              fillRule="evenodd"
              stroke="#b5a878"
              strokeWidth="0.5"
              strokeLinejoin="round"
            />

            {/* Root darkening */}
            <path d={shape.outline} fill={`url(#rs-${id})`} fillRule="evenodd" />

            {/* Furcation depth shadow */}
            {shape.furcationArea && (
              <path d={shape.furcationArea} fill={`url(#fur-${id})`} />
            )}

            {/* Right edge shadow */}
            <path d={shape.outline} fill={`url(#rs2-${id})`} fillRule="evenodd" />

            {/* Ambient occlusion */}
            <path d={shape.outline} fill={`url(#ao-${id})`} fillRule="evenodd" />

            {/* Inner volume highlight */}
            {shape.innerHighlight && (
              <g clipPath={`url(#clip-${id})`}>
                <path d={shape.innerHighlight} fill={`url(#ih-${id})`} />
              </g>
            )}

            {/* Enamel cap on crown ONLY */}
            {shape.crownArea && (
              <path d={shape.crownArea} fill={`url(#ce-${id})`} />
            )}

            {/* Left specular highlight */}
            <path d={shape.outline} fill={`url(#h-${id})`} fillRule="evenodd" />

            {/* Root canal lines */}
            {shape.rootLines?.map((line, i) => (
              <path
                key={`rl-${i}`}
                d={line}
                fill="none"
                stroke="#c0b088"
                strokeWidth="0.35"
                strokeLinecap="round"
                opacity={0.2}
              />
            ))}

            {/* Cervical line */}
            {shape.cervical && (
              <path
                d={shape.cervical}
                fill="none"
                stroke="#a89870"
                strokeWidth="0.75"
                strokeLinecap="round"
                opacity={0.5}
              />
            )}

            {/* Cusp ridges */}
            {shape.cusps?.map((cusp, i) => (
              <path
                key={`cusp-${i}`}
                d={cusp}
                fill="none"
                stroke="#c0b490"
                strokeWidth="0.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.38}
              />
            ))}

            {/* Fissures/grooves */}
            {shape.details?.map((detail, i) => (
              <path
                key={i}
                d={detail}
                fill="none"
                stroke="#a08858"
                strokeWidth="0.5"
                strokeLinecap="round"
                opacity={0.38}
              />
            ))}

            {/* Status color overlay */}
            {statusColor && (
              <path
                d={shape.outline}
                fill={statusColor}
                fillRule="evenodd"
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
