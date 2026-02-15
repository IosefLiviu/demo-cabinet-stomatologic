/**
 * SVG overlays for dental conditions.
 * Adapted for the new anatomical tooth models where:
 *   - Crown is at TOP (y ≈ 2-30), root at BOTTOM (y ≈ 34-85+)
 *   - Center X ≈ 17, typical range x ≈ 7-27
 *   - Cervical/CEJ line ≈ y 28-34
 *   - Lower teeth are flipped via the parent SvgTooth transform (rotate 180°)
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
        <line x1="10" y1="4" x2="24" y2="28" stroke="#8B0000" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
        <line x1="24" y1="4" x2="10" y2="28" stroke="#8B0000" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      </g>
    ),
  },

  // Carie avansată - large red area covering crown tip (occlusal/incisal)
  ca: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M12,2 Q12,12 17,14 Q22,12 22,2 Z" fill="#DC2626" opacity="0.75" />
      </g>
    ),
  },

  // Carie de colet - red rectangle at the cervical zone (neck of tooth)
  cc: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="10" y="27" width="14" height="6" rx="1.5" fill="#DC2626" opacity="0.75" />
      </g>
    ),
  },

  // Carie incipientă - red area at crown (smaller than avansată)
  ci: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M13,2 Q13,8 17,10 Q21,8 21,2 Z" fill="#DC2626" opacity="0.65" />
      </g>
    ),
  },

  // Carie mezială - red patch on mesial (left) side of crown
  cm: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="7" y="10" width="7" height="10" rx="1.5" fill="#DC2626" opacity="0.75" />
      </g>
    ),
  },

  // Carie ocluzală - large red block on occlusal (top) surface
  co: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="11" y="4" width="12" height="10" rx="2" fill="#DC2626" opacity="0.7" />
      </g>
    ),
  },

  // Carie mezio-ocluzală - mesial side + occlusal
  cmo: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M7,10 L14,10 L14,4 L23,4 L23,14 L11,14 L11,10 L7,10 L7,20 L14,20 L14,14 Z" fill="#DC2626" opacity="0.7" />
      </g>
    ),
  },

  // Carie mezio-ocluzo-distală - U-shape wrapping mesial + occlusal + distal
  cmod: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M7,10 L14,10 L14,4 L20,4 L20,10 L27,10 L27,20 L20,20 L20,14 L14,14 L14,20 L7,20 Z" fill="#DC2626" opacity="0.7" />
      </g>
    ),
  },

  // Carie ocluzo-distală - occlusal + distal (right) side
  cod: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M11,4 L23,4 L23,10 L27,10 L27,20 L20,20 L20,14 L11,14 Z" fill="#DC2626" opacity="0.7" />
      </g>
    ),
  },

  // Carie palatinală - small red patch on palatal surface
  cp: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="7" y="14" width="6" height="6" rx="1.5" fill="#DC2626" opacity="0.7" />
      </g>
    ),
  },

  // Carie vestibulară - red on vestibular (front) surface of crown
  cv: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="12" y="10" width="10" height="8" rx="1.5" fill="#DC2626" opacity="0.7" />
      </g>
    ),
  },

  // Carie radiculară distală - red patch on distal root area
  crd: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="21" y="50" width="6" height="10" rx="1.5" fill="#DC2626" opacity="0.65" />
      </g>
    ),
  },

  // Carie radiculară mezială - red patch on mesial root area
  crm: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="9" y="50" width="6" height="10" rx="1.5" fill="#DC2626" opacity="0.65" />
      </g>
    ),
  },

  // Carie secundară distală - bicolor: blue (filling) + red (caries) on distal side
  csd: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="21" y="10" width="7" height="5" rx="1" fill="#3B82F6" opacity="0.65" />
        <rect x="21" y="15" width="7" height="5" rx="1" fill="#DC2626" opacity="0.7" />
      </g>
    ),
  },

  // Carie secundară mezială - bicolor on mesial side
  csm: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="7" y="10" width="7" height="5" rx="1" fill="#DC2626" opacity="0.7" />
        <rect x="7" y="15" width="7" height="5" rx="1" fill="#3B82F6" opacity="0.65" />
      </g>
    ),
  },

  // Carie secundară mezio-ocluzală - bicolor L-shape
  csmo: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="7" y="10" width="7" height="5" rx="1" fill="#DC2626" opacity="0.7" />
        <rect x="7" y="15" width="7" height="5" rx="1" fill="#3B82F6" opacity="0.6" />
        <rect x="11" y="4" width="12" height="4" rx="1" fill="#3B82F6" opacity="0.55" />
      </g>
    ),
  },

  // Carie secundară ocluzală - bicolor horizontal bar
  cso: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="11" y="4" width="12" height="5" rx="1" fill="#DC2626" opacity="0.7" />
        <rect x="11" y="9" width="12" height="5" rx="1" fill="#3B82F6" opacity="0.6" />
      </g>
    ),
  },

  // Carie secundară ocluzo-distală - bicolor on occlusal + distal
  csod: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="11" y="4" width="12" height="5" rx="1" fill="#3B82F6" opacity="0.55" />
        <rect x="21" y="10" width="7" height="5" rx="1" fill="#DC2626" opacity="0.7" />
        <rect x="21" y="15" width="7" height="5" rx="1" fill="#3B82F6" opacity="0.6" />
      </g>
    ),
  },

  // Recidivă carie distală - dark red with stripe accent
  rcd: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="21" y="10" width="7" height="10" rx="1.5" fill="#B91C1C" opacity="0.7" />
        <line x1="22" y1="12" x2="26" y2="18" stroke="#7F1D1D" strokeWidth="0.8" opacity="0.4" />
      </g>
    ),
  },

  // Recidivă carie mezială
  rcm: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="7" y="10" width="7" height="10" rx="1.5" fill="#B91C1C" opacity="0.7" />
        <line x1="9" y1="12" x2="13" y2="18" stroke="#7F1D1D" strokeWidth="0.8" opacity="0.4" />
      </g>
    ),
  },

  // Recidivă carie mezio-ocluzală
  rcmo: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M7,10 L14,10 L14,4 L23,4 L23,14 L11,14 L11,10 L7,10 L7,20 L14,20 L14,14 Z" fill="#B91C1C" opacity="0.65" />
      </g>
    ),
  },

  // Recidivă carie ocluzală
  rco: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="11" y="4" width="12" height="10" rx="2" fill="#B91C1C" opacity="0.65" />
      </g>
    ),
  },

  // Recidivă carie ocluzo-distală
  rcod: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M11,4 L23,4 L23,10 L27,10 L27,20 L20,20 L20,14 L11,14 Z" fill="#B91C1C" opacity="0.65" />
      </g>
    ),
  },

  // CHIST - yellowish/olive blob at the root apex
  chist: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <ellipse cx="17" cy="76" rx="7" ry="6" fill="#A3A23A" opacity="0.65" />
        <ellipse cx="17" cy="76" rx="4" ry="3.5" fill="#C4C34A" opacity="0.4" />
      </g>
    ),
  },

  // Coroană existentă - gold/amber cap over the crown portion
  cor: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M9,4 Q9,2 17,2 Q25,2 25,4 L25,20 Q25,28 17,30 Q9,28 9,20 Z" fill="#D4A017" opacity="0.45" />
        <path d="M11,6 Q11,4 17,3 Q23,4 23,6" fill="none" stroke="#B8860B" strokeWidth="0.8" opacity="0.5" />
      </g>
    ),
  },

  // Devital - grey/pale wash over the entire tooth
  dev: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M17,2 C13,2 10,12 9,24 C8,32 8,40 9,48 C10,56 11,64 13,72 C15,78 17,82 17,82 C17,82 19,78 21,72 C23,64 24,56 25,48 C26,40 26,32 25,24 C24,12 21,2 17,2 Z" fill="#9CA3AF" opacity="0.4" />
      </g>
    ),
  },

  // Durere - red pulsing dot at the crown tip (occlusal/incisal)
  dur: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <ellipse cx="17" cy="6" rx="5" ry="4" fill="#EF4444" opacity="0.7" />
        <ellipse cx="17" cy="6" rx="3" ry="2.5" fill="#FCA5A5" opacity="0.6" />
      </g>
    ),
  },

  // Fractură - large X across the tooth body
  fract: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <line x1="8" y1="6" x2="26" y2="70" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        <line x1="26" y1="6" x2="8" y2="70" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      </g>
    ),
  },

  // Gingivită - red band along the gum line (cervical area)
  gg: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M6,28 Q17,24 28,28 L28,32 Q17,28 6,32 Z" fill="#EF4444" opacity="0.55" />
      </g>
    ),
  },

  // Implant existent - green screw shape replacing the root
  impl: {
    isAbsent: true,
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="14" y="34" width="8" height="38" rx="3" fill="#22C55E" opacity="0.7" />
        {[40, 46, 52, 58].map((y) => (
          <line key={y} x1="14" y1={y} x2="22" y2={y} stroke="#166534" strokeWidth="1" opacity="0.5" />
        ))}
        <rect x="12" y="30" width="12" height="4" rx="1.5" fill="#16A34A" opacity="0.6" />
      </g>
    ),
  },

  // Leziune cuneiformă - red triangle/wedge at the cervical zone
  lc: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M9,28 L17,22 L9,22 Z" fill="#DC2626" opacity="0.7" />
      </g>
    ),
  },

  // Marmorație - pinkish/salmon wash over the whole tooth (enamel defect)
  mm: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M17,2 C13,2 10,12 9,24 C8,32 8,40 9,48 C10,56 13,72 17,82 C21,72 24,56 25,48 C26,40 26,32 25,24 C24,12 21,2 17,2 Z" fill="#F87171" opacity="0.3" />
        <ellipse cx="14" cy="14" rx="3" ry="5" fill="#FBBF24" opacity="0.2" />
        <ellipse cx="21" cy="10" rx="2.5" ry="4" fill="#FBBF24" opacity="0.2" />
      </g>
    ),
  },

  // Migrat - red horizontal arrow across the crown
  migr: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <line x1="5" y1="16" x2="29" y2="16" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        <path d="M25,12 L31,16 L25,20" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      </g>
    ),
  },

  // Mobilitate - red vertical double arrow
  mob: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <line x1="17" y1="8" x2="17" y2="72" stroke="#DC2626" strokeWidth="2" opacity="0.6" />
        <path d="M13,12 L17,4 L21,12" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        <path d="M13,68 L17,76 L21,68" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      </g>
    ),
  },

  // Mobilitate Grad I - smaller red vertical double arrow (less severe)
  m1: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <line x1="17" y1="16" x2="17" y2="50" stroke="#DC2626" strokeWidth="1.5" opacity="0.5" />
        <path d="M14,20 L17,14 L20,20" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        <path d="M14,46 L17,52 L20,46" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      </g>
    ),
  },

  // Obturație de canal - green fill along the root canal
  odc: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M15,34 Q15,50 14,68 L20,68 Q19,50 19,34 Z" fill="#22C55E" opacity="0.55" />
      </g>
    ),
  },

  // Obturație externă distală - blue square on distal (right) side of crown
  oed: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="21" y="10" width="7" height="10" rx="1.5" fill="#3B82F6" opacity="0.65" />
      </g>
    ),
  },

  // Obturație externă mezială - blue square on mesial (left) side of crown
  oem: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="7" y="10" width="7" height="10" rx="1.5" fill="#3B82F6" opacity="0.65" />
      </g>
    ),
  },

  // Obturație externă mezio-ocluzală - blue L-shape mesial + occlusal
  oemo: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M7,10 L14,10 L14,4 L23,4 L23,14 L11,14 L11,10 L7,10 L7,20 L14,20 L14,14 Z" fill="#3B82F6" opacity="0.6" />
      </g>
    ),
  },

  // Obturație externă mezio-ocluzo-distală - blue U-shape
  oemod: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M7,10 L14,10 L14,4 L20,4 L20,10 L27,10 L27,20 L20,20 L20,14 L14,14 L14,20 L7,20 Z" fill="#3B82F6" opacity="0.6" />
      </g>
    ),
  },

  // Obturație externă ocluzală - blue block on occlusal surface
  oeo: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="11" y="4" width="12" height="10" rx="2" fill="#3B82F6" opacity="0.6" />
      </g>
    ),
  },

  // Obturație externă ocluzo-distală - blue on occlusal + distal
  oeod: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M11,4 L23,4 L23,10 L27,10 L27,20 L20,20 L20,14 L11,14 Z" fill="#3B82F6" opacity="0.6" />
      </g>
    ),
  },

  // Pivot-RCR - dark metallic post in the root canal
  rcr: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="15" y="34" width="6" height="36" rx="2" fill="#6B7280" opacity="0.7" />
        <rect x="13" y="28" width="10" height="6" rx="1.5" fill="#9CA3AF" opacity="0.6" />
      </g>
    ),
  },

  // Proteză existentă - pink gum-colored band at the cervical/gum area
  prot: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M6,26 Q17,22 28,26 L28,34 Q17,30 6,34 Z" fill="#F9A8D4" opacity="0.55" />
      </g>
    ),
  },

  // Pulpită - yellow/amber glow inside the crown (inflamed pulp)
  pp: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <ellipse cx="17" cy="16" rx="5" ry="8" fill="#FBBF24" opacity="0.5" />
        <ellipse cx="17" cy="16" rx="3" ry="5" fill="#F59E0B" opacity="0.4" />
      </g>
    ),
  },

  // Punte existentă - amber/gold band across the crown (bridge abutment)
  punte: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M6,6 L28,6 L28,20 Q17,24 6,20 Z" fill="#D97706" opacity="0.45" />
        <line x1="6" y1="6" x2="28" y2="6" stroke="#B45309" strokeWidth="1" opacity="0.5" />
      </g>
    ),
  },

  // Rest radicular - grey darkened root stump (only root remains)
  rr: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M14,34 Q14,50 13,68 L21,68 Q20,50 20,34 Z" fill="#6B7280" opacity="0.6" />
        <path d="M11,28 L23,28 L21,34 L14,34 Z" fill="#4B5563" opacity="0.5" />
      </g>
    ),
  },

  // Semi erupt - faded/transparent lower half of crown (partially erupted)
  se: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="4" y="16" width="26" height="20" fill="white" opacity="0.65" />
      </g>
    ),
  },

  // Tratament endodontic - green line through the root canal
  te: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M15,34 Q15,50 14,72 L20,72 Q19,50 19,34 Z" fill="#22C55E" opacity="0.55" />
        <circle cx="17" cy="74" r="2" fill="#16A34A" opacity="0.5" />
      </g>
    ),
  },

  // Tratament endodontic incomplet - partial green line (shorter)
  tei: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M15,34 Q15,44 14,56 L20,56 Q19,44 19,34 Z" fill="#22C55E" opacity="0.45" />
        <line x1="13" y1="56" x2="21" y2="56" stroke="#F97316" strokeWidth="1.5" opacity="0.6" />
      </g>
    ),
  },

  // Tartru - brownish band at the cervical zone
  tart: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M8,28 Q17,24 26,28 L26,32 Q17,28 8,32 Z" fill="#92400E" opacity="0.45" />
      </g>
    ),
  },

  // Urgență - red exclamation mark
  urg: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="15" y="10" width="4" height="20" rx="2" fill="#EF4444" opacity="0.75" />
        <circle cx="17" cy="38" r="2.5" fill="#EF4444" opacity="0.75" />
      </g>
    ),
  },

  // Vinir ceramic - thin blue layer on vestibular surface
  vc: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M9,4 Q9,14 11,22 Q17,28 23,22 Q25,14 25,4 Q17,2 9,4 Z" fill="#93C5FD" opacity="0.4" />
      </g>
    ),
  },

  // Vinir compozit - thin amber layer on vestibular surface
  vco: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M9,4 Q9,14 11,22 Q17,28 23,22 Q25,14 25,4 Q17,2 9,4 Z" fill="#FCD34D" opacity="0.4" />
      </g>
    ),
  },

  // Coroană ceramică - white/ceramic cap
  ccr: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M9,4 Q9,2 17,2 Q25,2 25,4 L25,20 Q25,28 17,30 Q9,28 9,20 Z" fill="#F0F0F0" opacity="0.5" />
        <path d="M9,28 Q17,24 25,28" fill="none" stroke="#D1D5DB" strokeWidth="0.8" opacity="0.6" />
      </g>
    ),
  },

  // Coroană metalo-ceramică - grey metallic cap
  cmc: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M9,4 Q9,2 17,2 Q25,2 25,4 L25,20 Q25,28 17,30 Q9,28 9,20 Z" fill="#9CA3AF" opacity="0.4" />
        <path d="M9,28 Q17,24 25,28" fill="none" stroke="#6B7280" strokeWidth="0.8" opacity="0.6" />
      </g>
    ),
  },

  // Coroană provizorie - light amber temporary cap
  cpv: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M9,4 Q9,2 17,2 Q25,2 25,4 L25,20 Q25,28 17,30 Q9,28 9,20 Z" fill="#FBBF24" opacity="0.35" strokeDasharray="2 1" stroke="#D97706" strokeWidth="0.5" />
      </g>
    ),
  },

  // Dinte inclus - faded entire tooth with downward arrow
  di: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <rect x="4" y="0" width="26" height="84" fill="white" opacity="0.5" />
        <path d="M13,60 L17,70 L21,60" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </g>
    ),
  },

  // Complet erupt - subtle green checkmark
  er: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <path d="M11,14 L15,20 L23,8" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      </g>
    ),
  },

  // Extruzie - upward arrow
  ext: {
    render: (id) => (
      <g key={`ov-${id}`}>
        <line x1="17" y1="70" x2="17" y2="10" stroke="#7C3AED" strokeWidth="2" opacity="0.5" />
        <path d="M12,16 L17,6 L22,16" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
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
