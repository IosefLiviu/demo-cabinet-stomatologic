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

  // Carie avansată - red fill at the occlusal (top of crown) area
  ca: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <ellipse cx="20" cy="72" rx="8" ry="5" fill="#DC2626" opacity="0.7" />
      </g>
    ),
  },

  // Carie de colet - small red rectangle at the cervical zone
  cc: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="15" y="47" width="10" height="6" rx="1" fill="#DC2626" opacity="0.75" />
      </g>
    ),
  },

  // Carie incipientă - small dot on occlusal surface
  ci: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <circle cx="20" cy="68" r="3" fill="#EF4444" opacity="0.6" />
      </g>
    ),
  },

  // Carie mezială - red mark on mesial (left) side
  cm: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="10" y="55" width="5" height="12" rx="2" fill="#DC2626" opacity="0.7" />
      </g>
    ),
  },

  // Carie ocluzală - red on the occlusal surface
  co: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <ellipse cx="20" cy="66" rx="6" ry="4" fill="#DC2626" opacity="0.65" />
      </g>
    ),
  },

  // Carie mezio-ocluzală - mesial + occlusal
  cmo: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="10" y="55" width="5" height="12" rx="2" fill="#DC2626" opacity="0.7" />
        <ellipse cx="20" cy="66" rx="6" ry="4" fill="#DC2626" opacity="0.65" />
      </g>
    ),
  },

  // Carie mezio-ocluzo-distală - mesial + occlusal + distal
  cmod: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="10" y="55" width="5" height="12" rx="2" fill="#DC2626" opacity="0.7" />
        <ellipse cx="20" cy="66" rx="6" ry="4" fill="#DC2626" opacity="0.65" />
        <rect x="25" y="55" width="5" height="12" rx="2" fill="#DC2626" opacity="0.7" />
      </g>
    ),
  },

  // Carie ocluzo-distală - occlusal + distal
  cod: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <ellipse cx="20" cy="66" rx="6" ry="4" fill="#DC2626" opacity="0.65" />
        <rect x="25" y="55" width="5" height="12" rx="2" fill="#DC2626" opacity="0.7" />
      </g>
    ),
  },

  // Carie palatinală - mark on palatal (lingual) side
  cp: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <ellipse cx="20" cy="60" rx="5" ry="6" fill="#DC2626" opacity="0.5" />
      </g>
    ),
  },

  // Carie vestibulară - mark on vestibular (buccal) side
  cv: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <ellipse cx="20" cy="62" rx="7" ry="5" fill="#DC2626" opacity="0.55" />
      </g>
    ),
  },

  // Carie radiculară distală
  crd: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="23" y="20" width="5" height="10" rx="2" fill="#DC2626" opacity="0.6" />
      </g>
    ),
  },

  // Carie radiculară mezială
  crm: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="12" y="20" width="5" height="10" rx="2" fill="#DC2626" opacity="0.6" />
      </g>
    ),
  },

  // Carie secundară distală
  csd: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="25" y="55" width="5" height="12" rx="2" fill="#F97316" opacity="0.7" />
      </g>
    ),
  },

  // Carie secundară mezială
  csm: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="10" y="55" width="5" height="12" rx="2" fill="#F97316" opacity="0.7" />
      </g>
    ),
  },

  // Carie secundară mezio-ocluzală
  csmo: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="10" y="55" width="5" height="12" rx="2" fill="#F97316" opacity="0.7" />
        <ellipse cx="20" cy="66" rx="6" ry="4" fill="#F97316" opacity="0.6" />
      </g>
    ),
  },

  // Carie secundară ocluzală
  cso: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <ellipse cx="20" cy="66" rx="6" ry="4" fill="#F97316" opacity="0.6" />
      </g>
    ),
  },

  // Carie secundară ocluzo-distală
  csod: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <ellipse cx="20" cy="66" rx="6" ry="4" fill="#F97316" opacity="0.6" />
        <rect x="25" y="55" width="5" height="12" rx="2" fill="#F97316" opacity="0.7" />
      </g>
    ),
  },

  // Recidivă carie distală
  rcd: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="25" y="55" width="5" height="12" rx="2" fill="#B91C1C" opacity="0.7" />
        <line x1="25" y1="55" x2="30" y2="67" stroke="#7F1D1D" strokeWidth="0.8" opacity="0.5" />
      </g>
    ),
  },

  // Recidivă carie mezială
  rcm: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="10" y="55" width="5" height="12" rx="2" fill="#B91C1C" opacity="0.7" />
        <line x1="10" y1="55" x2="15" y2="67" stroke="#7F1D1D" strokeWidth="0.8" opacity="0.5" />
      </g>
    ),
  },

  // Recidivă carie mezio-ocluzală
  rcmo: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="10" y="55" width="5" height="12" rx="2" fill="#B91C1C" opacity="0.7" />
        <ellipse cx="20" cy="66" rx="6" ry="4" fill="#B91C1C" opacity="0.6" />
      </g>
    ),
  },

  // Recidivă carie ocluzală
  rco: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <ellipse cx="20" cy="66" rx="6" ry="4" fill="#B91C1C" opacity="0.6" />
      </g>
    ),
  },

  // Recidivă carie ocluzo-distală
  rcod: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <ellipse cx="20" cy="66" rx="6" ry="4" fill="#B91C1C" opacity="0.6" />
        <rect x="25" y="55" width="5" height="12" rx="2" fill="#B91C1C" opacity="0.7" />
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
