export interface ToothStatusDef {
  name: string;
  color: string;
  dbValue: string;
}

export const TOOTH_STATUSES: ToothStatusDef[] = [
  { name: 'Sănătos', color: '#10B981', dbValue: 'healthy' },
  { name: 'Carie', color: '#EF4444', dbValue: 'cavity' },
  { name: 'Obt Foto', color: '#3B82F6', dbValue: 'filled' },
  { name: 'Coroană', color: '#F59E0B', dbValue: 'crown' },
  { name: 'Absent', color: '#6B7280', dbValue: 'missing' },
  { name: 'Implant', color: '#8B5CF6', dbValue: 'implant' },
  { name: 'OBT Canal', color: '#EC4899', dbValue: 'root_canal' },
  { name: 'Rest Radicular', color: '#F97316', dbValue: 'extraction_needed' },
];

export const STATUS_ENUM_TO_NAME: Record<string, string> = {};
export const STATUS_NAME_TO_ENUM: Record<string, string> = {};

TOOTH_STATUSES.forEach(s => {
  STATUS_ENUM_TO_NAME[s.dbValue] = s.name;
  STATUS_NAME_TO_ENUM[s.name] = s.dbValue;
});

// Alias
STATUS_NAME_TO_ENUM['RCR'] = 'extraction_needed';

export function getStatusHexColor(statusName: string): string | null {
  const found = TOOTH_STATUSES.find(s => s.name.toLowerCase() === statusName.toLowerCase());
  return found?.color || null;
}
