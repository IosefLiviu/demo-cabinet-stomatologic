// Laboratory work types with prices per laboratory
export interface LabWorkType {
  id: string;
  name: string;
  priceNecula: number | null; // Price for Lab Necula (microdent)
  priceChisinau: number | null; // Price for Lab Chișinău (smile dent)
  category?: string;
}

export const LAB_WORK_TYPES: LabWorkType[] = [
  // Coroane simple
  { id: 'coroana_metalo_ceramica', name: 'Coroana metalo-ceramica', priceNecula: 200, priceChisinau: 250, category: 'Coroane' },
  { id: 'coroana_integral_zirconiu', name: 'Coroana integral zirconiu / Full zirconiu', priceNecula: 300, priceChisinau: 300, category: 'Coroane' },
  { id: 'coroana_provizorie_cad_cam', name: 'Coroana provizorie CAD-CAM / PMMA', priceNecula: 90, priceChisinau: 100, category: 'Coroane' },
  
  // Coroane pe implant
  { id: 'coroana_metalo_ceramica_implant', name: 'Coroana metalo-ceramica implant', priceNecula: 300, priceChisinau: 320, category: 'Implant' },
  { id: 'coroana_zirconiu_ceramica_implant', name: 'Coroana zirconiu-ceramica implant', priceNecula: 350, priceChisinau: 370, category: 'Implant' },
  { id: 'pmma_implant_insurubat', name: 'PMMA implant înșurubat', priceNecula: 150, priceChisinau: 170, category: 'Implant' },
  { id: 'arcada_acrilica_implant', name: '1 Arcada acrilica pe implant', priceNecula: 3000, priceChisinau: 1225, category: 'Implant' },
  { id: 'arcada_metalo_ceramica_implant', name: '1 Arcada metalo-ceramica pe implant', priceNecula: 4000, priceChisinau: 3900, category: 'Implant' },
  { id: 'arcada_zirconiu_implant', name: '1 Arcada Zirconiu pe implant', priceNecula: null, priceChisinau: 7500, category: 'Implant' },
  
  // Reconstructii
  { id: 'reconstructie_rcr_pivot_turnat', name: 'Reconstructie corono-rad, pivot turnat', priceNecula: 80, priceChisinau: null, category: 'Reconstructii' },
  { id: 'reconstructie_rcr_zirconiu', name: 'Reconstructie corono-rad, zirconiu', priceNecula: 300, priceChisinau: null, category: 'Reconstructii' },
  
  // Gutiere
  { id: 'gutiera_bruxism', name: 'Gutiera pentru bruxism/arcada', priceNecula: 120, priceChisinau: null, category: 'Gutiere' },
  { id: 'gutiera_albire', name: 'Gutiera albire/arcada', priceNecula: 120, priceChisinau: null, category: 'Gutiere' },
  
  // Proteze
  { id: 'proteza_acrilica', name: 'Proteza Acrilica totala/partiala', priceNecula: 600, priceChisinau: 450, category: 'Proteze' },
  { id: 'rebazare_proteza', name: 'Rebazare proteza', priceNecula: 200, priceChisinau: null, category: 'Proteze' },
];

// Group work types by category for display
export function getWorkTypesByCategory(): Record<string, LabWorkType[]> {
  return LAB_WORK_TYPES.reduce((acc, workType) => {
    const category = workType.category || 'Altele';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(workType);
    return acc;
  }, {} as Record<string, LabWorkType[]>);
}

// Get price for a specific work type and laboratory
export function getLabPrice(workTypeId: string, laboratory: string): number | null {
  const workType = LAB_WORK_TYPES.find(w => w.id === workTypeId);
  if (!workType) return null;
  
  if (laboratory === 'Necula') {
    return workType.priceNecula;
  } else if (laboratory === 'Chișinău') {
    return workType.priceChisinau;
  }
  return null;
}

// Get work type by ID
export function getWorkTypeById(id: string): LabWorkType | undefined {
  return LAB_WORK_TYPES.find(w => w.id === id);
}

// Get work type by name (for backwards compatibility)
export function getWorkTypeByName(name: string): LabWorkType | undefined {
  return LAB_WORK_TYPES.find(w => w.name === name);
}

// Laboratories
export const LABORATORIES = [
  { id: 'necula', name: 'Necula', fullName: 'Lab. Necula (microdent)' },
  { id: 'chisinau', name: 'Chișinău', fullName: 'Lab. Chișinău (smile dent)' },
];
