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
  cv: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <ellipse cx="20" cy="60" rx="7" ry="6" fill="#DC2626" opacity="0.55" />
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

  // Carie secundară distală - orange patch on distal side (indicates secondary/recurrent)
  csd: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="23" y="54" width="7" height="10" rx="1.5" fill="#F97316" opacity="0.7" />
      </g>
    ),
  },

  // Carie secundară mezială
  csm: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="10" y="54" width="7" height="10" rx="1.5" fill="#F97316" opacity="0.7" />
      </g>
    ),
  },

  // Carie secundară mezio-ocluzală
  csmo: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M10,54 L17,54 L17,62 L27,62 L27,74 L13,74 L13,62 L10,62 Z" fill="#F97316" opacity="0.6" />
      </g>
    ),
  },

  // Carie secundară ocluzală
  cso: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="13" y="62" width="14" height="12" rx="2" fill="#F97316" opacity="0.6" />
      </g>
    ),
  },

  // Carie secundară ocluzo-distală
  csod: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M13,62 L27,62 L30,62 L30,54 L23,54 L23,62 L27,74 L13,74 Z" fill="#F97316" opacity="0.6" />
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
        return null;
      }
      return overlay.render(`${toothNumber}-${code}`);
    })
    .filter(Boolean) as React.ReactNode[];
  return { overlays, isAbsent };
}
