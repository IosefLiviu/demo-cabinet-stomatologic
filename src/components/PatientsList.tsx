import { useState, useMemo } from 'react';
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
  Upload,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Send,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImportPatientsDialog } from './ImportPatientsDialog';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Patient } from '@/hooks/usePatients';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useSendWhatsApp } from '@/hooks/useSendWhatsApp';
import { useAppSettings } from '@/hooks/useAppSettings';
import { PatientReminderDialog } from './PatientReminderDialog';
import { useNewPatientStatus } from '@/hooks/useNewPatientStatus';

interface PatientsListProps {
  patients: Patient[];
  loading: boolean;
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  onViewDetails: (patient: Patient) => void;
  onRefetch?: () => void;
}

const PATIENTS_PER_PAGE = 10;

type SortField = 'name' | 'phone' | 'age' | 'created_at' | null;
type SortDirection = 'asc' | 'desc';

export function PatientsList({
  patients,
  loading,
  onEdit,
  onDelete,
  onAddNew,
  onViewDetails,
  onRefetch,
}: PatientsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // WhatsApp dialog state
  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false);
  const [selectedPatientForWhatsApp, setSelectedPatientForWhatsApp] = useState<Patient | null>(null);
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const { sendMessage, isSending } = useSendWhatsApp();
  const { getSetting } = useAppSettings();
  const { isNewPatient } = useNewPatientStatus();
  
  // Reminder dialog state
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedPatientForReminder, setSelectedPatientForReminder] = useState<Patient | null>(null);
  
  const DEFAULT_DIRECT_MESSAGE = "Bună ziua, {nume}! Vă contactăm de la Perfect Smile Glim. Cum vă putem ajuta?";

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

  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patients;
    
    const lowerQuery = searchQuery.toLowerCase().trim();
    const queryWords = lowerQuery.split(/\s+/).filter(word => word.length > 0);
    
    return patients.filter((p) => {
      const firstName = p.first_name.toLowerCase();
      const lastName = p.last_name.toLowerCase();
      const fullName = `${firstName} ${lastName}`;
      const reversedName = `${lastName} ${firstName}`;
      const phone = p.phone || '';
      const email = (p.email || '').toLowerCase();
      
      // If single word, check if it appears in any field
      if (queryWords.length <= 1) {
        return (
          firstName.includes(lowerQuery) ||
          lastName.includes(lowerQuery) ||
          phone.includes(searchQuery) ||
          email.includes(lowerQuery)
        );
      }
      
      // For multiple words, check if ALL words appear in name (any order)
      const allWordsMatch = queryWords.every(word =>
        firstName.includes(word) ||
        lastName.includes(word)
      );
      
      // Also check direct full name match in either order
      const directMatch = 
        fullName.includes(lowerQuery) ||
        reversedName.includes(lowerQuery);
      
      return allWordsMatch || directMatch || phone.includes(searchQuery) || email.includes(lowerQuery);
    });
  }, [patients, searchQuery]);

  const sortedPatients = useMemo(() => {
    if (!sortField) return filteredPatients;
    
    return [...filteredPatients].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
          break;
        case 'phone':
          comparison = a.phone.localeCompare(b.phone);
          break;
        case 'age':
          const ageA = calculateAge(a.date_of_birth) ?? -1;
          const ageB = calculateAge(b.date_of_birth) ?? -1;
          comparison = ageA - ageB;
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredPatients, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedPatients.length / PATIENTS_PER_PAGE);
  
  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * PATIENTS_PER_PAGE;
    return sortedPatients.slice(startIndex, startIndex + PATIENTS_PER_PAGE);
  }, [sortedPatients, currentPage]);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3.5 w-3.5 text-primary" />
      : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
  };

  const handleOpenWhatsAppDialog = (patient: Patient) => {
    setSelectedPatientForWhatsApp(patient);
    
    // Get template and replace {nume} with patient name
    const template = getSetting("whatsapp_direct_message_template") || DEFAULT_DIRECT_MESSAGE;
    const patientName = `${patient.last_name} ${patient.first_name}`;
    const prefilledMessage = template.replace(/{nume}/g, patientName);
    
    setWhatsAppMessage(prefilledMessage);
    setWhatsAppDialogOpen(true);
  };

  const handleSendWhatsApp = () => {
    if (!selectedPatientForWhatsApp) return;
    
    const patientName = `${selectedPatientForWhatsApp.last_name} ${selectedPatientForWhatsApp.first_name}`;
    
    // Use approved template for initiating conversation
    sendMessage({
      to: selectedPatientForWhatsApp.phone,
      patientId: selectedPatientForWhatsApp.id,
      patientName: patientName,
      templateType: "direct",
      templateVariables: {
        name: patientName,
      },
    });
    
    setWhatsAppDialogOpen(false);
    setSelectedPatientForWhatsApp(null);
    setWhatsAppMessage('');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="p-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="hidden md:block h-4 w-28" />
                <Skeleton className="hidden md:block h-4 w-16" />
                <div className="flex gap-1 ml-auto">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
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
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={onAddNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Pacient nou
          </Button>
        </div>
      </div>

      <ImportPatientsDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onSuccess={() => {
          setShowImportDialog(false);
          onRefetch?.();
        }}
      />

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead
                className="w-[250px] cursor-pointer hover:bg-muted/80 transition-colors text-xs uppercase tracking-wide font-semibold text-muted-foreground"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Pacient
                  <SortIcon field="name" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/80 transition-colors text-xs uppercase tracking-wide font-semibold text-muted-foreground"
                onClick={() => handleSort('phone')}
              >
                <div className="flex items-center gap-2">
                  Contact
                  <SortIcon field="phone" />
                </div>
              </TableHead>
              <TableHead
                className="hidden md:table-cell cursor-pointer hover:bg-muted/80 transition-colors text-xs uppercase tracking-wide font-semibold text-muted-foreground"
                onClick={() => handleSort('age')}
              >
                <div className="flex items-center gap-2">
                  Vârstă
                  <SortIcon field="age" />
                </div>
              </TableHead>
              <TableHead className="hidden lg:table-cell text-xs uppercase tracking-wide font-semibold text-muted-foreground">Alerte medicale</TableHead>
              <TableHead
                className="hidden md:table-cell cursor-pointer hover:bg-muted/80 transition-colors text-xs uppercase tracking-wide font-semibold text-muted-foreground"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-2">
                  Înregistrat
                  <SortIcon field="created_at" />
                </div>
              </TableHead>
              <TableHead className="w-[100px] sm:w-[120px] text-right text-xs uppercase tracking-wide font-semibold text-muted-foreground">Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? 'Nu s-au găsit pacienți pentru căutarea ta'
                    : 'Nu există pacienți înregistrați'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedPatients.map((patient) => (
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
                        <div className="font-medium flex items-center gap-2">
                          {patient.last_name} {patient.first_name}
                          {isNewPatient(patient.id) && (
                            <Badge className="bg-green-500 hover:bg-green-500 text-white text-[10px] px-1.5 py-0">Nou</Badge>
                          )}
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
                  <TableCell className="hidden md:table-cell">
                    {patient.date_of_birth ? (
                      <span>{calculateAge(patient.date_of_birth)} ani</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
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
                  <TableCell className="hidden md:table-cell">
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
                        className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                        onClick={() => {
                          setSelectedPatientForReminder(patient);
                          setReminderDialogOpen(true);
                        }}
                        title="Setează reminder rechemare"
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleOpenWhatsAppDialog(patient)}
                        title="Trimite mesaj WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
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

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          {filteredPatients.length} pacient{filteredPatients.length !== 1 ? 'i' : ''} 
          {searchQuery && ` găsiți din ${patients.length} total`}
          {totalPages > 1 && ` • Pagina ${currentPage} din ${totalPages}`}
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              Următor
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* WhatsApp Dialog */}
      <Dialog open={whatsAppDialogOpen} onOpenChange={setWhatsAppDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Trimite mesaj WhatsApp
            </DialogTitle>
            <DialogDescription>
              {selectedPatientForWhatsApp && (
                <>
                  Către: <strong>{selectedPatientForWhatsApp.last_name} {selectedPatientForWhatsApp.first_name}</strong>
                  <br />
                  Telefon: {selectedPatientForWhatsApp.phone}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Scrieți mesajul aici..."
              value={whatsAppMessage}
              onChange={(e) => setWhatsAppMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWhatsAppDialogOpen(false)}
              disabled={isSending}
            >
              Anulează
            </Button>
            <Button
              onClick={handleSendWhatsApp}
              disabled={!whatsAppMessage.trim() || isSending}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4" />
              {isSending ? 'Se trimite...' : 'Trimite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reminder Dialog */}
      {selectedPatientForReminder && (
        <PatientReminderDialog
          open={reminderDialogOpen}
          onClose={() => {
            setReminderDialogOpen(false);
            setSelectedPatientForReminder(null);
          }}
          patientId={selectedPatientForReminder.id}
          patientName={`${selectedPatientForReminder.last_name} ${selectedPatientForReminder.first_name}`}
        />
      )}
    </div>
  );
}
