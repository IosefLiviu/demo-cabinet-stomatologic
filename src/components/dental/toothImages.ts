// Tooth images mapping using FDI notation - Realistic anatomical images with roots
// Upper right quadrant (Q1): 18-11
import tooth18 from '@/assets/teeth/new/tooth-18.png';
import tooth17 from '@/assets/teeth/new/tooth-17.png';
import tooth16 from '@/assets/teeth/new/tooth-16.png';
import tooth15 from '@/assets/teeth/new/tooth-15.png';
import tooth14 from '@/assets/teeth/new/tooth-14.png';
import tooth13 from '@/assets/teeth/new/tooth-13.png';
import tooth12 from '@/assets/teeth/new/tooth-12.png';
import tooth11 from '@/assets/teeth/new/tooth-11.png';

// Upper left quadrant (Q2): 21-28
import tooth21 from '@/assets/teeth/new/tooth-21.png';
import tooth22 from '@/assets/teeth/new/tooth-22.png';
import tooth23 from '@/assets/teeth/new/tooth-23.png';
import tooth24 from '@/assets/teeth/new/tooth-24.png';
import tooth25 from '@/assets/teeth/new/tooth-25.png';
import tooth26 from '@/assets/teeth/new/tooth-26.png';
import tooth27 from '@/assets/teeth/new/tooth-27.png';
import tooth28 from '@/assets/teeth/new/tooth-28.png';

// Lower left quadrant (Q3): 31-38
import tooth31 from '@/assets/teeth/new/tooth-31.png';
import tooth32 from '@/assets/teeth/new/tooth-32.png';
import tooth33 from '@/assets/teeth/new/tooth-33.png';
import tooth34 from '@/assets/teeth/new/tooth-34.png';
import tooth35 from '@/assets/teeth/new/tooth-35.png';
import tooth36 from '@/assets/teeth/new/tooth-36.png';
import tooth37 from '@/assets/teeth/new/tooth-37.png';
import tooth38 from '@/assets/teeth/new/tooth-38.png';

// Lower right quadrant (Q4): 48-41
import tooth41 from '@/assets/teeth/new/tooth-41.png';
import tooth42 from '@/assets/teeth/new/tooth-42.png';
import tooth43 from '@/assets/teeth/new/tooth-43.png';
import tooth44 from '@/assets/teeth/new/tooth-44.png';
import tooth45 from '@/assets/teeth/new/tooth-45.png';
import tooth46 from '@/assets/teeth/new/tooth-46.png';
import tooth47 from '@/assets/teeth/new/tooth-47.png';
import tooth48 from '@/assets/teeth/new/tooth-48.png';

// Deciduous (baby) teeth - reuse permanent tooth images as placeholders
// Upper right: 55-51 (map to premolars/incisors)
import tooth55old from '@/assets/teeth/tooth-55.png';
import tooth54old from '@/assets/teeth/tooth-54.png';
import tooth53old from '@/assets/teeth/tooth-53.png';
import tooth52old from '@/assets/teeth/tooth-52.png';
import tooth51old from '@/assets/teeth/tooth-51.png';

// Upper left: 61-65
import tooth61old from '@/assets/teeth/tooth-61.png';
import tooth62old from '@/assets/teeth/tooth-62.png';
import tooth63old from '@/assets/teeth/tooth-63.png';
import tooth64old from '@/assets/teeth/tooth-64.png';
import tooth65old from '@/assets/teeth/tooth-65.png';

// Lower left: 71-75
import tooth71old from '@/assets/teeth/tooth-71.png';
import tooth72old from '@/assets/teeth/tooth-72.png';
import tooth73old from '@/assets/teeth/tooth-73.png';
import tooth74old from '@/assets/teeth/tooth-74.png';
import tooth75old from '@/assets/teeth/tooth-75.png';

// Lower right: 81-85
import tooth81old from '@/assets/teeth/tooth-81.png';
import tooth82old from '@/assets/teeth/tooth-82.png';
import tooth83old from '@/assets/teeth/tooth-83.png';
import tooth84old from '@/assets/teeth/tooth-84.png';
import tooth85old from '@/assets/teeth/tooth-85.png';

export const toothImages: Record<number, string> = {
  // Upper right (Q1) - Permanent - NEW realistic images
  18: tooth18,
  17: tooth17,
  16: tooth16,
  15: tooth15,
  14: tooth14,
  13: tooth13,
  12: tooth12,
  11: tooth11,
  // Upper left (Q2) - Permanent - NEW realistic images
  21: tooth21,
  22: tooth22,
  23: tooth23,
  24: tooth24,
  25: tooth25,
  26: tooth26,
  27: tooth27,
  28: tooth28,
  // Lower left (Q3) - Permanent - NEW realistic images
  31: tooth31,
  32: tooth32,
  33: tooth33,
  34: tooth34,
  35: tooth35,
  36: tooth36,
  37: tooth37,
  38: tooth38,
  // Lower right (Q4) - Permanent - NEW realistic images
  41: tooth41,
  42: tooth42,
  43: tooth43,
  44: tooth44,
  45: tooth45,
  46: tooth46,
  47: tooth47,
  48: tooth48,
  // Deciduous - Upper right (55-51) - keep old images for now
  55: tooth55old,
  54: tooth54old,
  53: tooth53old,
  52: tooth52old,
  51: tooth51old,
  // Deciduous - Upper left (61-65)
  61: tooth61old,
  62: tooth62old,
  63: tooth63old,
  64: tooth64old,
  65: tooth65old,
  // Deciduous - Lower left (71-75)
  71: tooth71old,
  72: tooth72old,
  73: tooth73old,
  74: tooth74old,
  75: tooth75old,
  // Deciduous - Lower right (81-85)
  81: tooth81old,
  82: tooth82old,
  83: tooth83old,
  84: tooth84old,
  85: tooth85old,
};

export function getToothImage(toothNumber: number): string | undefined {
  return toothImages[toothNumber];
}
