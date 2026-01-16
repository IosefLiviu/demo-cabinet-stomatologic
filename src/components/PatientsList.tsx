import { useState } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import {
  Search,
  Plus,
  Phone,
  Mail,
  AlertTriangle,
  Edit,
  Trash2,
  User,
  Calendar,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Patient } from '@/hooks/usePatients';
import { cn } from '@/lib/utils';

interface PatientsListProps {
  patients: Patient[];
  loading: boolean;
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  onViewDetails: (patient: Patient) => void;
}

export function PatientsList({
  patients,
  loading,
  onEdit,
  onDelete,
  onAddNew,
  onViewDetails,
}: PatientsListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = searchQuery
    ? patients.filter(
        (p) =>
          p.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.phone.includes(searchQuery) ||
          (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : patients;

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Se încarcă pacienții...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Add */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Caută pacient (nume, telefon, email)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onAddNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Pacient nou
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[250px]">Pacient</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Vârstă</TableHead>
              <TableHead>Alerte medicale</TableHead>
              <TableHead>Înregistrat</TableHead>
              <TableHead className="w-[120px] text-right">Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? 'Nu s-au găsit pacienți pentru căutarea ta'
                    : 'Nu există pacienți înregistrați'}
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient) => (
                <TableRow
                  key={patient.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onViewDetails(patient)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {patient.last_name} {patient.first_name}
                        </div>
                        {patient.city && (
                          <div className="text-xs text-muted-foreground">
                            {patient.city}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {patient.phone}
                      </div>
                      {patient.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          {patient.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {patient.date_of_birth ? (
                      <span>{calculateAge(patient.date_of_birth)} ani</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {patient.allergies && patient.allergies.length > 0 && (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          {patient.allergies.length} alergi{patient.allergies.length === 1 ? 'e' : 'i'}
                        </Badge>
                      )}
                      {patient.medical_conditions && patient.medical_conditions.length > 0 && (
                        <Badge variant="secondary" className="text-xs bg-warning/20">
                          {patient.medical_conditions.length} afecțiun{patient.medical_conditions.length === 1 ? 'e' : 'i'}
                        </Badge>
                      )}
                      {(!patient.allergies || patient.allergies.length === 0) &&
                        (!patient.medical_conditions || patient.medical_conditions.length === 0) && (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(patient.created_at), 'd MMM yyyy', { locale: ro })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(patient)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ștergeți pacientul?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Această acțiune nu poate fi anulată. Toate datele pacientului{' '}
                              <strong>{patient.last_name} {patient.first_name}</strong> vor fi
                              șterse permanent, inclusiv istoricul medical și programările.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anulează</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(patient.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Șterge
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        {filteredPatients.length} pacient{filteredPatients.length !== 1 ? 'i' : ''} 
        {searchQuery && ` găsiți din ${patients.length} total`}
      </div>
    </div>
  );
}
