import { cn } from '@/lib/utils';

/**
 * Realistic anatomical tooth SVG paths — viewBox: 0 0 40 80
 * Upper teeth: root at top (y ≈ 0-38), crown at bottom (y ≈ 38-78).
 * Lower teeth are rotated 180° by the component.
 *
 * Multi-rooted teeth (molars, upper first premolar) have outlines that trace
 * around each root individually, producing a visible furcation notch.
 */
const TOOTH_SHAPES: Record<string, {
  outline: string;
  innerHighlight?: string;
  cervical?: string;
  rootLines?: string[];
  details?: string[];
  cusps?: string[];
  /** Optional path between split roots – filled with gum-colour for depth */
  furcationArea?: string;
  /** Enamel cap path (crown portion only) for brighter shading */
  enamelCap?: string;
}> = {
  /* ─── CENTRAL INCISOR ─── */
  centralIncisor: {
    outline:
      'M20,1 C18.2,1 16.8,3.5 15.8,8 C14.8,13 14.2,19 13.8,25' +
      ' C13.5,29 13.2,33 13,37 C12.6,42 11.8,47 11,52' +
      ' C10.3,57 10,61 10.2,65 C10.5,69 12,72.5 14.5,75' +
      ' C16.5,77 18.5,78 20,78.5 C21.5,78 23.5,77 25.5,75' +
      ' C28,72.5 29.5,69 29.8,65 C30,61 29.7,57 29,52' +
      ' C28.2,47 27.4,42 27,37 C26.8,33 26.5,29 26.2,25' +
      ' C25.8,19 25.2,13 24.2,8 C23.2,3.5 21.8,1 20,1Z',
    innerHighlight:
      'M20,5 C19,5 17.8,8 17,14 C16,21 15.5,28 15.2,34' +
      ' C15,38 14.5,43 13.8,48 C13.2,53 13,58 13.2,63' +
      ' C13.5,67 14.8,70.5 17,73 C18.5,74.5 19.5,75 20,75' +
      ' C20.5,75 21.5,74.5 23,73 C25.2,70.5 26.5,67 26.8,63' +
      ' C27,58 26.8,53 26.2,48 C25.5,43 25,38 24.8,34' +
      ' C24.5,28 24,21 23,14 C22.2,8 21,5 20,5Z',
    cervical: 'M13,40 Q16.5,37 20,36 Q23.5,37 27,40',
    enamelCap:
      'M13,40 C12.6,42 11.8,47 11,52 C10.3,57 10,61 10.2,65' +
      ' C10.5,69 12,72.5 14.5,75 C16.5,77 18.5,78 20,78.5' +
      ' C21.5,78 23.5,77 25.5,75 C28,72.5 29.5,69 29.8,65' +
      ' C30,61 29.7,57 29,52 C28.2,47 27.4,42 27,40' +
      ' Q23.5,37 20,36 Q16.5,37 13,40Z',
    rootLines: [
      'M18,4 Q18.5,14 18,30',
      'M22,4 Q21.5,14 22,30',
    ],
    cusps: [
      'M13,65 Q16.5,59 20,57.5 Q23.5,59 27,65',
    ],
  },

  /* ─── LATERAL INCISOR ─── */
  lateralIncisor: {
    outline:
      'M20,3 C18.5,3 17.2,5.5 16.2,10 C15.2,15 14.8,21 14.5,27' +
      ' C14.2,31 14,35 13.8,39 C13.4,43 12.8,48 12.2,52' +
      ' C11.7,56 11.5,60 11.8,64 C12.2,68 13.5,71 15.5,73.5' +
      ' C17.2,75.5 18.8,76.5 20,77 C21.2,76.5 22.8,75.5 24.5,73.5' +
      ' C26.5,71 27.8,68 28.2,64 C28.5,60 28.3,56 27.8,52' +
      ' C27.2,48 26.6,43 26.2,39 C26,35 25.8,31 25.5,27' +
      ' C25.2,21 24.8,15 23.8,10 C22.8,5.5 21.5,3 20,3Z',
    innerHighlight:
      'M20,7 C19,7 18,9.5 17.2,14 C16.2,20 15.8,26 15.6,31' +
      ' C15.4,35 15,39 14.6,43 C14.2,48 14,52 14.2,57' +
      ' C14.5,62 15.5,66 17.5,69 C18.8,70.5 19.5,71 20,71' +
      ' C20.5,71 21.2,70.5 22.5,69 C24.5,66 25.5,62 25.8,57' +
      ' C26,52 25.8,48 25.4,43 C25,39 24.6,35 24.4,31' +
      ' C24.2,26 23.8,20 22.8,14 C22,9.5 21,7 20,7Z',
    cervical: 'M14,41 Q17,38 20,37 Q23,38 26,41',
    enamelCap:
      'M14,41 C13.4,43 12.8,48 12.2,52 C11.7,56 11.5,60 11.8,64' +
      ' C12.2,68 13.5,71 15.5,73.5 C17.2,75.5 18.8,76.5 20,77' +
      ' C21.2,76.5 22.8,75.5 24.5,73.5 C26.5,71 27.8,68 28.2,64' +
      ' C28.5,60 28.3,56 27.8,52 C27.2,48 26.6,43 26,41' +
      ' Q23,38 20,37 Q17,38 14,41Z',
    rootLines: [
      'M18.5,6 Q18.8,16 18.5,33',
      'M21.5,6 Q21.2,16 21.5,33',
    ],
    cusps: [
      'M14,63 Q17,58 20,56 Q23,58 26,63',
    ],
  },

  /* ─── CANINE ─── */
  canine: {
    outline:
      'M20,0.5 C18.2,0.5 16.5,3 15.5,8 C14.5,13.5 13.8,20 13.2,26' +
      ' C12.8,30 12.4,34 12,38 C11.5,42.5 10.8,47 10.2,52' +
      ' C9.7,56 9.5,60 10,64 C10.5,67.5 11.8,70.5 14,73.5' +
      ' C16,76 18,78 20,79 C22,78 24,76 26,73.5' +
      ' C28.2,70.5 29.5,67.5 30,64 C30.5,60 30.3,56 29.8,52' +
      ' C29.2,47 28.5,42.5 28,38 C27.6,34 27.2,30 26.8,26' +
      ' C26.2,20 25.5,13.5 24.5,8 C23.5,3 21.8,0.5 20,0.5Z',
    innerHighlight:
      'M20,4 C18.8,4 17.5,7 16.5,13 C15.5,19 15,25 14.5,30' +
      ' C14.2,34 13.8,38 13.3,42.5 C12.8,47 12.5,52 12.8,57' +
      ' C13.2,62 14.5,66 16.5,69.5 C18,72 19.5,73.5 20,74' +
      ' C20.5,73.5 22,72 23.5,69.5 C25.5,66 26.8,62 27.2,57' +
      ' C27.5,52 27.2,47 26.7,42.5 C26.2,38 25.8,34 25.5,30' +
      ' C25,25 24.5,19 23.5,13 C22.5,7 21.2,4 20,4Z',
    cervical: 'M12,40 Q16,36.5 20,35.5 Q24,36.5 28,40',
    enamelCap:
      'M12,40 C11.5,42.5 10.8,47 10.2,52 C9.7,56 9.5,60 10,64' +
      ' C10.5,67.5 11.8,70.5 14,73.5 C16,76 18,78 20,79' +
      ' C22,78 24,76 26,73.5 C28.2,70.5 29.5,67.5 30,64' +
      ' C30.5,60 30.3,56 29.8,52 C29.2,47 28.5,42.5 28,40' +
      ' Q24,36.5 20,35.5 Q16,36.5 12,40Z',
    rootLines: [
      'M18,3 Q18.5,14 18,32',
      'M22,3 Q21.5,14 22,32',
    ],
    cusps: [
      'M13,62 Q17,56 20,52 Q23,56 27,62',
    ],
  },

  /* ─── FIRST PREMOLAR — bifurcated root ─── */
  firstPremolar: {
    // The outline traces around two separate root tips with a furcation notch
    outline:
      // Left root apex → left side down
      'M15,4 C13.5,4 12,8 11.5,14 C11,19 10.8,24 11,28' +
      // Left cervical → crown left
      ' C11.2,32 11.5,36 12,39 C11.5,43 10.8,48 10.5,52' +
      ' C10.2,56 10,60 10.5,64 C11,67.5 12.5,70.5 15,73' +
      ' C17,75 18.5,76 20,76.5' +
      // Crown right → cervical right
      ' C21.5,76 23,75 25,73 C27.5,70.5 29,67.5 29.5,64' +
      ' C30,60 29.8,56 29.5,52 C29.2,48 28.5,43 28,39' +
      // Right root outer side up
      ' C28.5,36 28.8,32 29,28 C29.2,24 29,19 28.5,14' +
      ' C28,8 26.5,4 25,4' +
      // Right root apex → furcation inner right side
      ' C24,4 22.8,8 22,13 C21.5,17 21.2,21 21,24' +
      // Furcation notch
      ' C20.8,26 20.5,28 20,30 C19.5,28 19.2,26 19,24' +
      // Furcation inner left side → left root apex
      ' C18.8,21 18.5,17 18,13 C17.2,8 16,4 15,4Z',
    furcationArea:
      'M18,13 C17.2,8 16,4 15,4 C16,4 17.2,8 18,13' +
      ' C18.5,17 18.8,21 19,24 C19.2,26 19.5,28 20,30' +
      ' C20.5,28 20.8,26 21,24 C21.2,21 21.5,17 22,13' +
      ' C22.8,8 24,4 25,4 C24,4 22.8,8 22,13Z',
    innerHighlight:
      'M20,34 C18,34 16,36 14.5,39 C13.5,43 13,48 12.8,52' +
      ' C12.5,56 12.5,60 13,63 C13.5,66 15,69 17,71' +
      ' C18.5,72 19.5,72.5 20,72.5 C20.5,72.5 21.5,72 23,71' +
      ' C25,69 26.5,66 27,63 C27.5,60 27.5,56 27.2,52' +
      ' C27,48 26.5,43 25.5,39 C24,36 22,34 20,34Z',
    cervical: 'M12,40 Q16,37 20,36 Q24,37 28,40',
    enamelCap:
      'M12,40 C11.5,43 10.8,48 10.5,52 C10.2,56 10,60 10.5,64' +
      ' C11,67.5 12.5,70.5 15,73 C17,75 18.5,76 20,76.5' +
      ' C21.5,76 23,75 25,73 C27.5,70.5 29,67.5 29.5,64' +
      ' C30,60 29.8,56 29.5,52 C29.2,48 28.5,43 28,40' +
      ' Q24,37 20,36 Q16,37 12,40Z',
    rootLines: [
      'M14,7 Q14.5,14 14,28',
      'M26,7 Q25.5,14 26,28',
    ],
    cusps: [
      'M14,64 L17,58 L20,60 L23,58 L26,64',
    ],
    details: ['M15,57 Q17.5,53 20,52 Q22.5,53 25,57'],
  },

  /* ─── SECOND PREMOLAR — single root ─── */
  secondPremolar: {
    outline:
      'M20,4 C18.2,4 16.5,7.5 15.5,13 C14.5,18.5 14,24 13.5,29' +
      ' C13.2,33 13,36.5 12.8,40 C12.4,44 11.8,48.5 11.2,53' +
      ' C10.8,57 10.5,60.5 10.8,64 C11.2,67.5 12.5,70.5 14.8,73' +
      ' C16.5,75 18.5,76 20,76.5 C21.5,76 23.5,75 25.2,73' +
      ' C27.5,70.5 28.8,67.5 29.2,64 C29.5,60.5 29.2,57 28.8,53' +
      ' C28.2,48.5 27.6,44 27.2,40 C27,36.5 26.8,33 26.5,29' +
      ' C26,24 25.5,18.5 24.5,13 C23.5,7.5 21.8,4 20,4Z',
    innerHighlight:
      'M20,8 C18.8,8 17.5,11 16.5,16 C15.5,22 15.2,27 15,31' +
      ' C14.8,35 14.5,39 14.2,43 C14,47 13.5,52 13.5,56' +
      ' C13.5,60 14,64 15.5,67 C17,70 18.5,71.5 20,72' +
      ' C21.5,71.5 23,70 24.5,67 C26,64 26.5,60 26.5,56' +
      ' C26.5,52 26,47 25.8,43 C25.5,39 25.2,35 25,31' +
      ' C24.8,27 24.5,22 23.5,16 C22.5,11 21.2,8 20,8Z',
    cervical: 'M13,41 Q16.5,38 20,37 Q23.5,38 27,41',
    enamelCap:
      'M13,41 C12.4,44 11.8,48.5 11.2,53 C10.8,57 10.5,60.5 10.8,64' +
      ' C11.2,67.5 12.5,70.5 14.8,73 C16.5,75 18.5,76 20,76.5' +
      ' C21.5,76 23.5,75 25.2,73 C27.5,70.5 28.8,67.5 29.2,64' +
      ' C29.5,60.5 29.2,57 28.8,53 C28.2,48.5 27.6,44 27,41' +
      ' Q23.5,38 20,37 Q16.5,38 13,41Z',
    rootLines: [
      'M18,7 Q18.5,16 18,34',
      'M22,7 Q21.5,16 22,34',
    ],
    cusps: [
      'M14,63 L17.5,57 L20,59 L22.5,57 L26,63',
    ],
    details: ['M15.5,56 Q18,52 20,51 Q22,52 24.5,56'],
  },

  /* ─── FIRST MOLAR — two visible roots with clear furcation ─── */
  firstMolar: {
    // Outline traces: left root → furcation notch → right root → crown
    outline:
      // Left (mesial) root apex
      'M13,2 C11,2.5 9.5,7 9,13 C8.5,19 8.5,24 9,29' +
      // Left side cervical
      ' C9.3,32 9.8,35 11,38' +
      // Left crown
      ' C10,42 9,47 8.5,52 C8,57 8,62 9,66' +
      ' C10,70 12,73.5 15,76 C17.5,78 19,78.5 20,79' +
      // Right crown
      ' C21,78.5 22.5,78 25,76 C28,73.5 30,70 31,66' +
      ' C32,62 32,57 31.5,52 C31,47 30,42 29,38' +
      // Right side cervical
      ' C30.2,35 30.7,32 31,29 C31.5,24 31.5,19 31,13' +
      ' C30.5,7 29,2.5 27,2' +
      // Right root apex → inner right side going down to furcation
      ' C25.5,2 24,6 23,11 C22.2,15 21.5,19 21,23' +
      // Furcation notch (the V between roots)
      ' L20,27 L19,23' +
      // Inner left side going back up from furcation to left root apex
      ' C18.5,19 17.8,15 17,11 C16,6 14.5,2 13,2Z',
    furcationArea:
      'M17,11 C16,6 14.5,2 13,2 C14.5,2 16,6 17,11' +
      ' C17.8,15 18.5,19 19,23 L20,27 L21,23' +
      ' C21.5,19 22.2,15 23,11 C24,6 25.5,2 27,2' +
      ' C25.5,2 24,6 23,11Z',
    innerHighlight:
      'M20,35 C17,35 14,37 12,40 C10.5,44 10,49 9.8,54' +
      ' C9.7,58 10,62 11,65 C12.5,69 15,72 17.5,74' +
      ' C19,75 19.8,75 20,75 C20.2,75 21,75 22.5,74' +
      ' C25,72 27.5,69 29,65 C30,62 30.3,58 30.2,54' +
      ' C30,49 29.5,44 28,40 C26,37 23,35 20,35Z',
    cervical: 'M11,39 Q15.5,35.5 20,34.5 Q24.5,35.5 29,39',
    enamelCap:
      'M11,39 C10,42 9,47 8.5,52 C8,57 8,62 9,66' +
      ' C10,70 12,73.5 15,76 C17.5,78 19,78.5 20,79' +
      ' C21,78.5 22.5,78 25,76 C28,73.5 30,70 31,66' +
      ' C32,62 32,57 31.5,52 C31,47 30,42 29,39' +
      ' Q24.5,35.5 20,34.5 Q15.5,35.5 11,39Z',
    rootLines: [
      'M12,5 Q12.5,14 12,28',
      'M20,28 L20,34',
      'M28,5 Q27.5,14 28,28',
    ],
    cusps: [
      'M12,64 L15,58 L17.5,60 L20,56 L22.5,60 L25,58 L28,64',
    ],
    details: [
      'M13,58 Q16.5,53 20,55 Q23.5,53 27,58',
      'M15.5,62 Q20,58 24.5,62',
    ],
  },

  /* ─── SECOND MOLAR — two roots, slightly smaller ─── */
  secondMolar: {
    outline:
      // Left root
      'M14,3 C12,3.5 10.5,8 10,14 C9.5,19.5 9.5,25 10,29.5' +
      ' C10.3,33 10.8,36 12,39' +
      // Left crown
      ' C11,43 10,48 9.5,53 C9,57 9,61.5 10,65' +
      ' C11,68.5 13,71.5 15.5,74 C17.5,76 19,76.5 20,77' +
      // Right crown
      ' C21,76.5 22.5,76 24.5,74 C27,71.5 29,68.5 30,65' +
      ' C31,61.5 31,57 30.5,53 C30,48 29,43 28,39' +
      ' C29.2,36 29.7,33 30,29.5 C30.5,25 30.5,19.5 30,14' +
      ' C29.5,8 28,3.5 26,3' +
      // Right root apex → furcation
      ' C24.5,3 23.2,7 22.2,12 C21.5,16 21,20 20.5,23.5' +
      ' L20,26 L19.5,23.5' +
      ' C19,20 18.5,16 17.8,12 C16.8,7 15.5,3 14,3Z',
    furcationArea:
      'M17.8,12 C16.8,7 15.5,3 14,3 C15.5,3 16.8,7 17.8,12' +
      ' C18.5,16 19,20 19.5,23.5 L20,26 L20.5,23.5' +
      ' C21,20 21.5,16 22.2,12 C23.2,7 24.5,3 26,3' +
      ' C24.5,3 23.2,7 22.2,12Z',
    innerHighlight:
      'M20,36 C17,36 14.5,38 12.8,41 C11.5,44 11,49 10.8,53' +
      ' C10.7,57 11,61 12,64 C13.5,67.5 15.5,70 18,72' +
      ' C19.2,72.5 19.8,73 20,73 C20.2,73 20.8,72.5 22,72' +
      ' C24.5,70 26.5,67.5 28,64 C29,61 29.3,57 29.2,53' +
      ' C29,49 28.5,44 27.2,41 C25.5,38 23,36 20,36Z',
    cervical: 'M12,40 Q16,36.5 20,35.5 Q24,36.5 28,40',
    enamelCap:
      'M12,40 C11,43 10,48 9.5,53 C9,57 9,61.5 10,65' +
      ' C11,68.5 13,71.5 15.5,74 C17.5,76 19,76.5 20,77' +
      ' C21,76.5 22.5,76 24.5,74 C27,71.5 29,68.5 30,65' +
      ' C31,61.5 31,57 30.5,53 C30,48 29,43 28,40' +
      ' Q24,36.5 20,35.5 Q16,36.5 12,40Z',
    rootLines: [
      'M13,6 Q13.5,14 13,28',
      'M27,6 Q26.5,14 27,28',
    ],
    cusps: [
      'M13,63 L16,57 L18.5,59 L20,55 L21.5,59 L24,57 L27,63',
    ],
    details: [
      'M14,57 Q17,52 20,54 Q23,52 26,57',
      'M16,61 Q20,57 24,61',
    ],
  },

  /* ─── WISDOM (Third Molar) — shorter fused / converging roots ─── */
  wisdom: {
    outline:
      // Shorter roots, partially fused
      'M16,6 C14.5,6 13,9.5 12,15 C11,20 10.8,25 11,30' +
      ' C11.2,34 12,37 13.5,40' +
      // Crown
      ' C12.5,44 12,49 12,53 C12,57 12.5,61 14,65' +
      ' C15.5,68 17.5,70.5 20,71.5 C22.5,70.5 24.5,68 26,65' +
      ' C27.5,61 28,57 28,53 C28,49 27.5,44 26.5,40' +
      // Right root
      ' C28,37 28.8,34 29,30 C29.2,25 29,20 28,15' +
      ' C27,9.5 25.5,6 24,6' +
      // Shallow furcation between fused roots
      ' C23,6 22,9 21,13 C20.5,16 20.3,19 20,21' +
      ' C19.7,19 19.5,16 19,13 C18,9 17,6 16,6Z',
    innerHighlight:
      'M20,28 C18,28 15.5,31 14.5,35 C13.5,40 13.2,45 13.2,50' +
      ' C13.2,54 13.8,58 15,61 C16.5,64 18.5,66 20,67' +
      ' C21.5,66 23.5,64 25,61 C26.2,58 26.8,54 26.8,50' +
      ' C26.8,45 26.5,40 25.5,35 C24.5,31 22,28 20,28Z',
    cervical: 'M13.5,41 Q17,38 20,37 Q23,38 26.5,41',
    enamelCap:
      'M13.5,41 C12.5,44 12,49 12,53 C12,57 12.5,61 14,65' +
      ' C15.5,68 17.5,70.5 20,71.5 C22.5,70.5 24.5,68 26,65' +
      ' C27.5,61 28,57 28,53 C28,49 27.5,44 26.5,41' +
      ' Q23,38 20,37 Q17,38 13.5,41Z',
    rootLines: [
      'M15,9 Q15.5,16 15,30',
      'M25,9 Q24.5,16 25,30',
    ],
    cusps: [
      'M15,62 L18,57 L20,59 L22,57 L25,62',
    ],
    details: ['M16,57 Q20,52 24,57'],
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
            {/* Main body gradient — warm ivory with subtle 3D left-to-right shading */}
            <linearGradient id={`g-${id}`} x1="0.05" y1="0" x2="0.95" y2="1">
              <stop offset="0%" stopColor="#f7f2e8" />
              <stop offset="12%" stopColor="#f0e9d8" />
              <stop offset="30%" stopColor="#e9e0ca" />
              <stop offset="50%" stopColor="#dfd4b8" />
              <stop offset="70%" stopColor="#d6cab0" />
              <stop offset="85%" stopColor="#cbbf9c" />
              <stop offset="100%" stopColor="#c2b590" />
            </linearGradient>

            {/* Root-specific gradient — slightly darker / more yellow than crown */}
            <linearGradient id={`rg-${id}`} x1="0.5" y1="0" x2="0.5" y2="0.55">
              <stop offset="0%" stopColor="#c4b68c" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#c4b68c" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#c4b68c" stopOpacity="0" />
            </linearGradient>

            {/* Crown enamel — bright white cap */}
            <linearGradient id={`ce-${id}`} x1="0.5" y1="0.42" x2="0.5" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="15%" stopColor="white" stopOpacity="0.06" />
              <stop offset="40%" stopColor="white" stopOpacity="0.25" />
              <stop offset="65%" stopColor="white" stopOpacity="0.18" />
              <stop offset="85%" stopColor="white" stopOpacity="0.1" />
              <stop offset="100%" stopColor="white" stopOpacity="0.03" />
            </linearGradient>

            {/* Left specular highlight */}
            <linearGradient id={`h-${id}`} x1="0" y1="0.15" x2="0.65" y2="0.85">
              <stop offset="0%" stopColor="white" stopOpacity="0.52" />
              <stop offset="15%" stopColor="white" stopOpacity="0.28" />
              <stop offset="40%" stopColor="white" stopOpacity="0.08" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            {/* Right edge shadow */}
            <linearGradient id={`rs2-${id}`} x1="1" y1="0.25" x2="0.25" y2="0.75">
              <stop offset="0%" stopColor="#7a6c50" stopOpacity="0.22" />
              <stop offset="35%" stopColor="#7a6c50" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#7a6c50" stopOpacity="0" />
            </linearGradient>

            {/* Ambient occlusion — edge depth */}
            <radialGradient id={`ao-${id}`} cx="0.5" cy="0.52" r="0.48">
              <stop offset="55%" stopColor="transparent" />
              <stop offset="80%" stopColor="#6b5e44" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#6b5e44" stopOpacity="0.2" />
            </radialGradient>

            {/* Inner volume highlight */}
            <radialGradient id={`ih-${id}`} cx="0.4" cy="0.55" r="0.36" fx="0.36" fy="0.5">
              <stop offset="0%" stopColor="white" stopOpacity="0.22" />
              <stop offset="45%" stopColor="white" stopOpacity="0.08" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>

            {/* Furcation shadow — gum-coloured depth between roots */}
            <radialGradient id={`fs-${id}`} cx="0.5" cy="0.3" r="0.35">
              <stop offset="0%" stopColor="#c49a8a" stopOpacity="0.55" />
              <stop offset="60%" stopColor="#c49a8a" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#c49a8a" stopOpacity="0" />
            </radialGradient>

            <clipPath id={`clip-${id}`}>
              <path d={shape.outline} />
            </clipPath>
          </defs>

          <g transform={groupTransform}>
            {/* Soft drop shadow */}
            <path
              d={shape.outline}
              fill="rgba(0,0,0,0.07)"
              transform="translate(0.8, 1.5)"
            />

            {/* Main tooth fill */}
            <path
              d={shape.outline}
              fill={`url(#g-${id})`}
              stroke="#b0a278"
              strokeWidth="0.55"
              strokeLinejoin="round"
            />

            {/* Root darkening */}
            <path d={shape.outline} fill={`url(#rg-${id})`} />

            {/* Right edge shadow */}
            <path d={shape.outline} fill={`url(#rs2-${id})`} />

            {/* Ambient occlusion */}
            <path d={shape.outline} fill={`url(#ao-${id})`} />

            {/* Inner volume highlight */}
            {shape.innerHighlight && (
              <g clipPath={`url(#clip-${id})`}>
                <path d={shape.innerHighlight} fill={`url(#ih-${id})`} />
              </g>
            )}

            {/* Enamel cap brightness (crown only) */}
            {shape.enamelCap ? (
              <path d={shape.enamelCap} fill={`url(#ce-${id})`} />
            ) : (
              <path d={shape.outline} fill={`url(#ce-${id})`} />
            )}

            {/* Left specular highlight */}
            <path d={shape.outline} fill={`url(#h-${id})`} />

            {/* Furcation depth colouring between roots */}
            {shape.furcationArea && (
              <path d={shape.furcationArea} fill={`url(#fs-${id})`} />
            )}

            {/* Root canal lines */}
            {shape.rootLines?.map((line, i) => (
              <path
                key={`rl-${i}`}
                d={line}
                fill="none"
                stroke="#bfad88"
                strokeWidth="0.45"
                strokeLinecap="round"
                opacity={0.28}
              />
            ))}

            {/* Cervical line */}
            {shape.cervical && (
              <path
                d={shape.cervical}
                fill="none"
                stroke="#ad9e78"
                strokeWidth="0.75"
                strokeLinecap="round"
                opacity={0.55}
              />
            )}

            {/* Cusp ridges */}
            {shape.cusps?.map((cusp, i) => (
              <path
                key={`cusp-${i}`}
                d={cusp}
                fill="none"
                stroke="#c5b898"
                strokeWidth="0.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.38}
              />
            ))}

            {/* Anatomical detail lines (fissures, grooves) */}
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
