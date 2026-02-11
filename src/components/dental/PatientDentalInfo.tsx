import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PatientDentalInfoProps {
  patientId: string;
}

interface DentalInfo {
  is_implant_patient: boolean;
  has_dental_appliance: boolean;
  is_periodontal_patient: boolean;
  is_edentulous: boolean;
  is_finalized: boolean;
  diag_ocluzal: string;
  diag_parodontal: string;
  diag_ortodontic: string;
  diag_odontal: string;
  diag_chirurgical: string;
}

export function PatientDentalInfo({ patientId }: PatientDentalInfoProps) {
  const [info, setInfo] = useState<DentalInfo>({
    is_implant_patient: false,
    has_dental_appliance: false,
    is_periodontal_patient: false,
    is_edentulous: false,
    is_finalized: false,
    diag_ocluzal: '',
    diag_parodontal: '',
    diag_ortodontic: '',
    diag_odontal: '',
    diag_chirurgical: '',
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('patients')
        .select('is_implant_patient, has_dental_appliance, is_periodontal_patient, is_edentulous, is_finalized, diag_ocluzal, diag_parodontal, diag_ortodontic, diag_odontal, diag_chirurgical')
        .eq('id', patientId)
        .single();
      if (data) {
        setInfo({
          is_implant_patient: data.is_implant_patient ?? false,
          has_dental_appliance: data.has_dental_appliance ?? false,
          is_periodontal_patient: data.is_periodontal_patient ?? false,
          is_edentulous: data.is_edentulous ?? false,
          is_finalized: data.is_finalized ?? false,
          diag_ocluzal: data.diag_ocluzal ?? '',
          diag_parodontal: data.diag_parodontal ?? '',
          diag_ortodontic: data.diag_ortodontic ?? '',
          diag_odontal: data.diag_odontal ?? '',
          diag_chirurgical: data.diag_chirurgical ?? '',
        });
      }
    })();
  }, [patientId]);

  const save = async (updates: Partial<DentalInfo>) => {
    const newInfo = { ...info, ...updates };
    setInfo(newInfo);
    const { error } = await supabase
      .from('patients')
      .update(updates as any)
      .eq('id', patientId);
    if (error) {
      toast({ title: 'Eroare la salvare', variant: 'destructive' });
    }
  };

  const checkboxes = [
    { key: 'is_implant_patient' as const, label: 'Pacient implantat' },
    { key: 'has_dental_appliance' as const, label: 'Pacient cu aparat dentar' },
    { key: 'is_periodontal_patient' as const, label: 'Pacient parodontopat' },
    { key: 'is_edentulous' as const, label: 'Pacient edentat' },
    { key: 'is_finalized' as const, label: 'Pacient finalizat' },
  ];

  const diagFields = [
    { key: 'diag_ocluzal' as const, label: 'Diagnostic ocluzal' },
    { key: 'diag_parodontal' as const, label: 'Diagnostic parodontal' },
    { key: 'diag_ortodontic' as const, label: 'Diagnostic ortodontic' },
    { key: 'diag_odontal' as const, label: 'Diagnostic odontal' },
    { key: 'diag_chirurgical' as const, label: 'Diagnostic chirurgical' },
  ];

  return (
    <div className="space-y-4 rounded-xl border p-4 bg-muted/20">
      {/* Checkboxes */}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {checkboxes.map(cb => (
          <div key={cb.key} className="flex items-center gap-2">
            <Checkbox
              id={cb.key}
              checked={info[cb.key]}
              onCheckedChange={(checked) => save({ [cb.key]: !!checked })}
            />
            <Label htmlFor={cb.key} className="text-xs cursor-pointer">{cb.label}</Label>
          </div>
        ))}
      </div>

      {/* Diagnostics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {diagFields.map(df => (
          <div key={df.key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{df.label}</Label>
            <Input
              value={info[df.key]}
              onChange={e => setInfo(prev => ({ ...prev, [df.key]: e.target.value }))}
              onBlur={() => save({ [df.key]: info[df.key] || null } as any)}
              className="h-8 text-xs"
              placeholder={df.label}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
