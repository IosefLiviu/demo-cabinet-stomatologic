import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Patient, PatientInsert } from '@/hooks/usePatients';

interface PatientFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (patient: PatientInsert) => Promise<any>;
  editingPatient?: Patient;
}

export function PatientForm({
  open,
  onClose,
  onSubmit,
  editingPatient,
}: PatientFormProps) {
  const [formData, setFormData] = useState<PatientInsert>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: undefined,
    address: '',
    city: '',
    cnp: '',
    allergies: [],
    medical_conditions: [],
    medications: [],
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
  });

  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingPatient) {
      setFormData({
        first_name: editingPatient.first_name,
        last_name: editingPatient.last_name,
        phone: editingPatient.phone,
        email: editingPatient.email || '',
        date_of_birth: editingPatient.date_of_birth || '',
        gender: editingPatient.gender,
        address: editingPatient.address || '',
        city: editingPatient.city || '',
        cnp: editingPatient.cnp || '',
        allergies: editingPatient.allergies || [],
        medical_conditions: editingPatient.medical_conditions || [],
        medications: editingPatient.medications || [],
        emergency_contact_name: editingPatient.emergency_contact_name || '',
        emergency_contact_phone: editingPatient.emergency_contact_phone || '',
        notes: editingPatient.notes || '',
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        date_of_birth: '',
        gender: undefined,
        address: '',
        city: '',
        cnp: '',
        allergies: [],
        medical_conditions: [],
        medications: [],
        emergency_contact_name: '',
        emergency_contact_phone: '',
        notes: '',
      });
    }
  }, [editingPatient, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const result = await onSubmit(formData);
    
    setIsSubmitting(false);
    if (result) {
      onClose();
    }
  };

  const addToArray = (
    field: 'allergies' | 'medical_conditions' | 'medications',
    value: string,
    setValue: (v: string) => void
  ) => {
    if (value.trim()) {
      setFormData({
        ...formData,
        [field]: [...(formData[field] || []), value.trim()],
      });
      setValue('');
    }
  };

  const removeFromArray = (
    field: 'allergies' | 'medical_conditions' | 'medications',
    index: number
  ) => {
    setFormData({
      ...formData,
      [field]: formData[field]?.filter((_, i) => i !== index) || [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingPatient ? 'Editare pacient' : 'Pacient nou'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Date personale
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="last_name">Nume *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  placeholder="Popescu"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="first_name">Prenume *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  placeholder="Ion"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="07xx xxx xxx"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@exemplu.ro"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Data nașterii</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) =>
                    setFormData({ ...formData, date_of_birth: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gen</Label>
                <Select
                  value={formData.gender || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gender: value as 'M' | 'F' | 'other' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Feminin</SelectItem>
                    <SelectItem value="other">Altul</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnp">CNP</Label>
                <Input
                  id="cnp"
                  value={formData.cnp}
                  onChange={(e) =>
                    setFormData({ ...formData, cnp: e.target.value })
                  }
                  placeholder="1234567890123"
                  maxLength={13}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="address">Adresă</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Str. Exemplu, nr. 10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Oraș</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="București"
                />
              </div>
            </div>
          </div>

          {/* Medical Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Informații medicale
            </h3>

            {/* Allergies */}
            <div className="space-y-2">
              <Label>Alergii</Label>
              <div className="flex gap-2">
                <Input
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Adaugă alergie"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('allergies', newAllergy, setNewAllergy);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addToArray('allergies', newAllergy, setNewAllergy)}
                >
                  Adaugă
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.allergies?.map((allergy, index) => (
                  <Badge
                    key={index}
                    variant="destructive"
                    className="gap-1 pr-1"
                  >
                    {allergy}
                    <button
                      type="button"
                      onClick={() => removeFromArray('allergies', index)}
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Medical Conditions */}
            <div className="space-y-2">
              <Label>Afecțiuni medicale</Label>
              <div className="flex gap-2">
                <Input
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  placeholder="Adaugă afecțiune"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('medical_conditions', newCondition, setNewCondition);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addToArray('medical_conditions', newCondition, setNewCondition)}
                >
                  Adaugă
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.medical_conditions?.map((condition, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="gap-1 pr-1 bg-warning/20 text-warning-foreground"
                  >
                    {condition}
                    <button
                      type="button"
                      onClick={() => removeFromArray('medical_conditions', index)}
                      className="ml-1 rounded-full p-0.5 hover:bg-warning/30"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Medications */}
            <div className="space-y-2">
              <Label>Medicamente curente</Label>
              <div className="flex gap-2">
                <Input
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  placeholder="Adaugă medicament"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('medications', newMedication, setNewMedication);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addToArray('medications', newMedication, setNewMedication)}
                >
                  Adaugă
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.medications?.map((medication, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="gap-1 pr-1"
                  >
                    {medication}
                    <button
                      type="button"
                      onClick={() => removeFromArray('medications', index)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Contact de urgență
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Nume contact</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) =>
                    setFormData({ ...formData, emergency_contact_name: e.target.value })
                  }
                  placeholder="Nume și prenume"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Telefon contact</Label>
                <Input
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, emergency_contact_phone: e.target.value })
                  }
                  placeholder="07xx xxx xxx"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observații generale</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Note adiționale despre pacient..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Anulează
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Se salvează...' : editingPatient ? 'Salvează' : 'Adaugă pacient'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
