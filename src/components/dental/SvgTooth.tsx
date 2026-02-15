import React from 'react';

// ─── Realistic anatomical tooth shapes (from-scratch redesign) ───────────────
// viewBox: 0 0 40 80
// Upper teeth: root at top (y≈3-38), cervical line (~y38-42), crown at bottom (y≈42-78)
// Key design: wide bulbous crowns, clear cervical constriction, proportional roots.
// Multi-rooted teeth have visible furcation between separated roots.

const TOOTH_SHAPES: Record<string, {
  outline: string;
  cervical?: string;
  rootLines?: string[];
  details?: string[];
  cusps?: string[];
  marginalRidges?: string[];
  innerHighlight?: string;
  crownArea?: string;
  furcationArea?: string;
}> = {

  // ════════════════════════════════════════════════════════════════════════════
  //  INCISORS
  // ════════════════════════════════════════════════════════════════════════════

  // ── Upper Central Incisor: wide spatulate crown, single conical root ──
  upperCentralIncisor: {
    outline:
      "M20,3 C18,3 16.5,7 16,14 C15.5,20 15,26 14.5,32" +
      " C14.2,35 14,37 13.8,39" +
      " C13,42 11.5,46 10.5,51 C9.5,56 9.2,61 9.8,65" +
      " C10.5,69 12.5,72 15.5,74.5 C17.5,76 19,77 20,77.5" +
      " C21,77 22.5,76 24.5,74.5 C27.5,72 29.5,69 30.2,65" +
      " C30.8,61 30.5,56 29.5,51 C28.5,46 27,42 26.2,39" +
      " C26,37 25.8,35 25.5,32" +
      " C25,26 24.5,20 24,14 C23.5,7 22,3 20,3Z",
    crownArea:
      "M13.8,39 C13,42 11.5,46 10.5,51 C9.5,56 9.2,61 9.8,65" +
      " C10.5,69 12.5,72 15.5,74.5 C17.5,76 19,77 20,77.5" +
      " C21,77 22.5,76 24.5,74.5 C27.5,72 29.5,69 30.2,65" +
      " C30.8,61 30.5,56 29.5,51 C28.5,46 27,42 26.2,39" +
      " Q20,36.5 13.8,39Z",
    innerHighlight:
      "M20,7 C18.5,7 17.5,11 17,17 C16.5,23 16,28 15.8,33" +
      " C15.5,36 15.5,38 15.5,41 C15,44 14,48 13,52" +
      " C12,57 12,62 12.5,66 C13.5,70 15.5,73 18,75" +
      " C19,75.5 20,76 20,76 C20,76 21,75.5 22,75" +
      " C24.5,73 26.5,70 27.5,66 C28,62 28,57 27,52" +
      " C26,48 25,44 24.5,41 C24.5,38 24.5,36 24.2,33" +
      " C24,28 23.5,23 23,17 C22.5,11 21.5,7 20,7Z",
    cervical: "M13.8,39 Q17,37 20,36.5 Q23,37 26.2,39",
    rootLines: [
      "M18.5,6 Q19,16 18.8,34",
      "M21.5,6 Q21,16 21.2,34",
    ],
    cusps: [
      "M12,64 Q16,58 20,56 Q24,58 28,64",
    ],
    details: [
      "M15,73 Q17,71 18.5,73",
      "M19,72 Q20,70 21,72",
      "M21.5,73 Q23,71 25,73",
    ],
  },

  // ── Lower Central Incisor: narrow, delicate crown, thin root ──
  lowerCentralIncisor: {
    outline:
      "M20,3 C18.8,3 17.5,7 17,14 C16.5,20 16.2,26 16,32" +
      " C15.8,35 15.8,37 15.5,39" +
      " C15,42 14.2,46 13.5,51 C13,56 12.8,60 13.2,64" +
      " C13.8,68 15,71 17,73 C18.5,74.5 19.5,75 20,75.5" +
      " C20.5,75 21.5,74.5 23,73 C25,71 26.2,68 26.8,64" +
      " C27.2,60 27,56 26.5,51 C25.8,46 25,42 24.5,39" +
      " C24.2,37 24.2,35 24,32" +
      " C23.8,26 23.5,20 23,14 C22.5,7 21.2,3 20,3Z",
    crownArea:
      "M15.5,39 C15,42 14.2,46 13.5,51 C13,56 12.8,60 13.2,64" +
      " C13.8,68 15,71 17,73 C18.5,74.5 19.5,75 20,75.5" +
      " C20.5,75 21.5,74.5 23,73 C25,71 26.2,68 26.8,64" +
      " C27.2,60 27,56 26.5,51 C25.8,46 25,42 24.5,39" +
      " Q20,37 15.5,39Z",
    innerHighlight:
      "M20,7 C19.2,7 18.2,11 17.8,17 C17.5,23 17.2,28 17,33" +
      " C17,36 17,38 16.8,41 C16.5,44 16,48 15.5,52" +
      " C15,56 15,60 15.5,64 C16,67 17,70 18.5,72" +
      " C19.5,73 20,73.5 20,73.5 C20,73.5 20.5,73 21.5,72" +
      " C23,70 24,67 24.5,64 C25,60 25,56 24.5,52" +
      " C24,48 23.5,44 23.2,41 C23,38 23,36 23,33" +
      " C22.8,28 22.5,23 22.2,17 C21.8,11 20.8,7 20,7Z",
    cervical: "M15.5,39 Q17.5,37 20,36.5 Q22.5,37 24.5,39",
    rootLines: [
      "M19,6 Q19.2,16 19,34",
      "M21,6 Q20.8,16 21,34",
    ],
    cusps: [
      "M14.5,63 Q17,58 20,56 Q23,58 25.5,63",
    ],
  },

  // ── Upper Lateral Incisor: narrower than central, rounded crown ──
  upperLateralIncisor: {
    outline:
      "M20,3 C18.5,3 17,7 16.5,14 C16,20 15.5,26 15,32" +
      " C14.8,35 14.5,37 14.2,39" +
      " C13.5,42 12.2,46 11.2,51 C10.5,56 10.2,61 10.8,65" +
      " C11.5,69 13,72 15.5,74 C17.5,75.5 19,76.5 20,76.5" +
      " C21,76.5 22.5,75.5 24.5,74 C27,72 28.5,69 29.2,65" +
      " C29.8,61 29.5,56 28.8,51 C27.8,46 26.5,42 25.8,39" +
      " C25.5,37 25.2,35 25,32" +
      " C24.5,26 24,20 23.5,14 C23,7 21.5,3 20,3Z",
    crownArea:
      "M14.2,39 C13.5,42 12.2,46 11.2,51 C10.5,56 10.2,61 10.8,65" +
      " C11.5,69 13,72 15.5,74 C17.5,75.5 19,76.5 20,76.5" +
      " C21,76.5 22.5,75.5 24.5,74 C27,72 28.5,69 29.2,65" +
      " C29.8,61 29.5,56 28.8,51 C27.8,46 26.5,42 25.8,39" +
      " Q20,36.5 14.2,39Z",
    innerHighlight:
      "M20,7 C18.8,7 17.8,11 17.5,17 C17,23 16.5,28 16.2,33" +
      " C16,36 16,38 15.8,41 C15.2,44 14,48 13.2,52" +
      " C12.5,57 12.5,62 13,65 C13.8,69 15.5,72 17.5,73.5" +
      " C19,74.5 20,75 20,75 C20,75 21,74.5 22.5,73.5" +
      " C24.5,72 26.2,69 27,65 C27.5,62 27.5,57 26.8,52" +
      " C26,48 24.8,44 24.2,41 C24,38 24,36 23.8,33" +
      " C23.5,28 23,23 22.5,17 C22.2,11 21.2,7 20,7Z",
    cervical: "M14.2,39 Q17,37 20,36.5 Q23,37 25.8,39",
    rootLines: [
      "M18.5,6 Q19,16 18.5,34",
      "M21.5,6 Q21,16 21.5,34",
    ],
    cusps: [
      "M13,63 Q16.5,58 20,56 Q23.5,58 27,63",
    ],
    details: [
      "M16,73 Q18,71 19.5,73",
      "M20.5,73 Q22,71 24,73",
    ],
  },

  // ── Lower Lateral Incisor: slightly wider than lower central ──
  lowerLateralIncisor: {
    outline:
      "M20,3 C18.5,3 17,7 16.5,14 C16,20 15.5,26 15.2,32" +
      " C15,35 15,37 14.8,39" +
      " C14.2,42 13.2,46 12.5,51 C12,56 11.8,60 12.2,64" +
      " C12.8,68 14.2,71 16.5,73 C18,74.5 19.2,75 20,75.5" +
      " C20.8,75 22,74.5 23.5,73 C25.8,71 27.2,68 27.8,64" +
      " C28.2,60 28,56 27.5,51 C26.8,46 25.8,42 25.2,39" +
      " C25,37 25,35 24.8,32" +
      " C24.5,26 24,20 23.5,14 C23,7 21.5,3 20,3Z",
    crownArea:
      "M14.8,39 C14.2,42 13.2,46 12.5,51 C12,56 11.8,60 12.2,64" +
      " C12.8,68 14.2,71 16.5,73 C18,74.5 19.2,75 20,75.5" +
      " C20.8,75 22,74.5 23.5,73 C25.8,71 27.2,68 27.8,64" +
      " C28.2,60 28,56 27.5,51 C26.8,46 25.8,42 25.2,39" +
      " Q20,37 14.8,39Z",
    innerHighlight:
      "M20,7 C19,7 17.8,11 17.5,17 C17,23 16.5,28 16.2,33" +
      " C16,36 16,38 15.8,41 C15.2,44 14.5,48 14,52" +
      " C13.5,56 13.5,60 14,64 C14.5,67 15.8,70 17.5,72" +
      " C19,73 20,73.5 20,73.5 C20,73.5 21,73 22.5,72" +
      " C24.2,70 25.5,67 26,64 C26.5,60 26.5,56 26,52" +
      " C25.5,48 24.8,44 24.2,41 C24,38 24,36 23.8,33" +
      " C23.5,28 23,23 22.5,17 C22.2,11 21,7 20,7Z",
    cervical: "M14.8,39 Q17.5,37 20,36.5 Q22.5,37 25.2,39",
    rootLines: [
      "M18.5,6 Q19,16 18.5,34",
      "M21.5,6 Q21,16 21.5,34",
    ],
    cusps: [
      "M14,63 Q17,58 20,56 Q23,58 26,63",
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  CANINES
  // ════════════════════════════════════════════════════════════════════════════

  // ── Upper Canine: prominent pointed cusp, long thick root ──
  upperCanine: {
    outline:
      "M20,2 C18,2 16,6 15,13 C14,20 13.2,27 12.8,32" +
      " C12.5,35 12.2,37 12,39" +
      " C11.2,42 10,46 9.2,51 C8.5,56 8.2,61 8.8,65" +
      " C9.5,69 11.5,72 14.5,74.5 C17,76.5 19,78 20,78.5" +
      " C21,78 23,76.5 25.5,74.5 C28.5,72 30.5,69 31.2,65" +
      " C31.8,61 31.5,56 30.8,51 C30,46 28.8,42 28,39" +
      " C27.8,37 27.5,35 27.2,32" +
      " C26.8,27 26,20 25,13 C24,6 22,2 20,2Z",
    crownArea:
      "M12,39 C11.2,42 10,46 9.2,51 C8.5,56 8.2,61 8.8,65" +
      " C9.5,69 11.5,72 14.5,74.5 C17,76.5 19,78 20,78.5" +
      " C21,78 23,76.5 25.5,74.5 C28.5,72 30.5,69 31.2,65" +
      " C31.8,61 31.5,56 30.8,51 C30,46 28.8,42 28,39" +
      " Q20,36 12,39Z",
    innerHighlight:
      "M20,6 C18.5,6 17,10 16,16 C15,23 14.2,29 13.8,34" +
      " C13.5,37 13.5,39 13.5,42 C13,45 12,49 11.2,53" +
      " C10.5,58 10.5,63 11,66 C12,70 14,73 17,75.5" +
      " C19,77 20,77.5 20,77.5 C20,77.5 21,77 23,75.5" +
      " C26,73 28,70 29,66 C29.5,63 29.5,58 28.8,53" +
      " C28,49 27,45 26.5,42 C26.5,39 26.5,37 26.2,34" +
      " C25.8,29 25,23 24,16 C23,10 21.5,6 20,6Z",
    cervical: "M12,39 Q16,36.5 20,36 Q24,36.5 28,39",
    rootLines: [
      "M17.5,5 Q18,18 17.5,34",
      "M22.5,5 Q22,18 22.5,34",
    ],
    cusps: [
      "M12,64 Q16,57 20,53 Q24,57 28,64",
    ],
    details: [
      "M15,72 Q18,70 20,69 Q22,70 25,72",
    ],
  },

  // ── Lower Canine: slightly shorter root, less prominent cusp ──
  lowerCanine: {
    outline:
      "M20,3 C18.2,3 16.5,7 15.5,14 C14.5,21 13.8,27 13.2,32" +
      " C13,35 12.8,37 12.5,39" +
      " C12,42 10.8,46 10,51 C9.2,56 9,61 9.5,65" +
      " C10,69 12,72 14.5,74 C16.5,75.5 18.5,77 20,77.5" +
      " C21.5,77 23.5,75.5 25.5,74 C28,72 30,69 30.5,65" +
      " C31,61 30.8,56 30,51 C29.2,46 28,42 27.5,39" +
      " C27.2,37 27,35 26.8,32" +
      " C26.2,27 25.5,21 24.5,14 C23.5,7 21.8,3 20,3Z",
    crownArea:
      "M12.5,39 C12,42 10.8,46 10,51 C9.2,56 9,61 9.5,65" +
      " C10,69 12,72 14.5,74 C16.5,75.5 18.5,77 20,77.5" +
      " C21.5,77 23.5,75.5 25.5,74 C28,72 30,69 30.5,65" +
      " C31,61 30.8,56 30,51 C29.2,46 28,42 27.5,39" +
      " Q20,36.5 12.5,39Z",
    innerHighlight:
      "M20,7 C18.8,7 17.2,11 16.5,17 C15.5,23 14.8,29 14.5,33" +
      " C14.2,36 14.2,38 14,41 C13.5,44 12.8,48 12,52" +
      " C11.2,57 11.2,62 11.8,65 C12.5,69 14.5,72 17,74" +
      " C19,75.5 20,76 20,76 C20,76 21,75.5 23,74" +
      " C25.5,72 27.5,69 28.2,65 C28.8,62 28.8,57 28,52" +
      " C27.2,48 26.5,44 26,41 C25.8,38 25.8,36 25.5,33" +
      " C25.2,29 24.5,23 23.5,17 C22.8,11 21.2,7 20,7Z",
    cervical: "M12.5,39 Q16.5,37 20,36.5 Q23.5,37 27.5,39",
    rootLines: [
      "M18,6 Q18.5,18 18,34",
      "M22,6 Q21.5,18 22,34",
    ],
    cusps: [
      "M12.5,64 Q16,57 20,54 Q24,57 27.5,64",
    ],
    details: [
      "M16,72 Q18.5,70 20,69 Q21.5,70 24,72",
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  PREMOLARS
  // ════════════════════════════════════════════════════════════════════════════

  // ── Upper First Premolar: bicuspid crown, bifurcated root ──
  upperFirstPremolar: {
    outline:
      // Left root (buccal)
      "M14,4 C12.5,4 11,8 10.5,14 C10,20 10,25 11,29" +
      " C11.5,32 12,35 13,38" +
      // Connect to cervical
      " Q17,36 20,35.5 Q23,36 27,38" +
      // Right root (palatal)
      " C28,35 28.5,32 29,29 C30,25 30,20 29.5,14" +
      " C29,8 27.5,4 26,4" +
      // V-notch between roots
      " C24.5,4 22.5,8 20,16 C17.5,8 15.5,4 14,4Z" +
      // Crown
      " M13,38 C12.2,41 11,45 10.2,50 C9.5,55 9.2,59 9.8,63" +
      " C10.5,67 12,70 14.5,72.5 C16.5,74 18.5,75 20,75.5" +
      " C21.5,75 23.5,74 25.5,72.5 C28,70 29.5,67 30.2,63" +
      " C30.8,59 30.5,55 29.8,50 C29,45 27.8,41 27,38" +
      " Q23,36 20,35.5 Q17,36 13,38Z",
    crownArea:
      "M13,38 C12.2,41 11,45 10.2,50 C9.5,55 9.2,59 9.8,63" +
      " C10.5,67 12,70 14.5,72.5 C16.5,74 18.5,75 20,75.5" +
      " C21.5,75 23.5,74 25.5,72.5 C28,70 29.5,67 30.2,63" +
      " C30.8,59 30.5,55 29.8,50 C29,45 27.8,41 27,38" +
      " Q23,36 20,35.5 Q17,36 13,38Z",
    furcationArea:
      "M11,29 C13,25 16,19 20,16 C24,19 27,25 29,29" +
      " C28.5,32 28,35 27,38 Q23,36 20,35.5 Q17,36 13,38" +
      " C12,35 11.5,32 11,29Z",
    innerHighlight:
      "M15,8 C14,12 13,17 12,22 C11.5,26 11.5,29 12,32" +
      " C12.5,35 13,37 14.5,38 Q17.5,36.5 20,36 Q22.5,36.5 25.5,38" +
      " C27,37 27.5,35 28,32 C28.5,29 28.5,26 28,22" +
      " C27,17 26,12 25,8 C24,8 22.5,11 20,17" +
      " C17.5,11 16,8 15,8Z",
    cervical: "M13,38 Q17,36 20,35.5 Q23,36 27,38",
    rootLines: [
      "M13,8 Q13.5,16 13,28",
      "M27,8 Q26.5,16 27,28",
    ],
    cusps: [
      "M13,60 L16,55 L20,57 L24,55 L27,60",
    ],
    details: [
      "M15,58 Q17.5,54 20,53 Q22.5,54 25,58",
    ],
    marginalRidges: [
      "M12,50 Q13,47 14,45",
      "M28,50 Q27,47 26,45",
    ],
  },

  // ── Lower First Premolar: single root, bicuspid crown ──
  lowerFirstPremolar: {
    outline:
      "M20,4 C18,4 16.2,8 15.2,15 C14.2,22 13.5,28 13.2,33" +
      " C13,36 12.8,38 12.5,40" +
      " C12,43 11,47 10.2,52 C9.5,56 9.5,61 10,64" +
      " C10.5,68 12,71 14.5,73 C16.5,74.5 18.5,75.5 20,76" +
      " C21.5,75.5 23.5,74.5 25.5,73 C28,71 29.5,68 30,64" +
      " C30.5,61 30.5,56 29.8,52 C29,47 28,43 27.5,40" +
      " C27.2,38 27,36 26.8,33" +
      " C26.5,28 25.8,22 24.8,15 C23.8,8 22,4 20,4Z",
    crownArea:
      "M12.5,40 C12,43 11,47 10.2,52 C9.5,56 9.5,61 10,64" +
      " C10.5,68 12,71 14.5,73 C16.5,74.5 18.5,75.5 20,76" +
      " C21.5,75.5 23.5,74.5 25.5,73 C28,71 29.5,68 30,64" +
      " C30.5,61 30.5,56 29.8,52 C29,47 28,43 27.5,40" +
      " Q20,37.5 12.5,40Z",
    innerHighlight:
      "M20,8 C18.5,8 17,12 16.2,18 C15.2,24 14.5,30 14.2,35" +
      " C14,38 14,40 14,42 C13.5,45 12.8,49 12.2,53" +
      " C11.5,57 11.5,61 12,64 C12.8,68 14.5,71 17,73" +
      " C19,74 20,74.5 20,74.5 C20,74.5 21,74 23,73" +
      " C25.5,71 27.2,68 28,64 C28.5,61 28.5,57 27.8,53" +
      " C27.2,49 26.5,45 26,42 C26,40 26,38 25.8,35" +
      " C25.5,30 24.8,24 23.8,18 C23,12 21.5,8 20,8Z",
    cervical: "M12.5,40 Q16.5,38 20,37.5 Q23.5,38 27.5,40",
    rootLines: [
      "M17.5,8 Q18,20 17.5,35",
      "M22.5,8 Q22,20 22.5,35",
    ],
    cusps: [
      "M13.5,61 L17,56 L20,58 L23,56 L26.5,61",
    ],
    details: [
      "M15,59 Q17.5,55 20,54 Q22.5,55 25,59",
    ],
  },

  // ── Upper Second Premolar: bicuspid crown, single root ──
  upperSecondPremolar: {
    outline:
      "M20,4 C18,4 16.2,8 15.2,15 C14.2,22 13.5,28 13.2,33" +
      " C13,36 12.8,38 12.5,40" +
      " C12,43 11,47 10.2,52 C9.5,56 9.5,61 10,64" +
      " C10.5,68 12,71 14.5,73 C16.5,74.5 18.5,75.5 20,76" +
      " C21.5,75.5 23.5,74.5 25.5,73 C28,71 29.5,68 30,64" +
      " C30.5,61 30.5,56 29.8,52 C29,47 28,43 27.5,40" +
      " C27.2,38 27,36 26.8,33" +
      " C26.5,28 25.8,22 24.8,15 C23.8,8 22,4 20,4Z",
    crownArea:
      "M12.5,40 C12,43 11,47 10.2,52 C9.5,56 9.5,61 10,64" +
      " C10.5,68 12,71 14.5,73 C16.5,74.5 18.5,75.5 20,76" +
      " C21.5,75.5 23.5,74.5 25.5,73 C28,71 29.5,68 30,64" +
      " C30.5,61 30.5,56 29.8,52 C29,47 28,43 27.5,40" +
      " Q20,37.5 12.5,40Z",
    innerHighlight:
      "M20,8 C18.5,8 17,12 16.2,18 C15.2,24 14.5,30 14.2,35" +
      " C14,38 14,40 14,42 C13.5,45 12.8,49 12.2,53" +
      " C11.5,57 11.5,61 12,64 C12.8,68 14.5,71 17,73" +
      " C19,74 20,74.5 20,74.5 C20,74.5 21,74 23,73" +
      " C25.5,71 27.2,68 28,64 C28.5,61 28.5,57 27.8,53" +
      " C27.2,49 26.5,45 26,42 C26,40 26,38 25.8,35" +
      " C25.5,30 24.8,24 23.8,18 C23,12 21.5,8 20,8Z",
    cervical: "M12.5,40 Q16.5,38 20,37.5 Q23.5,38 27.5,40",
    rootLines: [
      "M17.5,8 Q18,20 17.5,35",
      "M22.5,8 Q22,20 22.5,35",
    ],
    cusps: [
      "M13.5,61 L16.5,56 L20,58 L23.5,56 L26.5,61",
    ],
    details: [
      "M15,59 Q17.5,55 20,54 Q22.5,55 25,59",
    ],
    marginalRidges: [
      "M12,50 Q13,47 14,45",
      "M28,50 Q27,47 26,45",
    ],
  },

  // ── Lower Second Premolar: single root, tricuspid pattern ──
  lowerSecondPremolar: {
    outline:
      "M20,4 C18,4 16.2,8 15.2,15 C14.2,22 13.5,28 13.2,33" +
      " C13,36 12.8,38 12.5,40" +
      " C12,43 11,47 10.2,52 C9.5,56 9.5,61 10,64" +
      " C10.5,68 12,71 14.5,73 C16.5,74.5 18.5,75.5 20,76" +
      " C21.5,75.5 23.5,74.5 25.5,73 C28,71 29.5,68 30,64" +
      " C30.5,61 30.5,56 29.8,52 C29,47 28,43 27.5,40" +
      " C27.2,38 27,36 26.8,33" +
      " C26.5,28 25.8,22 24.8,15 C23.8,8 22,4 20,4Z",
    crownArea:
      "M12.5,40 C12,43 11,47 10.2,52 C9.5,56 9.5,61 10,64" +
      " C10.5,68 12,71 14.5,73 C16.5,74.5 18.5,75.5 20,76" +
      " C21.5,75.5 23.5,74.5 25.5,73 C28,71 29.5,68 30,64" +
      " C30.5,61 30.5,56 29.8,52 C29,47 28,43 27.5,40" +
      " Q20,37.5 12.5,40Z",
    innerHighlight:
      "M20,8 C18.5,8 17,12 16.2,18 C15.2,24 14.5,30 14.2,35" +
      " C14,38 14,40 14,42 C13.5,45 12.8,49 12.2,53" +
      " C11.5,57 11.5,61 12,64 C12.8,68 14.5,71 17,73" +
      " C19,74 20,74.5 20,74.5 C20,74.5 21,74 23,73" +
      " C25.5,71 27.2,68 28,64 C28.5,61 28.5,57 27.8,53" +
      " C27.2,49 26.5,45 26,42 C26,40 26,38 25.8,35" +
      " C25.5,30 24.8,24 23.8,18 C23,12 21.5,8 20,8Z",
    cervical: "M12.5,40 Q16.5,38 20,37.5 Q23.5,38 27.5,40",
    rootLines: [
      "M17.5,8 Q18,20 17.5,35",
      "M22.5,8 Q22,20 22.5,35",
    ],
    cusps: [
      "M14,61 L17,55 L19,57 L20,55 L21,57 L23,55 L26,61",
    ],
    details: [
      "M15.5,59 Q17.5,55 20,54 Q22.5,55 24.5,59",
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  UPPER MOLARS — 3 roots with TRIFURCATION
  // ════════════════════════════════════════════════════════════════════════════

  // ── Upper First Molar: wide crown, THREE roots ──
  upperFirstMolar: {
    outline:
      // Palatal root (left, larger, divergent)
      "M10,4 C8,4 6.5,9 6,16 C5.5,22 6,27 7.5,31" +
      " C8.5,34 9.5,36 11,38" +
      // Mesiobuccal root
      " L14,33 C14.5,27 15.5,21 16.5,15 C17,11 18,7 19.5,5" +
      // V-notch
      " C20,9 20,14 20,20" +
      // Distobuccal root
      " C20,14 20.5,9 21,5 C22.5,7 23.5,11 24,15 C25,21 25.5,27 26,33" +
      // Back to trifurcation junction (right side)
      " L29,38 C30.5,36 31.5,34 32.5,31 C34,27 34.5,22 34,16" +
      " C33.5,9 32,4 30,4" +
      // Roots join back
      " C28.5,4 26.5,8 25,14 C24,8 22.5,5 21,5 C20,5 19,7 17.5,12" +
      " C16,7 14,5 12.5,4 C11.5,4 10.5,4 10,4Z" +
      // Crown (separate subpath)
      " M11,38 C10,41 8.5,45 7.5,50 C6.5,55 6.2,60 7,64" +
      " C7.8,68 9.5,71 12.5,73.5 C15,75.5 17.5,77 20,77.5" +
      " C22.5,77 25,75.5 27.5,73.5 C30.5,71 32.2,68 33,64" +
      " C33.8,60 33.5,55 32.5,50 C31.5,45 30,41 29,38" +
      " Q20,35.5 11,38Z",
    crownArea:
      "M11,38 C10,41 8.5,45 7.5,50 C6.5,55 6.2,60 7,64" +
      " C7.8,68 9.5,71 12.5,73.5 C15,75.5 17.5,77 20,77.5" +
      " C22.5,77 25,75.5 27.5,73.5 C30.5,71 32.2,68 33,64" +
      " C33.8,60 33.5,55 32.5,50 C31.5,45 30,41 29,38" +
      " Q20,35.5 11,38Z",
    furcationArea:
      "M7.5,31 C9.5,27 13,21 16.5,15 C17.5,10 19,6 20,5" +
      " C21,6 22.5,10 24,15 C27,21 30.5,27 32.5,31" +
      " C31.5,34 30.5,36 29,38 Q20,35.5 11,38" +
      " C9.5,36 8.5,34 7.5,31Z",
    innerHighlight:
      "M11,8 C10,12 9,17 8.5,22 C8,26 8.5,29 9.5,33" +
      " C10,35 11,37 12,38 Q16.5,36 20,36 Q23.5,36 28,38" +
      " C29,37 30,35 30.5,33 C31.5,29 32,26 31.5,22" +
      " C31,17 30,12 29,8 C27.5,8 26,11 25,15" +
      " C24,10 22.5,6 20.5,6 C19,6 17.5,9 16.5,13" +
      " C15,9 13.5,7 12,7 C11,7.5 11,8 11,8Z",
    cervical: "M11,38 Q15.5,36 20,35.5 Q24.5,36 29,38",
    rootLines: [
      "M9,8 Q9.5,16 9,28",
      "M17,10 Q17.5,18 17,30",
      "M25,10 Q24.5,18 25,30",
    ],
    cusps: [
      "M12,62 L15,56 L18,58 L20,55 L22,58 L25,56 L28,62",
    ],
    details: [
      "M14,58 Q17,54 20,55 Q23,54 26,58",
      "M17,60 Q20,57 23,60",
    ],
    marginalRidges: [
      "M10,50 Q11,47 12,45",
      "M30,50 Q29,47 28,45",
    ],
  },

  // ── Upper Second Molar: 3 roots, slightly smaller ──
  upperSecondMolar: {
    outline:
      // Palatal root (left)
      "M11,5 C9.5,5 8,10 7.5,16 C7,22 7.5,27 9,30" +
      " C10,33 11,35 12,37" +
      // Mesiobuccal root
      " L15,32 C15.5,26 16.5,20 17.5,15 C18,11 19,7 20,5.5" +
      // V-notch
      " C20.5,8 20.5,13 20.5,19" +
      // Distobuccal root
      " C20.5,13 21,8 21.5,5.5 C22.5,7 23.5,11 24,15 C25,20 25.5,26 26,32" +
      // Right junction
      " L28.5,37 C29.5,35 30.5,33 31.5,30 C33,27 33.5,22 33,16" +
      " C32.5,10 31,5 29.5,5" +
      " C28,5 26.5,8 25,14 C24,9 22.5,6 21.5,5.5" +
      " C20.5,6 19.5,8 18,13 C16.5,8 15,6 13.5,5 C12,5 11,5 11,5Z" +
      // Crown
      " M12,37 C11,40 9.5,44 8.5,49 C7.5,54 7.2,59 7.8,63" +
      " C8.5,67 10,70 13,72.5 C15.5,74.5 18,76 20,76.5" +
      " C22,76 24.5,74.5 27,72.5 C30,70 31.5,67 32.2,63" +
      " C32.8,59 32.5,54 31.5,49 C30.5,44 29,40 28,37" +
      " Q20,34.5 12,37Z",
    crownArea:
      "M12,37 C11,40 9.5,44 8.5,49 C7.5,54 7.2,59 7.8,63" +
      " C8.5,67 10,70 13,72.5 C15.5,74.5 18,76 20,76.5" +
      " C22,76 24.5,74.5 27,72.5 C30,70 31.5,67 32.2,63" +
      " C32.8,59 32.5,54 31.5,49 C30.5,44 29,40 28,37" +
      " Q20,34.5 12,37Z",
    furcationArea:
      "M9,30 C11,26 14.5,20 17.5,15 C18.5,10 19.5,7 20,5.5" +
      " C20.5,7 21.5,10 24,15 C27,20 29.5,26 31.5,30" +
      " C30.5,33 29.5,35 28.5,37 Q20,34.5 12,37" +
      " C11,35 10,33 9,30Z",
    innerHighlight:
      "M12,9 C11,12 10,17 9.5,22 C9,25 9.5,28 10,31" +
      " C10.5,34 11.5,36 12.5,37 Q16.5,35 20,35 Q23.5,35 27.5,37" +
      " C28.5,36 29.5,34 30,31 C30.5,28 31,25 30.5,22" +
      " C30,17 29,12 28,9 C27,9 25.5,12 24.5,15" +
      " C23.5,11 22,7 20.5,7 C19.5,7 18.5,10 17.5,14" +
      " C16.5,10 15,8 13.5,8 C12.5,8.5 12,9 12,9Z",
    cervical: "M12,37 Q16,35 20,34.5 Q24,35 28,37",
    rootLines: [
      "M10,9 Q10.5,17 10,27",
      "M17.5,10 Q18,18 17.5,28",
      "M24,10 Q23.5,18 24,28",
    ],
    cusps: [
      "M12.5,61 L15.5,55 L18.5,57 L20,54 L21.5,57 L24.5,55 L27.5,61",
    ],
    details: [
      "M15,57 Q18,53 20,55 Q22,53 25,57",
    ],
    marginalRidges: [
      "M10,49 Q11,46 12,44",
      "M30,49 Q29,46 28,44",
    ],
  },

  // ── Upper Wisdom: short fused roots, smaller irregular crown ──
  upperWisdom: {
    outline:
      "M15,8 C13.5,8 12,12 11.5,17 C11,22 11,26 11.5,30" +
      " C12,33 12.5,35 13.5,37" +
      " Q17,35 20,34.5 Q23,35 26.5,37" +
      " C27.5,35 28,33 28.5,30 C29,26 29,22 28.5,17" +
      " C28,12 26.5,8 25,8" +
      " C23.5,8 22,11 20,15 C18,11 16.5,8 15,8Z" +
      // Crown
      " M13.5,37 C12.5,40 11.5,44 10.8,48 C10,53 9.8,57 10.2,61" +
      " C10.8,64 12.5,67 14.5,69.5 C16.5,71 18.5,72 20,72.5" +
      " C21.5,72 23.5,71 25.5,69.5 C27.5,67 29.2,64 29.8,61" +
      " C30.2,57 30,53 29.2,48 C28.5,44 27.5,40 26.5,37" +
      " Q23,35 20,34.5 Q17,35 13.5,37Z",
    crownArea:
      "M13.5,37 C12.5,40 11.5,44 10.8,48 C10,53 9.8,57 10.2,61" +
      " C10.8,64 12.5,67 14.5,69.5 C16.5,71 18.5,72 20,72.5" +
      " C21.5,72 23.5,71 25.5,69.5 C27.5,67 29.2,64 29.8,61" +
      " C30.2,57 30,53 29.2,48 C28.5,44 27.5,40 26.5,37" +
      " Q23,35 20,34.5 Q17,35 13.5,37Z",
    furcationArea:
      "M11.5,30 C13,27 16,22 20,15 C24,22 27,27 28.5,30" +
      " C28,33 27.5,35 26.5,37 Q23,35 20,34.5 Q17,35 13.5,37" +
      " C12.5,35 12,33 11.5,30Z",
    innerHighlight:
      "M16,12 C15,15 14,19 13.5,24 C13,27 13,30 13.5,33" +
      " C14,35 14.5,36.5 15.5,37 Q18,35.5 20,35 Q22,35.5 24.5,37" +
      " C25.5,36.5 26,35 26.5,33 C27,30 27,27 26.5,24" +
      " C26,19 25,15 24,12 C23,12 22,13 20,16" +
      " C18,13 17,12 16,12Z",
    cervical: "M13.5,37 Q17,35 20,34.5 Q23,35 26.5,37",
    rootLines: [
      "M14,12 Q14.5,20 14,29",
      "M20,15 Q20,22 20,29",
      "M26,12 Q25.5,20 26,29",
    ],
    cusps: [
      "M14,59 L17,54 L20,56 L23,54 L26,59",
    ],
    details: [
      "M15,56 Q17.5,52 20,54 Q22.5,52 25,56",
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  LOWER MOLARS — 2 roots with BIFURCATION
  // ════════════════════════════════════════════════════════════════════════════

  // ── Lower First Molar: wide crown, TWO roots ──
  lowerFirstMolar: {
    outline:
      // Mesial root (left)
      "M13,3 C11,3 9,8 8.5,15 C8,21 8,26 9,30" +
      " C9.5,33 10.5,35 12,37" +
      " Q16,35.5 20,35 Q24,35.5 28,37" +
      // Distal root (right)
      " C29.5,35 30.5,33 31,30 C32,26 32,21 31.5,15" +
      " C31,8 29,3 27,3" +
      // Furcation
      " C25,3 23,7 20,15 C17,7 15,3 13,3Z" +
      // Crown
      " M12,37 C11,40 9.5,44 8.5,49 C7.5,54 7,59 7.5,63" +
      " C8,67 9.5,70 12.5,73 C15,75 17.5,76.5 20,77" +
      " C22.5,76.5 25,75 27.5,73 C30.5,70 32,67 32.5,63" +
      " C33,59 32.5,54 31.5,49 C30.5,44 29,40 28,37" +
      " Q24,35.5 20,35 Q16,35.5 12,37Z",
    crownArea:
      "M12,37 C11,40 9.5,44 8.5,49 C7.5,54 7,59 7.5,63" +
      " C8,67 9.5,70 12.5,73 C15,75 17.5,76.5 20,77" +
      " C22.5,76.5 25,75 27.5,73 C30.5,70 32,67 32.5,63" +
      " C33,59 32.5,54 31.5,49 C30.5,44 29,40 28,37" +
      " Q24,35.5 20,35 Q16,35.5 12,37Z",
    furcationArea:
      "M9,30 C10.5,26 14,19 20,15 C26,19 29.5,26 31,30" +
      " C30.5,33 29.5,35 28,37 Q24,35.5 20,35 Q16,35.5 12,37" +
      " C10.5,35 9.5,33 9,30Z",
    innerHighlight:
      "M14,7 C12.5,7 10.5,12 10,18 C9.5,23 9.5,27 10.5,31" +
      " C11,33 11.5,35 12.5,37 Q16.5,35.5 20,35.5 Q23.5,35.5 27.5,37" +
      " C28.5,35 29,33 29.5,31 C30.5,27 30.5,23 30,18" +
      " C29.5,12 27.5,7 26,7 C24.5,7 22.5,10 20,16" +
      " C17.5,10 15.5,7 14,7Z",
    cervical: "M12,37 Q16,35.5 20,35 Q24,35.5 28,37",
    rootLines: [
      "M11,7 Q11.5,15 11,27",
      "M29,7 Q28.5,15 29,27",
    ],
    cusps: [
      "M11,61 L14.5,55 L17.5,57 L20,54 L22.5,57 L25.5,55 L29,61",
    ],
    details: [
      "M14,58 Q17.5,54 20,55 Q22.5,54 26,58",
      "M20,50 Q20,54 20,60",
    ],
    marginalRidges: [
      "M10,49 Q11,46 12,44",
      "M30,49 Q29,46 28,44",
    ],
  },

  // ── Lower Second Molar: 2 roots, 4-cusp pattern ──
  lowerSecondMolar: {
    outline:
      // Mesial root
      "M14,4 C12,4 10,9 9.5,16 C9,22 9,27 10,30" +
      " C10.5,33 11.5,35 12.5,37" +
      " Q16,35.5 20,35 Q24,35.5 27.5,37" +
      // Distal root
      " C28.5,35 29.5,33 30,30 C31,27 31,22 30.5,16" +
      " C30,9 28,4 26,4" +
      // Furcation
      " C24.5,4 22.5,8 20,14 C17.5,8 15.5,4 14,4Z" +
      // Crown
      " M12.5,37 C11.5,40 10,44 9,49 C8,54 7.5,58 8,62" +
      " C8.5,66 10,69 13,72 C15.5,74 18,75.5 20,76" +
      " C22,75.5 24.5,74 27,72 C30,69 31.5,66 32,62" +
      " C32.5,58 32,54 31,49 C30,44 28.5,40 27.5,37" +
      " Q24,35.5 20,35 Q16,35.5 12.5,37Z",
    crownArea:
      "M12.5,37 C11.5,40 10,44 9,49 C8,54 7.5,58 8,62" +
      " C8.5,66 10,69 13,72 C15.5,74 18,75.5 20,76" +
      " C22,75.5 24.5,74 27,72 C30,69 31.5,66 32,62" +
      " C32.5,58 32,54 31,49 C30,44 28.5,40 27.5,37" +
      " Q24,35.5 20,35 Q16,35.5 12.5,37Z",
    furcationArea:
      "M10,30 C12,26 15.5,20 20,14 C24.5,20 28,26 30,30" +
      " C29.5,33 28.5,35 27.5,37 Q24,35.5 20,35 Q16,35.5 12.5,37" +
      " C11.5,35 10.5,33 10,30Z",
    innerHighlight:
      "M15,8 C13.5,8 11.5,13 11,18 C10.5,23 10.5,27 11.5,31" +
      " C12,33 12.5,35 13.5,37 Q17,35.5 20,35.5 Q23,35.5 26.5,37" +
      " C27.5,35 28,33 28.5,31 C29.5,27 29.5,23 29,18" +
      " C28.5,13 26.5,8 25,8 C24,8 22.5,10 20,15" +
      " C17.5,10 16,8 15,8Z",
    cervical: "M12.5,37 Q16,35.5 20,35 Q24,35.5 27.5,37",
    rootLines: [
      "M12,8 Q12.5,16 12,27",
      "M28,8 Q27.5,16 28,27",
    ],
    cusps: [
      "M12,60 L15.5,54 L18.5,56 L20,53 L21.5,56 L24.5,54 L28,60",
    ],
    details: [
      "M15,57 Q17.5,53 20,55 Q22.5,53 25,57",
      "M20,50 Q20,53 20,58",
    ],
    marginalRidges: [
      "M10.5,49 Q11.5,46 12.5,44",
      "M29.5,49 Q28.5,46 27.5,44",
    ],
  },

  // ── Lower Wisdom: short fused roots, irregular crown ──
  lowerWisdom: {
    outline:
      "M15,8 C13.5,8 12,12 11.5,17 C11,22 11,26 11.5,30" +
      " C12,33 12.5,35 13.5,37" +
      " Q17,35 20,34.5 Q23,35 26.5,37" +
      " C27.5,35 28,33 28.5,30 C29,26 29,22 28.5,17" +
      " C28,12 26.5,8 25,8" +
      " C23.5,8 22,11 20,15 C18,11 16.5,8 15,8Z" +
      // Crown
      " M13.5,37 C12.5,40 11.5,44 10.8,48 C10,53 9.8,57 10.2,61" +
      " C10.8,64 12.5,67 14.5,69.5 C16.5,71 18.5,72 20,72.5" +
      " C21.5,72 23.5,71 25.5,69.5 C27.5,67 29.2,64 29.8,61" +
      " C30.2,57 30,53 29.2,48 C28.5,44 27.5,40 26.5,37" +
      " Q23,35 20,34.5 Q17,35 13.5,37Z",
    crownArea:
      "M13.5,37 C12.5,40 11.5,44 10.8,48 C10,53 9.8,57 10.2,61" +
      " C10.8,64 12.5,67 14.5,69.5 C16.5,71 18.5,72 20,72.5" +
      " C21.5,72 23.5,71 25.5,69.5 C27.5,67 29.2,64 29.8,61" +
      " C30.2,57 30,53 29.2,48 C28.5,44 27.5,40 26.5,37" +
      " Q23,35 20,34.5 Q17,35 13.5,37Z",
    furcationArea:
      "M11.5,30 C13,27 16,22 20,15 C24,22 27,27 28.5,30" +
      " C28,33 27.5,35 26.5,37 Q23,35 20,34.5 Q17,35 13.5,37" +
      " C12.5,35 12,33 11.5,30Z",
    innerHighlight:
      "M16,12 C15,15 14,19 13.5,24 C13,27 13,30 13.5,33" +
      " C14,35 14.5,36.5 15.5,37 Q18,35.5 20,35 Q22,35.5 24.5,37" +
      " C25.5,36.5 26,35 26.5,33 C27,30 27,27 26.5,24" +
      " C26,19 25,15 24,12 C23,12 22,13 20,16" +
      " C18,13 17,12 16,12Z",
    cervical: "M13.5,37 Q17,35 20,34.5 Q23,35 26.5,37",
    rootLines: [
      "M14,12 Q14.5,20 14,29",
      "M26,12 Q25.5,20 26,29",
    ],
    cusps: [
      "M14,59 L17,54 L20,56 L23,54 L26,59",
    ],
    details: [
      "M15,56 Q17.5,52 20,54 Q22.5,52 25,56",
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
            {/* ─── Main body gradient – bright ivory/white base, warmer at root apex ─── */}
            <linearGradient id={`g-${id}`} x1="0.15" y1="0" x2="0.85" y2="1">
              <stop offset="0%" stopColor="#e8e0cc" />
              <stop offset="12%" stopColor="#ede6d4" />
              <stop offset="28%" stopColor="#f2ede2" />
              <stop offset="42%" stopColor="#f6f2ea" />
              <stop offset="55%" stopColor="#f9f6f0" />
              <stop offset="70%" stopColor="#fbf9f4" />
              <stop offset="85%" stopColor="#fdfcf9" />
              <stop offset="100%" stopColor="#fefefe" />
            </linearGradient>

            {/* ─── Enamel cap – prominent white sheen on CROWN only ─── */}
            {shape.crownArea && (
              <linearGradient id={`ce-${id}`} x1="0.5" y1="0.3" x2="0.5" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.05" />
                <stop offset="8%" stopColor="white" stopOpacity="0.2" />
                <stop offset="20%" stopColor="white" stopOpacity="0.38" />
                <stop offset="35%" stopColor="white" stopOpacity="0.48" />
                <stop offset="50%" stopColor="white" stopOpacity="0.44" />
                <stop offset="65%" stopColor="white" stopOpacity="0.36" />
                <stop offset="80%" stopColor="white" stopOpacity="0.22" />
                <stop offset="100%" stopColor="white" stopOpacity="0.12" />
              </linearGradient>
            )}

            {/* ─── Left specular highlight – strong 3D shine ─── */}
            <linearGradient id={`h-${id}`} x1="0" y1="0.15" x2="0.6" y2="0.85">
              <stop offset="0%" stopColor="white" stopOpacity="0.6" />
              <stop offset="12%" stopColor="white" stopOpacity="0.35" />
              <stop offset="30%" stopColor="white" stopOpacity="0.12" />
              <stop offset="55%" stopColor="white" stopOpacity="0.03" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            {/* ─── Right edge shadow – subtle depth ─── */}
            <linearGradient id={`rs2-${id}`} x1="1" y1="0.25" x2="0.25" y2="0.75">
              <stop offset="0%" stopColor="#9e9080" stopOpacity="0.28" />
              <stop offset="25%" stopColor="#9e9080" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#9e9080" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#9e9080" stopOpacity="0" />
            </linearGradient>

            {/* ─── Cementum darkening on root apex ─── */}
            <linearGradient id={`rs-${id}`} x1="0.5" y1="0" x2="0.5" y2="0.5">
              <stop offset="0%" stopColor="#c0b090" stopOpacity="0.35" />
              <stop offset="20%" stopColor="#c8b898" stopOpacity="0.22" />
              <stop offset="40%" stopColor="#d0c0a0" stopOpacity="0.12" />
              <stop offset="70%" stopColor="#d8c8a8" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#d8c8a8" stopOpacity="0" />
            </linearGradient>

            {/* ─── Furcation depth shadow ─── */}
            {shape.furcationArea && (
              <radialGradient id={`fur-${id}`} cx="0.5" cy="0.6" r="0.5">
                <stop offset="0%" stopColor="#c89888" stopOpacity="0.55" />
                <stop offset="20%" stopColor="#d0a090" stopOpacity="0.35" />
                <stop offset="45%" stopColor="#d8b0a0" stopOpacity="0.15" />
                <stop offset="75%" stopColor="#e0c0b0" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#e0c0b0" stopOpacity="0" />
              </radialGradient>
            )}

            {/* ─── Ambient occlusion ─── */}
            <radialGradient id={`ao-${id}`} cx="0.5" cy="0.52" r="0.48">
              <stop offset="50%" stopColor="transparent" />
              <stop offset="75%" stopColor="#8a8070" stopOpacity="0.06" />
              <stop offset="90%" stopColor="#8a8070" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#8a8070" stopOpacity="0.22" />
            </radialGradient>

            {/* ─── Inner body highlight ─── */}
            <radialGradient id={`ih-${id}`} cx="0.4" cy="0.55" r="0.38" fx="0.35" fy="0.48">
              <stop offset="0%" stopColor="white" stopOpacity="0.32" />
              <stop offset="35%" stopColor="white" stopOpacity="0.12" />
              <stop offset="70%" stopColor="white" stopOpacity="0.03" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>

            {/* ─── Dentin warmth ─── */}
            {shape.crownArea && (
              <radialGradient id={`dt-${id}`} cx="0.5" cy="0.6" r="0.4">
                <stop offset="0%" stopColor="#f8edd5" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#f0e4c8" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#f0e4c8" stopOpacity="0" />
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
              fill="rgba(0,0,0,0.04)"
              fillRule="evenodd"
              transform="translate(0.6, 1.2)"
            />

            {/* Main tooth fill */}
            <path
              d={shape.outline}
              fill={`url(#g-${id})`}
              fillRule="evenodd"
              stroke="#cdc0a8"
              strokeWidth="0.45"
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

            {/* Dentin warmth layer */}
            {shape.crownArea && (
              <path d={shape.crownArea} fill={`url(#dt-${id})`} />
            )}

            {/* Enamel cap on crown */}
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
                stroke="#d0c4a8"
                strokeWidth="0.3"
                strokeLinecap="round"
                opacity={0.18}
              />
            ))}

            {/* Cervical line (CEJ) */}
            {shape.cervical && (
              <path
                d={shape.cervical}
                fill="none"
                stroke="#c0b498"
                strokeWidth="0.65"
                strokeLinecap="round"
                opacity={0.45}
              />
            )}

            {/* Cusp ridges */}
            {shape.cusps?.map((cusp, i) => (
              <path
                key={`cusp-${i}`}
                d={cusp}
                fill="none"
                stroke="#d0c4a0"
                strokeWidth="0.45"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.3}
              />
            ))}

            {/* Marginal ridges */}
            {shape.marginalRidges?.map((ridge, i) => (
              <path
                key={`mr-${i}`}
                d={ridge}
                fill="none"
                stroke="#cfc4a0"
                strokeWidth="0.35"
                strokeLinecap="round"
                opacity={0.22}
              />
            ))}

            {/* Fissures/grooves */}
            {shape.details?.map((detail, i) => (
              <path
                key={i}
                d={detail}
                fill="none"
                stroke="#b8a880"
                strokeWidth="0.45"
                strokeLinecap="round"
                opacity={0.3}
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
