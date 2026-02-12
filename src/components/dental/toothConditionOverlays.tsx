/**
 * SVG overlays for dental conditions.
 * Each condition code maps to an SVG fragment drawn on viewBox 0 0 40 80.
 * Upper teeth: root at top (y≈0-40), crown at bottom (y≈40-78).
 * Lower teeth are flipped via the parent SvgTooth transform.
 */

interface OverlayDef {
  /** Render the SVG overlay elements */
  render: (id: string) => React.ReactNode;
  /** If true, the tooth should render as absent (dashed outline only) */
  isAbsent?: boolean;
}

// Condition overlays keyed by condition code
export const CONDITION_OVERLAYS: Record<string, OverlayDef> = {
  // Absent - tooth appears as empty dashed outline
  aa: {
    isAbsent: true,
    render: () => null,
  },

  // Breșă închisă - X pattern across the crown
  bi: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <line x1="12" y1="48" x2="28" y2="74" stroke="#8B0000" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
        <line x1="28" y1="48" x2="12" y2="74" stroke="#8B0000" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      </g>
    ),
  },

  // Carie avansată - large red area covering crown tip
  ca: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M14,62 Q14,74 20,76 Q26,74 26,62 Z" fill="#DC2626" opacity="0.75" />
      </g>
    ),
  },

  // Carie de colet - red rectangle at the cervical zone (neck of tooth)
  cc: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="14" y="46" width="12" height="6" rx="1.5" fill="#DC2626" opacity="0.75" />
      </g>
    ),
  },

  // Carie incipientă - red area at crown base (similar to avansată but smaller)
  ci: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M15,66 Q15,76 20,76 Q25,76 25,66 Z" fill="#DC2626" opacity="0.65" />
      </g>
    ),
  },

  // Carie mezială - red patch on mesial (left) side of crown
  cm: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="10" y="54" width="7" height="10" rx="1.5" fill="#DC2626" opacity="0.75" />
      </g>
    ),
  },

  // Carie ocluzală - large red block on occlusal (bottom) surface
  co: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="13" y="62" width="14" height="12" rx="2" fill="#DC2626" opacity="0.7" />
      </g>
    ),
  },

  // Carie mezio-ocluzală - mesial side + occlusal bottom
  cmo: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M10,54 L17,54 L17,62 L27,62 L27,74 L13,74 L13,62 L10,62 Z" fill="#DC2626" opacity="0.7" rx="1" />
      </g>
    ),
  },

  // Carie mezio-ocluzo-distală - U-shape wrapping mesial + occlusal + distal
  cmod: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M10,54 L17,54 L17,62 L23,62 L23,54 L30,54 L30,62 L27,62 L27,74 L13,74 L13,62 L10,62 Z" fill="#DC2626" opacity="0.7" />
      </g>
    ),
  },

  // Carie ocluzo-distală - occlusal + distal (right) side
  cod: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M13,62 L27,62 L30,62 L30,54 L23,54 L23,62 L27,74 L13,74 Z" fill="#DC2626" opacity="0.7" />
      </g>
    ),
  },

  // Carie palatinală - small red patch on the palatal surface (upper part of crown)
  cp: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="10" y="50" width="6" height="6" rx="1.5" fill="#DC2626" opacity="0.7" />
      </g>
    ),
  },

  // Carie vestibulară - red on vestibular (front) surface
  // Carie vestibulară - red square on the front surface of crown
  cv: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="15" y="56" width="10" height="8" rx="1.5" fill="#DC2626" opacity="0.7" />
      </g>
    ),
  },

  // Carie radiculară distală - red patch on distal (right) root area
  crd: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="22" y="22" width="6" height="10" rx="1.5" fill="#DC2626" opacity="0.65" />
      </g>
    ),
  },

  // Carie radiculară mezială - red patch on mesial (left) root area
  crm: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="12" y="22" width="6" height="10" rx="1.5" fill="#DC2626" opacity="0.65" />
      </g>
    ),
  },

  // Carie secundară distală - bicolor: blue (filling) + red (caries) on distal side
  csd: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="23" y="54" width="7" height="5" rx="1" fill="#3B82F6" opacity="0.65" />
        <rect x="23" y="59" width="7" height="5" rx="1" fill="#DC2626" opacity="0.7" />
      </g>
    ),
  },

  // Carie secundară mezială - bicolor on mesial side
  csm: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="10" y="54" width="7" height="5" rx="1" fill="#DC2626" opacity="0.7" />
        <rect x="10" y="59" width="7" height="5" rx="1" fill="#3B82F6" opacity="0.65" />
      </g>
    ),
  },

  // Carie secundară mezio-ocluzală - bicolor L-shape
  csmo: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="10" y="54" width="7" height="5" rx="1" fill="#DC2626" opacity="0.7" />
        <rect x="10" y="59" width="7" height="5" rx="1" fill="#3B82F6" opacity="0.6" />
        <rect x="13" y="64" width="14" height="4" rx="1" fill="#3B82F6" opacity="0.55" />
      </g>
    ),
  },

  // Carie secundară ocluzală - bicolor horizontal bar
  cso: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="13" y="62" width="14" height="5" rx="1" fill="#DC2626" opacity="0.7" />
        <rect x="13" y="67" width="14" height="5" rx="1" fill="#3B82F6" opacity="0.6" />
      </g>
    ),
  },

  // Carie secundară ocluzo-distală - bicolor on occlusal + distal
  csod: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="13" y="62" width="14" height="5" rx="1" fill="#3B82F6" opacity="0.55" />
        <rect x="23" y="54" width="7" height="5" rx="1" fill="#DC2626" opacity="0.7" />
        <rect x="23" y="59" width="7" height="5" rx="1" fill="#3B82F6" opacity="0.6" />
      </g>
    ),
  },

  // Recidivă carie distală - dark red with stripe accent
  rcd: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="23" y="54" width="7" height="10" rx="1.5" fill="#B91C1C" opacity="0.7" />
        <line x1="24" y1="56" x2="28" y2="62" stroke="#7F1D1D" strokeWidth="0.8" opacity="0.4" />
      </g>
    ),
  },

  // Recidivă carie mezială
  rcm: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="10" y="54" width="7" height="10" rx="1.5" fill="#B91C1C" opacity="0.7" />
        <line x1="12" y1="56" x2="16" y2="62" stroke="#7F1D1D" strokeWidth="0.8" opacity="0.4" />
      </g>
    ),
  },

  // Recidivă carie mezio-ocluzală
  rcmo: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M10,54 L17,54 L17,62 L27,62 L27,74 L13,74 L13,62 L10,62 Z" fill="#B91C1C" opacity="0.65" />
      </g>
    ),
  },

  // Recidivă carie ocluzală
  rco: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="13" y="62" width="14" height="12" rx="2" fill="#B91C1C" opacity="0.65" />
      </g>
    ),
  },

  // Recidivă carie ocluzo-distală
  rcod: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M13,62 L27,62 L30,62 L30,54 L23,54 L23,62 L27,74 L13,74 Z" fill="#B91C1C" opacity="0.65" />
      </g>
    ),
  },

  // CHIST - yellowish/olive blob at the root apex
  chist: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <ellipse cx="20" cy="8" rx="7" ry="6" fill="#A3A23A" opacity="0.65" />
        <ellipse cx="20" cy="8" rx="4" ry="3.5" fill="#C4C34A" opacity="0.4" />
      </g>
    ),
  },

  // Coroană existentă - gold/amber cap over the crown portion
  cor: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M12,48 Q12,44 20,42 Q28,44 28,48 L28,62 Q28,74 20,76 Q12,74 12,62 Z" fill="#D4A017" opacity="0.45" />
        <path d="M14,48 Q14,46 20,44 Q26,46 26,48 L26,52" fill="none" stroke="#B8860B" strokeWidth="0.8" opacity="0.5" />
      </g>
    ),
  },

  // Devital - grey/pale wash over the entire tooth
  dev: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M20,4 C17,4 14,14 13,26 C12,34 11,42 10,50 C9,58 9,64 10,68 C11,72 14,76 20,76 C26,76 29,72 30,68 C31,64 31,58 30,50 C29,42 28,34 27,26 C26,14 23,4 20,4Z" fill="#9CA3AF" opacity="0.4" />
      </g>
    ),
  },

  // Durere - red pulsing dot at the crown tip
  dur: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <ellipse cx="20" cy="72" rx="5" ry="4" fill="#EF4444" opacity="0.7" />
        <ellipse cx="20" cy="72" rx="3" ry="2.5" fill="#FCA5A5" opacity="0.6" />
      </g>
    ),
  },

  // Fractură - large X across the tooth body
  fract: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <line x1="10" y1="20" x2="30" y2="70" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        <line x1="30" y1="20" x2="10" y2="70" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      </g>
    ),
  },

  // Gingivită - red band along the gum line (cervical area)
  gg: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M8,46 Q20,40 32,46 L32,50 Q20,44 8,50 Z" fill="#EF4444" opacity="0.55" />
      </g>
    ),
  },

  // Implant existent - green screw shape replacing the root
  impl: {
    isAbsent: true,
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="16" y="6" width="8" height="38" rx="3" fill="#22C55E" opacity="0.7" />
        {[12, 18, 24, 30].map((y) => (
          <line key={y} x1="16" y1={y} x2="24" y2={y} stroke="#166534" strokeWidth="1" opacity="0.5" />
        ))}
        <rect x="14" y="4" width="12" height="4" rx="1.5" fill="#16A34A" opacity="0.6" />
      </g>
    ),
  },

  // Leziune cuneiformă - red triangle/wedge at the cervical zone
  lc: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M12,48 L20,54 L12,54 Z" fill="#DC2626" opacity="0.7" />
      </g>
    ),
  },

  // Marmorație - pinkish/salmon wash over the whole tooth (enamel defect)
  mm: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M20,4 C17,4 14,14 13,26 C12,34 11,42 10,50 C9,58 9,64 10,68 C11,72 14,76 20,76 C26,76 29,72 30,68 C31,64 31,58 30,50 C29,42 28,34 27,26 C26,14 23,4 20,4Z" fill="#F87171" opacity="0.3" />
        <ellipse cx="17" cy="55" rx="3" ry="5" fill="#FBBF24" opacity="0.2" />
        <ellipse cx="24" cy="62" rx="2.5" ry="4" fill="#FBBF24" opacity="0.2" />
      </g>
    ),
  },

  // Migrat - red horizontal arrow across the crown
  migr: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <line x1="8" y1="58" x2="32" y2="58" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        <path d="M28,54 L34,58 L28,62" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      </g>
    ),
  },

  // Mobilitate - red vertical double arrow
  mob: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <line x1="20" y1="14" x2="20" y2="68" stroke="#DC2626" strokeWidth="2" opacity="0.6" />
        <path d="M16,18 L20,10 L24,18" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        <path d="M16,64 L20,72 L24,64" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      </g>
    ),
  },

  // Mobilitate Grad I - smaller red vertical double arrow (less severe)
  m1: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <line x1="20" y1="26" x2="20" y2="58" stroke="#DC2626" strokeWidth="1.5" opacity="0.5" />
        <path d="M17,30 L20,24 L23,30" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        <path d="M17,54 L20,60 L23,54" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      </g>
    ),
  },

  // Obturație de canal - green fill along the root canal
  odc: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M18,8 Q18,24 17,38 L23,38 Q22,24 22,8 Z" fill="#22C55E" opacity="0.55" />
      </g>
    ),
  },

  // Obturație externă distală - blue square on distal (right) side of crown
  oed: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="23" y="54" width="7" height="10" rx="1.5" fill="#3B82F6" opacity="0.65" />
      </g>
    ),
  },

  // Obturație externă mezială - blue square on mesial (left) side of crown
  oem: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="10" y="54" width="7" height="10" rx="1.5" fill="#3B82F6" opacity="0.65" />
      </g>
    ),
  },

  // Obturație externă mezio-ocluzală - blue L-shape mesial + occlusal
  oemo: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M10,54 L17,54 L17,62 L27,62 L27,74 L13,74 L13,62 L10,62 Z" fill="#3B82F6" opacity="0.6" />
      </g>
    ),
  },

  // Obturație externă mezio-ocluzo-distală - blue U-shape
  oemod: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M10,54 L17,54 L17,62 L23,62 L23,54 L30,54 L30,62 L27,62 L27,74 L13,74 L13,62 L10,62 Z" fill="#3B82F6" opacity="0.6" />
      </g>
    ),
  },

  // Obturație externă ocluzală - blue block on occlusal surface
  oeo: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="13" y="62" width="14" height="12" rx="2" fill="#3B82F6" opacity="0.6" />
      </g>
    ),
  },

  // Obturație externă ocluzo-distală - blue on occlusal + distal
  oeod: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M13,62 L27,62 L30,62 L30,54 L23,54 L23,62 L27,74 L13,74 Z" fill="#3B82F6" opacity="0.6" />
      </g>
    ),
  },

  // Pivot-RCR - dark metallic post in the root canal
  rcr: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="17" y="8" width="6" height="36" rx="2" fill="#6B7280" opacity="0.7" />
        <rect x="15" y="40" width="10" height="6" rx="1.5" fill="#9CA3AF" opacity="0.6" />
      </g>
    ),
  },

  // Proteză existentă - pink gum-colored band at the cervical/gum area
  prot: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M8,44 Q20,38 32,44 L32,52 Q20,46 8,52 Z" fill="#F9A8D4" opacity="0.55" />
      </g>
    ),
  },

  // Pulpită - yellow/amber glow inside the crown (inflamed pulp)
  pp: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <ellipse cx="20" cy="58" rx="5" ry="8" fill="#FBBF24" opacity="0.5" />
        <ellipse cx="20" cy="58" rx="3" ry="5" fill="#F59E0B" opacity="0.4" />
      </g>
    ),
  },
};

/**
 * Returns overlay elements and absent flag for all conditions on a specific tooth.
 */
export function getToothOverlays(conditionCodes: string[], toothNumber: number): { overlays: React.ReactNode[]; isAbsent: boolean } {
  let isAbsent = false;
  const overlays = conditionCodes
    .map((code) => {
      const overlay = CONDITION_OVERLAYS[code];
      if (!overlay) return null;
      if (overlay.isAbsent) {
        isAbsent = true;
      }
      const rendered = overlay.render(`${toothNumber}-${code}`);
      return rendered;
    })
    .filter(Boolean) as React.ReactNode[];
  return { overlays, isAbsent };
}
