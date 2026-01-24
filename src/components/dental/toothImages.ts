// Tooth images mapping using FDI notation
// Upper right quadrant (Q1): 18-11
import tooth18 from '@/assets/teeth/tooth-18.png';
import tooth17 from '@/assets/teeth/tooth-17.png';
import tooth16 from '@/assets/teeth/tooth-16.png';
import tooth15 from '@/assets/teeth/tooth-15.png';
import tooth14 from '@/assets/teeth/tooth-14.png';
import tooth13 from '@/assets/teeth/tooth-13.png';
import tooth12 from '@/assets/teeth/tooth-12.png';
import tooth11 from '@/assets/teeth/tooth-11.png';

// Upper left quadrant (Q2): 21-28
import tooth21 from '@/assets/teeth/tooth-21.png';
import tooth22 from '@/assets/teeth/tooth-22.png';
import tooth23 from '@/assets/teeth/tooth-23.png';
import tooth24 from '@/assets/teeth/tooth-24.png';
import tooth25 from '@/assets/teeth/tooth-25.png';
import tooth26 from '@/assets/teeth/tooth-26.png';
import tooth27 from '@/assets/teeth/tooth-27.png';
import tooth28 from '@/assets/teeth/tooth-28.png';

// Lower left quadrant (Q3): 31-38
import tooth31 from '@/assets/teeth/tooth-31.png';
import tooth32 from '@/assets/teeth/tooth-32.png';
import tooth33 from '@/assets/teeth/tooth-33.png';
import tooth34 from '@/assets/teeth/tooth-34.png';
import tooth35 from '@/assets/teeth/tooth-35.png';
import tooth36 from '@/assets/teeth/tooth-36.png';
import tooth37 from '@/assets/teeth/tooth-37.png';
import tooth38 from '@/assets/teeth/tooth-38.png';

// Lower right quadrant (Q4): 48-41
import tooth41 from '@/assets/teeth/tooth-41.png';
import tooth42 from '@/assets/teeth/tooth-42.png';
import tooth43 from '@/assets/teeth/tooth-43.png';
import tooth44 from '@/assets/teeth/tooth-44.png';
import tooth45 from '@/assets/teeth/tooth-45.png';
import tooth46 from '@/assets/teeth/tooth-46.png';
import tooth47 from '@/assets/teeth/tooth-47.png';
import tooth48 from '@/assets/teeth/tooth-48.png';

export const toothImages: Record<number, string> = {
  // Upper right (Q1)
  18: tooth18,
  17: tooth17,
  16: tooth16,
  15: tooth15,
  14: tooth14,
  13: tooth13,
  12: tooth12,
  11: tooth11,
  // Upper left (Q2)
  21: tooth21,
  22: tooth22,
  23: tooth23,
  24: tooth24,
  25: tooth25,
  26: tooth26,
  27: tooth27,
  28: tooth28,
  // Lower left (Q3)
  31: tooth31,
  32: tooth32,
  33: tooth33,
  34: tooth34,
  35: tooth35,
  36: tooth36,
  37: tooth37,
  38: tooth38,
  // Lower right (Q4)
  41: tooth41,
  42: tooth42,
  43: tooth43,
  44: tooth44,
  45: tooth45,
  46: tooth46,
  47: tooth47,
  48: tooth48,
};

// For deciduous teeth, we'll map them to similar permanent teeth
// Upper deciduous: 55-51, 61-65 → map to similar teeth
// Lower deciduous: 85-81, 71-75 → map to similar teeth
export const deciduousToothMapping: Record<number, number> = {
  // Upper right deciduous (55-51) → map to premolars/incisors
  55: 16, // Second molar → First molar
  54: 15, // First molar → Second premolar
  53: 13, // Canine → Canine
  52: 12, // Lateral incisor → Lateral incisor
  51: 11, // Central incisor → Central incisor
  // Upper left deciduous (61-65)
  61: 21, // Central incisor → Central incisor
  62: 22, // Lateral incisor → Lateral incisor
  63: 23, // Canine → Canine
  64: 25, // First molar → Second premolar
  65: 26, // Second molar → First molar
  // Lower left deciduous (71-75)
  71: 31, // Central incisor → Central incisor
  72: 32, // Lateral incisor → Lateral incisor
  73: 33, // Canine → Canine
  74: 35, // First molar → Second premolar
  75: 36, // Second molar → First molar
  // Lower right deciduous (81-85)
  81: 41, // Central incisor → Central incisor
  82: 42, // Lateral incisor → Lateral incisor
  83: 43, // Canine → Canine
  84: 45, // First molar → Second premolar
  85: 46, // Second molar → First molar
};

export function getToothImage(toothNumber: number): string | undefined {
  // Check if it's a permanent tooth
  if (toothImages[toothNumber]) {
    return toothImages[toothNumber];
  }
  // Check if it's a deciduous tooth and map it
  const mappedTooth = deciduousToothMapping[toothNumber];
  if (mappedTooth && toothImages[mappedTooth]) {
    return toothImages[mappedTooth];
  }
  return undefined;
}
