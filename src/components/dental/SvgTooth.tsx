import { cn } from '@/lib/utils';

// ─── Realistic anatomical tooth shapes ───────────────────────────────────────
// viewBox: 0 0 40 80
// Upper teeth: root at top (y≈0-38), cervical line (~y38-42), crown at bottom (y≈42-78)
// Multi-rooted teeth have VISIBLE furcation/trifurcation notches – the outline
// path traces around each root separately.
//
// UPPER vs LOWER variants:
//   Upper molars  → 3 roots (mesiobuccal, distobuccal, palatal) with trifurcation
//   Lower molars  → 2 roots (mesial, distal) wider & more rectangular crown
//   Upper 1st PM  → bifurcated root
//   Lower 1st PM  → single root (like 2nd premolar)

const TOOTH_SHAPES: Record<string, {
  outline: string;
  cervical?: string;
  rootLines?: string[];
  details?: string[];
  cusps?: string[];
  /** Additional marginal ridge paths on the crown */
  marginalRidges?: string[];
  innerHighlight?: string;
  /** Crown-only path for enamel cap gradient */
  crownArea?: string;
  /** Gum-coloured fill between separated roots */
  furcationArea?: string;
}> = {

  // ════════════════════════════════════════════════════════════════════════════
  //  INCISORS
  // ════════════════════════════════════════════════════════════════════════════

  // ── Upper Central Incisor: broad spatulate crown, single conical root ──
  upperCentralIncisor: {
    outline:
      "M20,2 C18,2 16,6 15,12 C14,20 13.5,28 13,34 C12.5,38 12,41 11.5,45" +
      " C11,49 10.5,54 10.5,59 C10.8,64 12,68 14.5,72 C16.5,75 18.5,77 20,78" +
      " C21.5,77 23.5,75 25.5,72 C28,68 29.2,64 29.5,59 C29.5,54 29,49 28.5,45" +
      " C28,41 27.5,38 27,34 C26.5,28 26,20 25,12 C24,6 22,2 20,2Z",
    crownArea:
      "M12,42 C11.5,46 11,50 10.8,55 C10.8,60 11.5,65 13.5,70" +
      " C15.5,74 18,77 20,78 C22,77 24.5,74 26.5,70 C28.5,65 29.2,60 29.2,55" +
      " C29,50 28.5,46 28,42 Q24,39 20,38 Q16,39 12,42Z",
    innerHighlight:
      "M20,6 C19,6 17.5,10 16.5,18 C16,24 15.5,30 15,36 C14.5,40 14,44 13.5,49" +
      " C13.2,54 13.5,60 15,65 C16.5,70 18.5,74 20,75 C21.5,74 23.5,70 25,65" +
      " C26.5,60 26.8,54 26.5,49 C26,44 25.5,40 25,36 C24.5,30 24,24 23.5,18" +
      " C22.5,10 21,6 20,6Z",
    cervical: "M12.5,42 Q16,39 20,38 Q24,39 27.5,42",
    rootLines: [
      "M18.5,5 Q19,16 18.8,34",
      "M21.5,5 Q21,16 21.2,34",
    ],
    cusps: [
      "M13,62 Q16.5,56 20,54 Q23.5,56 27,62",
    ],
    marginalRidges: [
      "M11.5,50 Q12,48 13,46",
      "M28.5,50 Q28,48 27,46",
    ],
    details: [
      // Mamelons (developmental ridges on incisal edge)
      "M15,72 Q16,70 17,72",
      "M19,71 Q20,69 21,71",
      "M23,72 Q24,70 25,72",
    ],
  },

  // ── Lower Central Incisor: narrower, more delicate ──
  lowerCentralIncisor: {
    outline:
      "M20,3 C18.5,3 17.2,7 16.5,13 C15.8,20 15.5,27 15.2,33" +
      " C15,37 14.8,40 14.5,43 C14.2,47 14,51 14.2,56 C14.5,61 15.5,65 17,69" +
      " C18.5,72 19.5,74 20,74.5 C20.5,74 21.5,72 23,69 C24.5,65 25.5,61 25.8,56" +
      " C26,51 25.8,47 25.5,43 C25.2,40 25,37 24.8,33 C24.5,27 24.2,20 23.5,13" +
      " C22.8,7 21.5,3 20,3Z",
    crownArea:
      "M14.5,43 C14.2,47 14,51 14.2,56 C14.5,61 15.5,65 17,69" +
      " C18.5,72 19.5,74 20,74.5 C20.5,74 21.5,72 23,69 C24.5,65 25.5,61 25.8,56" +
      " C26,51 25.8,47 25.5,43 Q23,41 20,40 Q17,41 14.5,43Z",
    innerHighlight:
      "M20,7 C19.2,7 18,11 17.5,17 C17,23 16.8,29 16.5,34" +
      " C16.3,38 16.2,42 16.2,46 C16.2,51 16.5,56 17.5,61" +
      " C18.5,65 19.5,70 20,71 C20.5,70 21.5,65 22.5,61" +
      " C23.5,56 23.8,51 23.8,46 C23.8,42 23.7,38 23.5,34" +
      " C23.2,29 23,23 22.5,17 C22,11 20.8,7 20,7Z",
    cervical: "M14.5,43 Q17,41 20,40 Q23,41 25.5,43",
    rootLines: [
      "M18.8,6 Q19,16 19,36",
      "M21.2,6 Q21,16 21,36",
    ],
    cusps: [
      "M15.5,62 Q17.5,58 20,56 Q22.5,58 24.5,62",
    ],
  },

  // ── Upper Lateral Incisor: narrower crown, single root ──
  upperLateralIncisor: {
    outline:
      "M20,3 C18.5,3 17,7 16,13 C15,20 14.5,27 14,33 C13.5,37 13.2,41 13,44" +
      " C12.8,48 12.5,52 12.8,57 C13,62 14,66 16,70 C17.5,73 19,75 20,75.5" +
      " C21,75 22.5,73 24,70 C26,66 27,62 27.2,57 C27.5,52 27.2,48 27,44" +
      " C26.8,41 26.5,37 26,33 C25.5,27 25,20 24,13 C23,7 21.5,3 20,3Z",
    crownArea:
      "M13,44 C12.8,48 12.5,52 12.8,57 C13,62 14,66 16,70" +
      " C17.5,73 19,75 20,75.5 C21,75 22.5,73 24,70 C26,66 27,62 27.2,57" +
      " C27.5,52 27.2,48 27,44 Q23.5,41 20,40 Q16.5,41 13,44Z",
    innerHighlight:
      "M20,7 C19,7 17.8,11 17,17 C16.2,24 15.5,30 15.2,35 C15,39 14.8,43 14.8,47" +
      " C14.8,52 15.2,57 16.5,62 C17.5,66 19,70 20,71 C21,70 22.5,66 23.5,62" +
      " C24.8,57 25.2,52 25.2,47 C25.2,43 25,39 24.8,35 C24.5,30 23.8,24 23,17" +
      " C22.2,11 21,7 20,7Z",
    cervical: "M13,44 Q16.5,41 20,40 Q23.5,41 27,44",
    rootLines: [
      "M18,7 Q18.5,18 18.2,36",
      "M22,7 Q21.5,18 21.8,36",
    ],
    cusps: [
      "M14.5,62 Q17,57 20,55 Q23,57 25.5,62",
    ],
    details: [
      "M16,70 Q17.5,68 18.5,70",
      "M21.5,70 Q22.5,68 24,70",
    ],
  },

  // ── Lower Lateral Incisor: slightly wider than lower central ──
  lowerLateralIncisor: {
    outline:
      "M20,3 C18.2,3 16.8,7 15.8,13 C14.8,20 14.3,27 14,33" +
      " C13.7,37 13.5,40 13.2,43 C13,47 12.8,51 13,56 C13.2,61 14.2,65 16,69" +
      " C17.5,72 19,74 20,74.5 C21,74 22.5,72 24,69 C25.8,65 26.8,61 27,56" +
      " C27.2,51 27,47 26.8,43 C26.5,40 26.3,37 26,33 C25.7,27 25.2,20 24.2,13" +
      " C23.2,7 21.8,3 20,3Z",
    crownArea:
      "M13.2,43 C13,47 12.8,51 13,56 C13.2,61 14.2,65 16,69" +
      " C17.5,72 19,74 20,74.5 C21,74 22.5,72 24,69 C25.8,65 26.8,61 27,56" +
      " C27.2,51 27,47 26.8,43 Q23.5,41 20,40 Q16.5,41 13.2,43Z",
    innerHighlight:
      "M20,7 C18.8,7 17.5,11 16.8,17 C16,24 15.5,30 15.2,35" +
      " C15,39 14.8,42 14.8,46 C14.8,51 15,56 16,61 C17,65 18.5,70 20,71" +
      " C21.5,70 23,65 24,61 C25,56 25.2,51 25.2,46 C25.2,42 25,39 24.8,35" +
      " C24.5,30 24,24 23.2,17 C22.5,11 21.2,7 20,7Z",
    cervical: "M13.2,43 Q16.5,41 20,40 Q23.5,41 26.8,43",
    rootLines: [
      "M18.5,6 Q18.8,17 18.5,36",
      "M21.5,6 Q21.2,17 21.5,36",
    ],
    cusps: [
      "M14.8,61 Q17,57 20,55 Q23,57 25.2,61",
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  CANINES
  // ════════════════════════════════════════════════════════════════════════════

  // ── Upper Canine: prominent pointed cusp, long single root ──
  upperCanine: {
    outline:
      "M20,1 C18,1 16,5 15,12 C14,20 13.2,27 12.5,33 C12,37 11.5,41 11,44" +
      " C10.5,48 10.2,52 10.5,57 C10.8,62 12,66 14.5,70 C16.5,73 18.5,76 20,78" +
      " C21.5,76 23.5,73 25.5,70 C28,66 29.2,62 29.5,57 C29.8,52 29.5,48 29,44" +
      " C28.5,41 28,37 27.5,33 C26.8,27 26,20 25,12 C24,5 22,1 20,1Z",
    crownArea:
      "M11,44 C10.5,48 10.2,52 10.5,57 C10.8,62 12,66 14.5,70" +
      " C16.5,73 18.5,76 20,78 C21.5,76 23.5,73 25.5,70 C28,66 29.2,62 29.5,57" +
      " C29.8,52 29.5,48 29,44 Q24.5,41 20,40 Q15.5,41 11,44Z",
    innerHighlight:
      "M20,5 C19,5 17,9 16,16 C15,23 14.2,30 13.8,35 C13.5,39 13,43 12.8,47" +
      " C12.6,52 13,57 14.5,62 C16,66 18,72 20,74 C22,72 24,66 25.5,62" +
      " C27,57 27.4,52 27.2,47 C27,43 26.5,39 26.2,35 C25.8,30 25,23 24,16" +
      " C23,9 21,5 20,5Z",
    cervical: "M11,44 Q15.5,41 20,40 Q24.5,41 29,44",
    rootLines: [
      "M17.5,4 Q18.5,18 18,36",
      "M22.5,4 Q21.5,18 22,36",
    ],
    cusps: [
      // Prominent cusp tip
      "M13,62 Q16.5,56 20,52 Q23.5,56 27,62",
    ],
    marginalRidges: [
      "M12,56 Q13,52 14.5,50",
      "M28,56 Q27,52 25.5,50",
    ],
    details: [
      // Cingulum ridge on lingual
      "M16,68 Q18,66 20,65 Q22,66 24,68",
    ],
  },

  // ── Lower Canine: slightly shorter root, less prominent cusp ──
  lowerCanine: {
    outline:
      "M20,2 C18.2,2 16.5,6 15.5,13 C14.5,20 13.8,27 13.2,33" +
      " C12.8,37 12.5,41 12,44 C11.5,48 11.2,52 11.5,57 C11.8,62 13,66 15,70" +
      " C17,73 19,76 20,77 C21,76 23,73 25,70 C27,66 28.2,62 28.5,57" +
      " C28.8,52 28.5,48 28,44 C27.5,41 27.2,37 26.8,33 C26.2,27 25.5,20 24.5,13" +
      " C23.5,6 21.8,2 20,2Z",
    crownArea:
      "M12,44 C11.5,48 11.2,52 11.5,57 C11.8,62 13,66 15,70" +
      " C17,73 19,76 20,77 C21,76 23,73 25,70 C27,66 28.2,62 28.5,57" +
      " C28.8,52 28.5,48 28,44 Q24,41 20,40 Q16,41 12,44Z",
    innerHighlight:
      "M20,6 C18.8,6 17.2,10 16.5,16 C15.5,23 14.8,30 14.5,35" +
      " C14.2,39 14,43 13.8,47 C13.6,52 14,57 15.5,62 C17,66 19,72 20,73" +
      " C21,72 23,66 24.5,62 C26,57 26.4,52 26.2,47 C26,43 25.8,39 25.5,35" +
      " C25.2,30 24.5,23 23.5,16 C22.8,10 21.2,6 20,6Z",
    cervical: "M12,44 Q16,41 20,40 Q24,41 28,44",
    rootLines: [
      "M18,5 Q18.5,18 18.2,36",
      "M22,5 Q21.5,18 21.8,36",
    ],
    cusps: [
      "M13.5,62 Q17,56 20,53 Q23,56 26.5,62",
    ],
    details: [
      "M16.5,68 Q18.5,66 20,65 Q21.5,66 23.5,68",
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  PREMOLARS
  // ════════════════════════════════════════════════════════════════════════════

  // ── Upper First Premolar: bicuspid crown, bifurcated root with VISIBLE furcation V-notch ──
  upperFirstPremolar: {
    // Two roots clearly separated with V-notch at ~y28
    outline:
      "M15,4 C13.5,4 12,8 11.5,14 C11,20 11,25 11.5,28 L11.5,28" +
      " C12,32 12.5,36 13,39 Q16.5,37 20,36 Q23.5,37 27,39" +
      " C27.5,36 28,32 28.5,28 L28.5,28 C29,25 29,20 28.5,14" +
      " C28,8 26.5,4 25,4 C23.5,4 22,8 20,16 C18,8 16.5,4 15,4Z" +
      " M13,39 C12.5,43 12,47 11.8,51 C11.5,56 12,61 13.5,65" +
      " C15,68 17.5,71 20,72 C22.5,71 25,68 26.5,65 C28,61 28.5,56 28.2,51" +
      " C28,47 27.5,43 27,39 Q23.5,37 20,36 Q16.5,37 13,39Z",
    crownArea:
      "M13,39 C12.5,43 12,47 11.8,51 C11.5,56 12,61 13.5,65" +
      " C15,68 17.5,71 20,72 C22.5,71 25,68 26.5,65 C28,61 28.5,56 28.2,51" +
      " C28,47 27.5,43 27,39 Q23.5,37 20,36 Q16.5,37 13,39Z",
    furcationArea:
      "M11.5,28 C13,24 16,20 20,16 C24,20 27,24 28.5,28" +
      " C28,32 27.5,36 27,39 Q23.5,37 20,36 Q16.5,37 13,39" +
      " C12.5,36 12,32 11.5,28Z",
    innerHighlight:
      "M16,8 C15,12 14,18 13.5,23 C13,26 13,29 13.5,33 C14,36 15,38 17,39" +
      " Q18.5,37.5 20,37 Q21.5,37.5 23,39 C25,38 26,36 26.5,33" +
      " C27,29 27,26 26.5,23 C26,18 25,12 24,8" +
      " C22.8,8 21.5,12 20,18 C18.5,12 17.2,8 16,8Z",
    cervical: "M13,39 Q16.5,37 20,36 Q23.5,37 27,39",
    rootLines: [
      "M14,8 Q14.5,16 14,28",
      "M26,8 Q25.5,16 26,28",
    ],
    details: [
      // Central fissure
      "M15,56 Q17.5,52 20,51 Q22.5,52 25,56",
    ],
    cusps: [
      // Buccal and palatal cusps
      "M14.5,58 L17,53 L20,55 L23,53 L25.5,58",
    ],
    marginalRidges: [
      "M13.5,48 Q14,46 15,44",
      "M26.5,48 Q26,46 25,44",
    ],
  },

  // ── Lower First Premolar: single root (like 2nd premolar but with distinct cusp pattern) ──
  lowerFirstPremolar: {
    outline:
      "M20,4 C18,4 16.2,8 15.2,15 C14.2,22 13.8,28 13.5,34" +
      " C13.2,38 13,41 12.8,44 C12.5,48 12.2,52 12.5,57 C12.8,62 13.8,66 15.5,69" +
      " C17,72 18.8,74 20,74.5 C21.2,74 23,72 24.5,69 C26.2,66 27.2,62 27.5,57" +
      " C27.8,52 27.5,48 27.2,44 C27,41 26.8,38 26.5,34 C26.2,28 25.8,22 24.8,15" +
      " C23.8,8 22,4 20,4Z",
    crownArea:
      "M12.8,44 C12.5,48 12.2,52 12.5,57 C12.8,62 13.8,66 15.5,69" +
      " C17,72 18.8,74 20,74.5 C21.2,74 23,72 24.5,69 C26.2,66 27.2,62 27.5,57" +
      " C27.8,52 27.5,48 27.2,44 Q23.5,41.5 20,40.5 Q16.5,41.5 12.8,44Z",
    innerHighlight:
      "M20,8 C18.5,8 17,12 16.2,19 C15.2,25 14.8,31 14.5,36" +
      " C14.3,40 14.2,43 14.2,47 C14.2,52 14.5,57 15.8,62" +
      " C16.8,66 18.5,70 20,71 C21.5,70 23.2,66 24.2,62" +
      " C25.5,57 25.8,52 25.8,47 C25.8,43 25.7,40 25.5,36" +
      " C25.2,31 24.8,25 23.8,19 C23,12 21.5,8 20,8Z",
    cervical: "M12.8,44 Q16.5,41.5 20,40.5 Q23.5,41.5 27.2,44",
    rootLines: [
      "M17.5,8 Q18,20 17.5,36",
      "M22.5,8 Q22,20 22.5,36",
    ],
    details: [
      "M15.5,57 Q17.5,53 20,52 Q22.5,53 24.5,57",
    ],
    cusps: [
      // Large buccal cusp dominant, small lingual cusp
      "M15,59 L17.5,54 L20,56 L22.5,55 L25,59",
    ],
  },

  // ── Upper Second Premolar: bicuspid crown, single root ──
  upperSecondPremolar: {
    outline:
      "M20,4 C18,4 16,8 15,15 C14,22 13.5,28 13,34 C12.5,38 12.2,41 12,44" +
      " C11.8,48 11.5,52 11.8,57 C12,62 13,66 15,69 C16.5,72 18.5,74 20,74.5" +
      " C21.5,74 23.5,72 25,69 C27,66 28,62 28.2,57 C28.5,52 28.2,48 28,44" +
      " C27.8,41 27.5,38 27,34 C26.5,28 26,22 25,15 C24,8 22,4 20,4Z",
    crownArea:
      "M12,44 C11.8,48 11.5,52 11.8,57 C12,62 13,66 15,69" +
      " C16.5,72 18.5,74 20,74.5 C21.5,74 23.5,72 25,69" +
      " C27,66 28,62 28.2,57 C28.5,52 28.2,48 28,44" +
      " Q24,41 20,40 Q16,41 12,44Z",
    innerHighlight:
      "M20,8 C18.5,8 17,12 16,19 C15,25 14.5,31 14.2,36 C14,40 13.8,43 13.8,47" +
      " C13.8,52 14.2,57 15.5,62 C16.5,66 18.5,70 20,71 C21.5,70 23.5,66 24.5,62" +
      " C25.8,57 26.2,52 26.2,47 C26.2,43 26,40 25.8,36 C25.5,31 25,25 24,19" +
      " C23,12 21.5,8 20,8Z",
    cervical: "M12,44 Q16,41 20,40 Q24,41 28,44",
    details: [
      "M15,58 Q17.5,53 20,52 Q22.5,53 25,58",
    ],
    rootLines: [
      "M17,8 Q17.5,20 17,36",
      "M23,8 Q22.5,20 23,36",
    ],
    cusps: [
      // Equal buccal and palatal cusps
      "M14.5,60 L17,55 L20,57 L23,55 L25.5,60",
    ],
    marginalRidges: [
      "M12.5,50 Q13,48 14,46",
      "M27.5,50 Q27,48 26,46",
    ],
  },

  // ── Lower Second Premolar: single root, 3-cusp pattern ──
  lowerSecondPremolar: {
    outline:
      "M20,4 C18,4 16.2,8 15.2,15 C14.2,22 13.8,28 13.5,34" +
      " C13.2,38 13,41 12.8,44 C12.5,48 12.2,52 12.5,57" +
      " C12.8,62 13.8,66 15.5,69 C17,72 18.8,74 20,74.5" +
      " C21.2,74 23,72 24.5,69 C26.2,66 27.2,62 27.5,57" +
      " C27.8,52 27.5,48 27.2,44 C27,41 26.8,38 26.5,34" +
      " C26.2,28 25.8,22 24.8,15 C23.8,8 22,4 20,4Z",
    crownArea:
      "M12.8,44 C12.5,48 12.2,52 12.5,57 C12.8,62 13.8,66 15.5,69" +
      " C17,72 18.8,74 20,74.5 C21.2,74 23,72 24.5,69" +
      " C26.2,66 27.2,62 27.5,57 C27.8,52 27.5,48 27.2,44" +
      " Q23.5,41.5 20,40.5 Q16.5,41.5 12.8,44Z",
    innerHighlight:
      "M20,8 C18.5,8 17,12 16.2,19 C15.2,25 14.8,31 14.5,36" +
      " C14.3,40 14.2,43 14.2,47 C14.2,52 14.5,57 15.8,62" +
      " C16.8,66 18.5,70 20,71 C21.5,70 23.2,66 24.2,62" +
      " C25.5,57 25.8,52 25.8,47 C25.8,43 25.7,40 25.5,36" +
      " C25.2,31 24.8,25 23.8,19 C23,12 21.5,8 20,8Z",
    cervical: "M12.8,44 Q16.5,41.5 20,40.5 Q23.5,41.5 27.2,44",
    details: [
      "M15.5,57 Q17.5,53 20,52 Q22.5,53 24.5,57",
    ],
    rootLines: [
      "M17.5,8 Q18,20 17.5,36",
      "M22.5,8 Q22,20 22.5,36",
    ],
    cusps: [
      // Tricuspid pattern (1 buccal + 2 lingual)
      "M15,59 L17,54 L19,56 L20,54 L21,56 L23,54 L25,59",
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  UPPER MOLARS — 3 roots with TRIFURCATION
  // ════════════════════════════════════════════════════════════════════════════

  // ── Upper First Molar: wide crown, THREE roots (2 buccal + 1 palatal) ──
  // The palatal root is the larger single root on one side, the two buccal
  // roots are narrower and closer together on the other side.
  // In the viewBox, roots splay out at top: left=palatal, center+right=mesiobuccal+distobuccal
  upperFirstMolar: {
    outline:
      // Palatal root (left, larger, more divergent)
      "M11,3 C9.5,3 8,8 7.5,14 C7,19 7.5,24 9,28" +
      // Trifurcation junction between palatal root and buccal roots
      " C10,31 11,34 12.5,37" +
      // Buccal root pair: mesiobuccal root
      " L14,32 C14.5,26 15,20 16,14 C16.5,10 17.5,6 19,4" +
      // V-notch between the two buccal roots
      " C20,8 20,14 20,20" +
      // Distobuccal root
      " C20,14 20.5,8 21,4 C22.5,6 23.5,10 24,14 C25,20 25.5,26 26,32" +
      // Back to trifurcation junction (right side)
      " L27.5,37 C29,34 30,31 31,28 C32.5,24 33,19 32.5,14" +
      " C32,8 30.5,3 29,3" +
      // Connect distobuccal root back through notch
      " C27.5,3 25.5,7 24,14 C23,8 22,5 20,4 C18,5 17,8 16,14" +
      " C14.5,7 12.5,3 11,3Z" +
      // Crown (separate subpath)
      " M12.5,37 C12,40 11.5,43 11,47 C10.5,52 10.5,57 11,61" +
      " C11.5,65 13,68 15.5,71 C17.5,73 19,74.5 20,75" +
      " C21,74.5 22.5,73 24.5,71 C27,68 28.5,65 29,61" +
      " C29.5,57 29.5,52 29,47 C28.5,43 28,40 27.5,37" +
      " Q24,35 20,34 Q16,35 12.5,37Z",
    crownArea:
      "M12.5,37 C12,40 11.5,43 11,47 C10.5,52 10.5,57 11,61" +
      " C11.5,65 13,68 15.5,71 C17.5,73 19,74.5 20,75" +
      " C21,74.5 22.5,73 24.5,71 C27,68 28.5,65 29,61" +
      " C29.5,57 29.5,52 29,47 C28.5,43 28,40 27.5,37" +
      " Q24,35 20,34 Q16,35 12.5,37Z",
    furcationArea:
      // Triangular area between the three roots
      "M9,28 C10.5,25 13,20 16,14 C17,8 19,4 20,4" +
      " C21,4 23,8 24,14 C27,20 29.5,25 31,28" +
      " C30,31 29,34 27.5,37 Q24,35 20,34 Q16,35 12.5,37" +
      " C11,34 10,31 9,28Z",
    innerHighlight:
      "M12,7 C11,10 10,15 9.5,20 C9,24 9.5,27 10.5,31" +
      " C11.5,34 12.5,36 14,37 Q17,35.5 20,34.5 Q23,35.5 26,37" +
      " C27.5,36 28.5,34 29.5,31 C30.5,27 31,24 30.5,20" +
      " C30,15 29,10 28,7 C26.5,7 25,10 24,14" +
      " C23,9 21.5,5 20,5 C18.5,5 17,9 16,14" +
      " C15,10 13.5,7 12,7Z",
    cervical: "M12.5,37 Q16,35 20,34 Q24,35 27.5,37",
    details: [
      // Oblique ridge (key upper molar feature)
      "M15,56 Q18,52 21,54 Q23,52 26,56",
      // Central fossa
      "M17,58 Q20,55 23,58",
      // Supplemental grooves
      "M14,53 Q15,51 16,53",
      "M24,53 Q25,51 26,53",
    ],
    rootLines: [
      // Palatal root canal
      "M10,7 Q10.5,15 10,26",
      // Mesiobuccal root canal
      "M17,8 Q17.5,16 17,28",
      // Distobuccal root canal
      "M25,8 Q24.5,16 25,28",
    ],
    cusps: [
      // 4 cusps: mesiobuccal, distobuccal, mesiopalatal, distopalatal
      "M13.5,60 L16,54 L18.5,56 L20,53 L21.5,56 L24,54 L26.5,60",
    ],
    marginalRidges: [
      "M12,48 Q13,45 14.5,43",
      "M28,48 Q27,45 25.5,43",
    ],
  },

  // ── Upper Second Molar: similar trifurcation, slightly smaller, roots closer together ──
  upperSecondMolar: {
    outline:
      // Palatal root (left)
      "M12,4 C10.5,4 9.5,9 9,15 C8.5,20 9,25 10,29" +
      " C11,32 11.5,35 12.5,37" +
      // Mesiobuccal root
      " L15,32 C15.5,26 16,20 17,14 C17.5,10 18.5,7 19.5,5" +
      // V-notch
      " C20,9 20,14 20,19" +
      // Distobuccal root
      " C20,14 20.5,9 21,5 C22,7 23,10 23.5,14 C24.5,20 25,26 25.5,32" +
      " L28,37 C29,35 29.5,32 30.5,29 C31.5,25 32,20 31.5,15" +
      " C31,9 30,4 28.5,4" +
      " C27,4 25.5,8 24,14 C23,9 21.5,5.5 20.5,5" +
      " C19.5,5.5 18,9 17,14 C15.5,8 14,4 12,4Z" +
      // Crown
      " M12.5,37 C12,40 11.5,43 11.2,47 C11,52 11,56 11.5,60" +
      " C12,64 13.5,67 15.5,70 C17.5,72 19,73.5 20,74" +
      " C21,73.5 22.5,72 24.5,70 C26.5,67 28,64 28.5,60" +
      " C29,56 29,52 28.8,47 C28.5,43 28,40 27.5,37" +
      " Q24,35.5 20,34.5 Q16,35.5 12.5,37Z",
    crownArea:
      "M12.5,37 C12,40 11.5,43 11.2,47 C11,52 11,56 11.5,60" +
      " C12,64 13.5,67 15.5,70 C17.5,72 19,73.5 20,74" +
      " C21,73.5 22.5,72 24.5,70 C26.5,67 28,64 28.5,60" +
      " C29,56 29,52 28.8,47 C28.5,43 28,40 27.5,37" +
      " Q24,35.5 20,34.5 Q16,35.5 12.5,37Z",
    furcationArea:
      "M10,29 C11.5,25 14,20 17,14 C18,9 19.5,5 20.5,5" +
      " C21.5,5 23,9 24,14 C27,20 29,25 30.5,29" +
      " C29.5,32 29,35 28,37 Q24,35.5 20,34.5 Q16,35.5 12.5,37" +
      " C11.5,35 11,32 10,29Z",
    innerHighlight:
      "M13,8 C12,11 11,16 10.5,20 C10,24 10.5,27 11.5,31" +
      " C12,34 13,36 14,37 Q17,35.5 20,35 Q23,35.5 26,37" +
      " C27,36 28,34 28.5,31 C29.5,27 30,24 29.5,20" +
      " C29,16 28,11 27,8 C26,8 24.5,11 23.5,14" +
      " C22.5,10 21,6 20,6 C19,6 17.5,10 16.5,14" +
      " C15.5,11 14,8 13,8Z",
    cervical: "M12.5,37 Q16,35.5 20,34.5 Q24,35.5 27.5,37",
    details: [
      "M15,55 Q17.5,51 20,53 Q22.5,51 25,55",
      "M17,57 Q20,54 23,57",
    ],
    rootLines: [
      "M10.5,8 Q11,16 10.5,27",
      "M17.5,9 Q18,17 17.5,29",
      "M24,9 Q23.5,17 24,29",
    ],
    cusps: [
      "M14,58 L16.5,53 L19,55 L20,52 L21,55 L23.5,53 L26,58",
    ],
    marginalRidges: [
      "M12,48 Q13,45 14,43",
      "M28,48 Q27,45 26,43",
    ],
  },

  // ── Upper Wisdom (Third Molar): short fused roots, smaller ──
  upperWisdom: {
    outline:
      "M15,8 C13.5,8 12,12 11.5,17 C11,22 11,26 11.5,30" +
      " C12,33 12.5,35 14,37 Q17,35 20,34 Q23,35 26,37" +
      " C27.5,35 28,33 28.5,30 C29,26 29,22 28.5,17 C28,12 26.5,8 25,8" +
      " C23.5,8 22,11 20,15 C18,11 16.5,8 15,8Z" +
      " M14,37 C13.5,40 13,43 12.5,47 C12,51 12,55 12.5,59" +
      " C13,62 14.5,65 16.5,68 C18,70 19.5,71 20,71.5" +
      " C20.5,71 22,70 23.5,68 C25.5,65 27,62 27.5,59" +
      " C28,55 28,51 27.5,47 C27,43 26.5,40 26,37" +
      " Q23,35 20,34 Q17,35 14,37Z",
    crownArea:
      "M14,37 C13.5,40 13,43 12.5,47 C12,51 12,55 12.5,59" +
      " C13,62 14.5,65 16.5,68 C18,70 19.5,71 20,71.5" +
      " C20.5,71 22,70 23.5,68 C25.5,65 27,62 27.5,59" +
      " C28,55 28,51 27.5,47 C27,43 26.5,40 26,37" +
      " Q23,35 20,34 Q17,35 14,37Z",
    furcationArea:
      "M11.5,30 C13,27 16,22 20,15 C24,22 27,27 28.5,30" +
      " C28,33 27.5,35 26,37 Q23,35 20,34 Q17,35 14,37" +
      " C12.5,35 12,33 11.5,30Z",
    innerHighlight:
      "M16,12 C15,14 14,18 13.5,23 C13,26 13,29 13.5,32 C14,34 14.5,36 15.5,37" +
      " Q17.5,35.5 20,35 Q22.5,35.5 24.5,37 C25.5,36 26,34 26.5,32" +
      " C27,29 27,26 26.5,23 C26,18 25,14 24,12" +
      " C23,12 22,13 20,16 C18,13 17,12 16,12Z",
    cervical: "M14,37 Q17,35 20,34 Q23,35 26,37",
    details: ["M15,55 Q17.5,51 20,53 Q22.5,51 25,55"],
    rootLines: [
      "M14,12 Q14.5,20 14,30",
      "M20,15 Q20,22 20,30",
      "M26,12 Q25.5,20 26,30",
    ],
    cusps: [
      "M15,57 L17.5,53 L20,55 L22.5,53 L25,57",
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  LOWER MOLARS — 2 roots with BIFURCATION
  // ════════════════════════════════════════════════════════════════════════════

  // ── Lower First Molar: wide rectangular crown, TWO roots (mesial + distal) ──
  // Lower molars have wider, more box-shaped crowns and roots that are
  // more parallel and plate-like compared to upper molars.
  lowerFirstMolar: {
    outline:
      // Mesial root (left)
      "M13,2 C11,2 9.5,7 9,14 C8.5,20 8.5,25 9.5,29" +
      // V-notch between roots
      " C10.5,32 12,35 13.5,37" +
      " Q16.5,35.5 20,35 Q23.5,35.5 26.5,37" +
      // Distal root (right)
      " C28,35 29.5,32 30.5,29 C31.5,25 31.5,20 31,14" +
      " C30.5,7 29,2 27,2" +
      // Connect through furcation
      " C25,2 23,7 20,16 C17,7 15,2 13,2Z" +
      // Crown - wider, more rectangular for lower molar
      " M13.5,37 C13,40 12.5,43 12,47 C11.5,52 11.5,57 12,61" +
      " C12.5,65 14,68 16,71 C17.5,73 19,74.5 20,75" +
      " C21,74.5 22.5,73 24,71 C26,68 27.5,65 28,61" +
      " C28.5,57 28.5,52 28,47 C27.5,43 27,40 26.5,37" +
      " Q23.5,35.5 20,35 Q16.5,35.5 13.5,37Z",
    crownArea:
      "M13.5,37 C13,40 12.5,43 12,47 C11.5,52 11.5,57 12,61" +
      " C12.5,65 14,68 16,71 C17.5,73 19,74.5 20,75" +
      " C21,74.5 22.5,73 24,71 C26,68 27.5,65 28,61" +
      " C28.5,57 28.5,52 28,47 C27.5,43 27,40 26.5,37" +
      " Q23.5,35.5 20,35 Q16.5,35.5 13.5,37Z",
    furcationArea:
      "M9.5,29 C11.5,25 15,19 20,16 C25,19 28.5,25 30.5,29" +
      " C29.5,32 28,35 26.5,37 Q23.5,35.5 20,35 Q16.5,35.5 13.5,37" +
      " C12,35 10.5,32 9.5,29Z",
    innerHighlight:
      "M14,6 C12.5,6 11,11 10.5,17 C10,22 10,26 11,30" +
      " C11.8,33 12.5,35 14,37 Q17,35.5 20,35.5 Q23,35.5 26,37" +
      " C27.5,35 28.2,33 29,30 C30,26 30,22 29.5,17" +
      " C29,11 27.5,6 26,6 C24.5,6 22.5,9 20,14" +
      " C17.5,9 15.5,6 14,6Z",
    cervical: "M13.5,37 Q16.5,35.5 20,35 Q23.5,35.5 26.5,37",
    details: [
      // Cross-shaped fissure pattern (typical lower molar)
      "M15,55 Q17.5,51 20,53 Q22.5,51 25,55",
      "M20,48 Q20,52 20,58",
      // Buccal groove
      "M16.5,59 Q20,55 23.5,59",
    ],
    rootLines: [
      "M11,6 Q11.5,14 11,26",
      "M29,6 Q28.5,14 29,26",
    ],
    cusps: [
      // 5 cusps for lower first molar (3 buccal + 2 lingual)
      "M14,59 L16,54 L18,56 L20,53 L22,56 L24,54 L26,59",
    ],
    marginalRidges: [
      "M13,47 Q14,44 15,42",
      "M27,47 Q26,44 25,42",
    ],
  },

  // ── Lower Second Molar: 2 roots, 4-cusp pattern, slightly smaller ──
  lowerSecondMolar: {
    outline:
      "M14,3 C12,3 10.5,8 10,15 C9.5,21 9.5,26 10.5,30" +
      " C11.5,33 12.5,35 13.5,37" +
      " Q16.5,35.5 20,35 Q23.5,35.5 26.5,37" +
      " C27.5,35 28.5,33 29.5,30 C30.5,26 30.5,21 30,15" +
      " C29.5,8 28,3 26,3" +
      " C24.5,3 22.5,7 20,14 C17.5,7 15.5,3 14,3Z" +
      // Crown
      " M13.5,37 C13,40 12.5,43 12,47 C11.5,52 11.5,56 12,60" +
      " C12.5,64 13.8,67 15.5,70 C17.5,72 19,73.5 20,74" +
      " C21,73.5 22.5,72 24.5,70 C26.2,67 27.5,64 28,60" +
      " C28.5,56 28.5,52 28,47 C27.5,43 27,40 26.5,37" +
      " Q23.5,35.5 20,35 Q16.5,35.5 13.5,37Z",
    crownArea:
      "M13.5,37 C13,40 12.5,43 12,47 C11.5,52 11.5,56 12,60" +
      " C12.5,64 13.8,67 15.5,70 C17.5,72 19,73.5 20,74" +
      " C21,73.5 22.5,72 24.5,70 C26.2,67 27.5,64 28,60" +
      " C28.5,56 28.5,52 28,47 C27.5,43 27,40 26.5,37" +
      " Q23.5,35.5 20,35 Q16.5,35.5 13.5,37Z",
    furcationArea:
      "M10.5,30 C12,26 15.5,20 20,14 C24.5,20 28,26 29.5,30" +
      " C28.5,33 27.5,35 26.5,37 Q23.5,35.5 20,35 Q16.5,35.5 13.5,37" +
      " C12.5,35 11.5,33 10.5,30Z",
    innerHighlight:
      "M15,7 C13.5,7 12,12 11.5,18 C11,23 11,27 12,31" +
      " C12.5,34 13.5,36 14.5,37 Q17.5,36 20,35.5 Q22.5,36 25.5,37" +
      " C26.5,36 27.5,34 28,31 C29,27 29,23 28.5,18" +
      " C28,12 26.5,7 25,7 C24,7 22.5,10 20,15" +
      " C17.5,10 16,7 15,7Z",
    cervical: "M13.5,37 Q16.5,35.5 20,35 Q23.5,35.5 26.5,37",
    details: [
      // Plus-shaped fissure pattern (typical 4-cusp lower molar)
      "M15,55 Q17.5,51 20,53 Q22.5,51 25,55",
      "M20,48 Q20,52 20,57",
    ],
    rootLines: [
      "M12,7 Q12.5,16 12,28",
      "M28,7 Q27.5,16 28,28",
    ],
    cusps: [
      // 4 cusps (2 buccal + 2 lingual)
      "M14.5,57 L17,52 L19.5,54 L20.5,51 L22.5,54 L25,52 L26.5,57",
    ],
    marginalRidges: [
      "M13,47 Q14,44 15,42",
      "M27,47 Q26,44 25,42",
    ],
  },

  // ── Lower Wisdom (Third Molar): short, partially fused roots, irregular ──
  lowerWisdom: {
    outline:
      "M15,8 C13.5,8 12,12 11.5,17 C11,22 11,26 11.5,30" +
      " C12,33 12.5,35 14,37 Q17,35 20,34 Q23,35 26,37" +
      " C27.5,35 28,33 28.5,30 C29,26 29,22 28.5,17" +
      " C28,12 26.5,8 25,8 C23.5,8 22,11 20,15" +
      " C18,11 16.5,8 15,8Z" +
      // Crown
      " M14,37 C13.5,40 13,43 12.5,47 C12,51 12,55 12.5,59" +
      " C13,62 14.5,65 16.5,68 C18,70 19.5,71 20,71.5" +
      " C20.5,71 22,70 23.5,68 C25.5,65 27,62 27.5,59" +
      " C28,55 28,51 27.5,47 C27,43 26.5,40 26,37" +
      " Q23,35 20,34 Q17,35 14,37Z",
    crownArea:
      "M14,37 C13.5,40 13,43 12.5,47 C12,51 12,55 12.5,59" +
      " C13,62 14.5,65 16.5,68 C18,70 19.5,71 20,71.5" +
      " C20.5,71 22,70 23.5,68 C25.5,65 27,62 27.5,59" +
      " C28,55 28,51 27.5,47 C27,43 26.5,40 26,37" +
      " Q23,35 20,34 Q17,35 14,37Z",
    furcationArea:
      "M11.5,30 C13,27 16,22 20,15 C24,22 27,27 28.5,30" +
      " C28,33 27.5,35 26,37 Q23,35 20,34 Q17,35 14,37" +
      " C12.5,35 12,33 11.5,30Z",
    innerHighlight:
      "M16,12 C15,14 14,18 13.5,23 C13,26 13,29 13.5,32" +
      " C14,34 14.5,36 15.5,37 Q17.5,35.5 20,35 Q22.5,35.5 24.5,37" +
      " C25.5,36 26,34 26.5,32 C27,29 27,26 26.5,23" +
      " C26,18 25,14 24,12 C23,12 22,13 20,16" +
      " C18,13 17,12 16,12Z",
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

// ─── Tooth shape selection with upper/lower differentiation ────────────────

function getToothShape(toothNumber: number) {
  const pos = toothNumber % 10;
  const quadrant = Math.floor(toothNumber / 10);
  const isDeciduous = quadrant >= 5;
  const isUpper = quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6;

  if (isDeciduous) {
    switch (pos) {
      case 1:
        return isUpper ? TOOTH_SHAPES.upperCentralIncisor : TOOTH_SHAPES.lowerCentralIncisor;
      case 2:
        return isUpper ? TOOTH_SHAPES.upperLateralIncisor : TOOTH_SHAPES.lowerLateralIncisor;
      case 3:
        return isUpper ? TOOTH_SHAPES.upperCanine : TOOTH_SHAPES.lowerCanine;
      case 4: case 5:
        return isUpper ? TOOTH_SHAPES.upperFirstMolar : TOOTH_SHAPES.lowerFirstMolar;
      default:
        return isUpper ? TOOTH_SHAPES.upperCentralIncisor : TOOTH_SHAPES.lowerCentralIncisor;
    }
  }

  switch (pos) {
    case 1:
      return isUpper ? TOOTH_SHAPES.upperCentralIncisor : TOOTH_SHAPES.lowerCentralIncisor;
    case 2:
      return isUpper ? TOOTH_SHAPES.upperLateralIncisor : TOOTH_SHAPES.lowerLateralIncisor;
    case 3:
      return isUpper ? TOOTH_SHAPES.upperCanine : TOOTH_SHAPES.lowerCanine;
    case 4:
      return isUpper ? TOOTH_SHAPES.upperFirstPremolar : TOOTH_SHAPES.lowerFirstPremolar;
    case 5:
      return isUpper ? TOOTH_SHAPES.upperSecondPremolar : TOOTH_SHAPES.lowerSecondPremolar;
    case 6:
      return isUpper ? TOOTH_SHAPES.upperFirstMolar : TOOTH_SHAPES.lowerFirstMolar;
    case 7:
      return isUpper ? TOOTH_SHAPES.upperSecondMolar : TOOTH_SHAPES.lowerSecondMolar;
    case 8:
      return isUpper ? TOOTH_SHAPES.upperWisdom : TOOTH_SHAPES.lowerWisdom;
    default:
      return isUpper ? TOOTH_SHAPES.upperCentralIncisor : TOOTH_SHAPES.lowerCentralIncisor;
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
            {/* ─── Main body gradient – root is darker/more yellow (cementum), crown lighter ─── */}
            <linearGradient id={`g-${id}`} x1="0.1" y1="0" x2="0.9" y2="1">
              <stop offset="0%" stopColor="#d8ce9e" />
              <stop offset="20%" stopColor="#ddd5b0" />
              <stop offset="40%" stopColor="#e2dbc0" />
              <stop offset="55%" stopColor="#e6e0c8" />
              <stop offset="70%" stopColor="#eae4d0" />
              <stop offset="85%" stopColor="#ede8d8" />
              <stop offset="100%" stopColor="#f0ebde" />
            </linearGradient>

            {/* ─── Enamel cap – translucent white sheen on CROWN only ─── */}
            {shape.crownArea && (
              <linearGradient id={`ce-${id}`} x1="0.5" y1="0.35" x2="0.5" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.02" />
                <stop offset="10%" stopColor="white" stopOpacity="0.12" />
                <stop offset="25%" stopColor="white" stopOpacity="0.22" />
                <stop offset="40%" stopColor="white" stopOpacity="0.28" />
                <stop offset="55%" stopColor="white" stopOpacity="0.24" />
                <stop offset="70%" stopColor="white" stopOpacity="0.18" />
                <stop offset="85%" stopColor="white" stopOpacity="0.1" />
                <stop offset="100%" stopColor="white" stopOpacity="0.06" />
              </linearGradient>
            )}

            {/* ─── Left specular highlight ─── */}
            <linearGradient id={`h-${id}`} x1="0" y1="0.2" x2="0.65" y2="0.8">
              <stop offset="0%" stopColor="white" stopOpacity="0.42" />
              <stop offset="18%" stopColor="white" stopOpacity="0.16" />
              <stop offset="45%" stopColor="white" stopOpacity="0.04" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            {/* ─── Right edge shadow ─── */}
            <linearGradient id={`rs2-${id}`} x1="1" y1="0.3" x2="0.3" y2="0.7">
              <stop offset="0%" stopColor="#8a7c5e" stopOpacity="0.2" />
              <stop offset="35%" stopColor="#8a7c5e" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#8a7c5e" stopOpacity="0" />
            </linearGradient>

            {/* ─── Cementum darkening on root apex ─── */}
            <linearGradient id={`rs-${id}`} x1="0.5" y1="0" x2="0.5" y2="0.5">
              <stop offset="0%" stopColor="#a09060" stopOpacity="0.32" />
              <stop offset="25%" stopColor="#a89870" stopOpacity="0.18" />
              <stop offset="50%" stopColor="#b0a080" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#b0a080" stopOpacity="0" />
            </linearGradient>

            {/* ─── Furcation depth shadow – gum-coloured radial gradient ─── */}
            {shape.furcationArea && (
              <radialGradient id={`fur-${id}`} cx="0.5" cy="0.6" r="0.5">
                <stop offset="0%" stopColor="#c08878" stopOpacity="0.6" />
                <stop offset="25%" stopColor="#c89888" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#d4a898" stopOpacity="0.2" />
                <stop offset="80%" stopColor="#e0bab0" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#e0bab0" stopOpacity="0" />
              </radialGradient>
            )}

            {/* ─── Ambient occlusion ─── */}
            <radialGradient id={`ao-${id}`} cx="0.5" cy="0.52" r="0.48">
              <stop offset="55%" stopColor="transparent" />
              <stop offset="82%" stopColor="#7a6c50" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#7a6c50" stopOpacity="0.18" />
            </radialGradient>

            {/* ─── Inner body highlight ─── */}
            <radialGradient id={`ih-${id}`} cx="0.42" cy="0.55" r="0.35" fx="0.38" fy="0.5">
              <stop offset="0%" stopColor="white" stopOpacity="0.18" />
              <stop offset="50%" stopColor="white" stopOpacity="0.05" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>

            {/* ─── Dentin warmth (subtle warm layer beneath enamel) ─── */}
            {shape.crownArea && (
              <radialGradient id={`dt-${id}`} cx="0.5" cy="0.6" r="0.4">
                <stop offset="0%" stopColor="#f5e8c8" stopOpacity="0.12" />
                <stop offset="60%" stopColor="#ede0c0" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#ede0c0" stopOpacity="0" />
              </radialGradient>
            )}

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

            {/* Cementum darkening on roots */}
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

            {/* Dentin warmth layer (beneath enamel on crown) */}
            {shape.crownArea && (
              <path d={shape.crownArea} fill={`url(#dt-${id})`} />
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

            {/* Cervical line (CEJ) */}
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

            {/* Marginal ridges */}
            {shape.marginalRidges?.map((ridge, i) => (
              <path
                key={`mr-${i}`}
                d={ridge}
                fill="none"
                stroke="#bfb490"
                strokeWidth="0.4"
                strokeLinecap="round"
                opacity={0.28}
              />
            ))}

            {/* Fissures/grooves/developmental details */}
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
