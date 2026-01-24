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

// Deciduous (baby) teeth - Upper right: 55-51
import tooth55 from '@/assets/teeth/tooth-55.png';
import tooth54 from '@/assets/teeth/tooth-54.png';
import tooth53 from '@/assets/teeth/tooth-53.png';
import tooth52 from '@/assets/teeth/tooth-52.png';
import tooth51 from '@/assets/teeth/tooth-51.png';

// Deciduous (baby) teeth - Upper left: 61-65
import tooth61 from '@/assets/teeth/tooth-61.png';
import tooth62 from '@/assets/teeth/tooth-62.png';
import tooth63 from '@/assets/teeth/tooth-63.png';
import tooth64 from '@/assets/teeth/tooth-64.png';
import tooth65 from '@/assets/teeth/tooth-65.png';

// Deciduous (baby) teeth - Lower left: 71-75
import tooth71 from '@/assets/teeth/tooth-71.png';
import tooth72 from '@/assets/teeth/tooth-72.png';
import tooth73 from '@/assets/teeth/tooth-73.png';
import tooth74 from '@/assets/teeth/tooth-74.png';
import tooth75 from '@/assets/teeth/tooth-75.png';

// Deciduous (baby) teeth - Lower right: 81-85
import tooth81 from '@/assets/teeth/tooth-81.png';
import tooth82 from '@/assets/teeth/tooth-82.png';
import tooth83 from '@/assets/teeth/tooth-83.png';
import tooth84 from '@/assets/teeth/tooth-84.png';
import tooth85 from '@/assets/teeth/tooth-85.png';

export const toothImages: Record<number, string> = {
  // Upper right (Q1) - Permanent
  18: tooth18,
  17: tooth17,
  16: tooth16,
  15: tooth15,
  14: tooth14,
  13: tooth13,
  12: tooth12,
  11: tooth11,
  // Upper left (Q2) - Permanent
  21: tooth21,
  22: tooth22,
  23: tooth23,
  24: tooth24,
  25: tooth25,
  26: tooth26,
  27: tooth27,
  28: tooth28,
  // Lower left (Q3) - Permanent
  31: tooth31,
  32: tooth32,
  33: tooth33,
  34: tooth34,
  35: tooth35,
  36: tooth36,
  37: tooth37,
  38: tooth38,
  // Lower right (Q4) - Permanent
  41: tooth41,
  42: tooth42,
  43: tooth43,
  44: tooth44,
  45: tooth45,
  46: tooth46,
  47: tooth47,
  48: tooth48,
  // Deciduous - Upper right (55-51)
  55: tooth55,
  54: tooth54,
  53: tooth53,
  52: tooth52,
  51: tooth51,
  // Deciduous - Upper left (61-65)
  61: tooth61,
  62: tooth62,
  63: tooth63,
  64: tooth64,
  65: tooth65,
  // Deciduous - Lower left (71-75)
  71: tooth71,
  72: tooth72,
  73: tooth73,
  74: tooth74,
  75: tooth75,
  // Deciduous - Lower right (81-85)
  81: tooth81,
  82: tooth82,
  83: tooth83,
  84: tooth84,
  85: tooth85,
};

export function getToothImage(toothNumber: number): string | undefined {
  return toothImages[toothNumber];
}
