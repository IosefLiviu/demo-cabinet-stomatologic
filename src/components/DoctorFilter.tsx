import { Doctor } from '@/hooks/useDoctors';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Stethoscope } from 'lucide-react';

interface DoctorFilterProps {
  doctors: Doctor[];
  selectedDoctorId: string | null;
  onDoctorChange: (doctorId: string | null) => void;
}

export function DoctorFilter({ doctors, selectedDoctorId, onDoctorChange }: DoctorFilterProps) {
  const activeDoctors = doctors.filter(d => d.is_active);

  return (
    <Select
      value={selectedDoctorId || "all"}
      onValueChange={(value) => onDoctorChange(value === "all" ? null : value)}
    >
      <SelectTrigger className="w-[180px] gap-2">
        <Stethoscope className="h-4 w-4 text-muted-foreground" />
        <SelectValue placeholder="Toți doctorii" />
      </SelectTrigger>
      <SelectContent className="bg-popover z-50">
        <SelectItem value="all">Toți doctorii</SelectItem>
        {activeDoctors.map((doctor) => (
          <SelectItem key={doctor.id} value={doctor.id}>
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: doctor.color }}
              />
              {doctor.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
