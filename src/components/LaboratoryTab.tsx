import { useState } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Plus, Check, Trash2, Search, Send, ArrowDownToLine, FlaskConical, RotateCcw, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLabSamples, LabSampleInsert, LabSampleStatus } from '@/hooks/useLabSamples';
import { Patient } from '@/hooks/usePatients';
import { useCabinets } from '@/hooks/useCabinets';

interface Doctor {
  id: string;
  name: string;
  is_active: boolean;
}

interface LaboratoryTabProps {
  patients: Patient[];
  doctors: Doctor[];
}

const COMMON_WORK_TYPES = [
  'MCTF',
  'Pivot Metal',
  'Pivot Zirconiu',
  'PMMA',
  'Coroană ceramică',
  'Coroană zirconiu',
  'Schelet mobil',
  'Proteza totală',
  'Arcada',
  'KTF',
  'RCR',
];

const COMMON_LABORATORIES = [
  'Chișinău',
  'Necula',
];

const VITA_COLORS = [
  'A1', 'A2', 'A3', 'A3.5', 'A4',
  'B1', 'B2', 'B3', 'B4',
  'C1', 'C2', 'C3', 'C4',
  'D2', 'D3', 'D4',
];

type TabStatus = 'sent' | 'returned' | 'trial' | 'finalized';

export function LaboratoryTab({ patients, doctors }: LaboratoryTabProps) {
  const { samples, loading, addSample, markAsReturned, markAsTrial, markAsFinalized, resendToLab, deleteSample } = useLabSamples();
  const { cabinets } = useCabinets();
  const [activeSubTab, setActiveSubTab] = useState<TabStatus>('sent');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showResendDialog, setShowResendDialog] = useState(false);
  const [showTrialDialog, setShowTrialDialog] = useState(false);
  const [trialSampleId, setTrialSampleId] = useState<string | null>(null);
  const [selectedCabinetId, setSelectedCabinetId] = useState<string>('');
  const [resendSampleId, setResendSampleId] = useState<string | null>(null);
  const [resendReason, setResendReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state for new sample
  const [formData, setFormData] = useState<LabSampleInsert>({
    patient_name: '',
    work_type: '',
    zone_quadrant: '',
    sample_date: format(new Date(), 'yyyy-MM-dd'),
    expected_return_date: '',
    laboratory_name: '',
    doctor_id: '',
    notes: '',
    vita_color: '',
  });

  const activeDoctors = doctors.filter(d => d.is_active);
  const activeCabinets = cabinets.filter(c => c.is_active);

  // Filter samples by status - resent samples show in "sent" tab as they are back in lab
  const sentSamples = samples.filter(s => s.status === 'sent' || s.status === 'resent');
  const returnedSamples = samples.filter(s => s.status === 'returned');
  const trialSamples = samples.filter(s => s.status === 'trial');
  const finalizedSamples = samples.filter(s => s.status === 'finalized');

  const filterSamples = (sampleList: typeof samples) => {
    return sampleList.filter(s =>
      s.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.work_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.laboratory_name && s.laboratory_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const filteredSentSamples = filterSamples(sentSamples);
  const filteredReturnedSamples = filterSamples(returnedSamples);
  const filteredTrialSamples = filterSamples(trialSamples);
  const filteredFinalizedSamples = filterSamples(finalizedSamples);

  const filteredPatients = patients.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    return fullName.includes(patientSearch.toLowerCase());
  });

  const resetForm = () => {
    setFormData({
      patient_name: '',
      work_type: '',
      zone_quadrant: '',
      sample_date: format(new Date(), 'yyyy-MM-dd'),
      expected_return_date: '',
      laboratory_name: '',
      doctor_id: '',
      notes: '',
      vita_color: '',
    });
    setPatientSearch('');
  };

  const handleAddSample = async () => {
    if (!formData.patient_name || !formData.work_type) {
      return;
    }

    await addSample(formData);
    setShowAddDialog(false);
    resetForm();
  };

  const handleMarkAsReturned = async (id: string) => {
    await markAsReturned(id);
  };

  const handleOpenTrialDialog = (id: string) => {
    setTrialSampleId(id);
    setSelectedCabinetId('');
    setShowTrialDialog(true);
  };

  const handleMarkAsTrial = async () => {
    if (!trialSampleId || !selectedCabinetId) {
      return;
    }
    await markAsTrial(trialSampleId, parseInt(selectedCabinetId));
    setShowTrialDialog(false);
    setTrialSampleId(null);
    setSelectedCabinetId('');
  };

  const handleMarkAsFinalized = async (id: string) => {
    await markAsFinalized(id);
  };

  const handleOpenResendDialog = (id: string) => {
    setResendSampleId(id);
    setResendReason('');
    setShowResendDialog(true);
  };

  const handleResend = async () => {
    if (!resendSampleId || !resendReason.trim()) {
      return;
    }
    await resendToLab(resendSampleId, resendReason.trim());
    setShowResendDialog(false);
    setResendSampleId(null);
    setResendReason('');
  };

  const handleDelete = async (id: string) => {
    await deleteSample(id);
    setDeleteConfirmId(null);
  };

  const handleSelectPatient = (patient: Patient) => {
    setFormData(prev => ({
      ...prev,
      patient_id: patient.id,
      patient_name: `${patient.first_name} ${patient.last_name}`,
    }));
    setPatientSearch('');
  };

  const getDoctorName = (doctorId: string | null) => {
    if (!doctorId) return '-';
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor?.name || '-';
  };

  const getCabinetName = (cabinetId: number | null) => {
    if (!cabinetId) return '-';
    const cabinet = cabinets.find(c => c.id === cabinetId);
    return cabinet?.name || '-';
  };

  const getStatusBadge = (status: LabSampleStatus) => {
    const statusConfig: Record<LabSampleStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      sent: { label: 'Trimis', variant: 'default' },
      resent: { label: 'Retrimis', variant: 'destructive' },
      returned: { label: 'Primit', variant: 'secondary' },
      trial: { label: 'La Probă', variant: 'outline' },
      finalized: { label: 'Finalizat', variant: 'secondary' },
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <span>Laborator</span>
              <Badge variant="secondary" className="ml-2">
                {sentSamples.length} în laborator
              </Badge>
              <Badge variant="outline" className="ml-1">
                {trialSamples.length} la probă
              </Badge>
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Caută..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-[200px]"
                />
              </div>
              <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Trimite Probă
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as TabStatus)}>
            <TabsList className="mb-4">
              <TabsTrigger value="sent" className="gap-2">
                <Send className="h-4 w-4" />
                La Laborator ({sentSamples.length})
              </TabsTrigger>
              <TabsTrigger value="returned" className="gap-2">
                <ArrowDownToLine className="h-4 w-4" />
                Primite ({returnedSamples.length})
              </TabsTrigger>
              <TabsTrigger value="trial" className="gap-2">
                <FlaskConical className="h-4 w-4" />
                La Probă ({trialSamples.length})
              </TabsTrigger>
              <TabsTrigger value="finalized" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Finalizate ({finalizedSamples.length})
              </TabsTrigger>
            </TabsList>

            {/* Tab: La Laborator (sent + resent) */}
            <TabsContent value="sent">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Se încarcă...</div>
              ) : filteredSentSamples.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Nicio probă găsită' : 'Nu există probe la laborator'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Pacient</TableHead>
                        <TableHead>Tip Lucrare</TableHead>
                        <TableHead>Zona/Cadran</TableHead>
                        <TableHead>Culoare Vita</TableHead>
                        <TableHead>Data Gata</TableHead>
                        <TableHead>Laborator</TableHead>
                        <TableHead>Medic</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSentSamples.map((sample) => (
                        <TableRow key={sample.id}>
                          <TableCell>{getStatusBadge(sample.status)}</TableCell>
                          <TableCell>
                            {format(new Date(sample.resend_date || sample.sample_date), 'dd.MM.yyyy', { locale: ro })}
                          </TableCell>
                          <TableCell className="font-medium">{sample.patient_name}</TableCell>
                          <TableCell>{sample.work_type}</TableCell>
                          <TableCell>{sample.zone_quadrant || '-'}</TableCell>
                          <TableCell>{sample.vita_color || '-'}</TableCell>
                          <TableCell>
                            {sample.expected_return_date
                              ? format(new Date(sample.expected_return_date), 'dd.MM.yyyy', { locale: ro })
                              : '-'}
                          </TableCell>
                          <TableCell>{sample.laboratory_name || '-'}</TableCell>
                          <TableCell>{getDoctorName(sample.doctor_id)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleMarkAsReturned(sample.id)}
                                title="Marchează ca primită"
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirmId(sample.id)}
                                title="Șterge"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Tab: Primite */}
            <TabsContent value="returned">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Se încarcă...</div>
              ) : filteredReturnedSamples.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Nicio probă găsită' : 'Nu există probe primite'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data Trimitere</TableHead>
                        <TableHead>Pacient</TableHead>
                        <TableHead>Tip Lucrare</TableHead>
                        <TableHead>Culoare Vita</TableHead>
                        <TableHead>Laborator</TableHead>
                        <TableHead>Medic</TableHead>
                        <TableHead>Data Primire</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReturnedSamples.map((sample) => (
                        <TableRow key={sample.id}>
                          <TableCell>
                            {format(new Date(sample.sample_date), 'dd.MM.yyyy', { locale: ro })}
                          </TableCell>
                          <TableCell className="font-medium">{sample.patient_name}</TableCell>
                          <TableCell>{sample.work_type}</TableCell>
                          <TableCell>{sample.vita_color || '-'}</TableCell>
                          <TableCell>{sample.laboratory_name || '-'}</TableCell>
                          <TableCell>{getDoctorName(sample.doctor_id)}</TableCell>
                          <TableCell>
                            {sample.actual_return_date
                              ? format(new Date(sample.actual_return_date), 'dd.MM.yyyy', { locale: ro })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenTrialDialog(sample.id)}
                                title="Trimite la cabinet pentru probă"
                              >
                                <FlaskConical className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirmId(sample.id)}
                                title="Șterge"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Tab: La Probă */}
            <TabsContent value="trial">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Se încarcă...</div>
              ) : filteredTrialSamples.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Nicio probă găsită' : 'Nu există probe la probă client'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data Probă</TableHead>
                        <TableHead>Pacient</TableHead>
                        <TableHead>Tip Lucrare</TableHead>
                        <TableHead>Zona/Cadran</TableHead>
                        <TableHead>Culoare Vita</TableHead>
                        <TableHead>Cabinet</TableHead>
                        <TableHead>Laborator</TableHead>
                        <TableHead>Medic</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTrialSamples.map((sample) => (
                        <TableRow key={sample.id}>
                          <TableCell>
                            {sample.trial_date
                              ? format(new Date(sample.trial_date), 'dd.MM.yyyy', { locale: ro })
                              : '-'}
                          </TableCell>
                          <TableCell className="font-medium">{sample.patient_name}</TableCell>
                          <TableCell>{sample.work_type}</TableCell>
                          <TableCell>{sample.zone_quadrant || '-'}</TableCell>
                          <TableCell>{sample.vita_color || '-'}</TableCell>
                          <TableCell>{getCabinetName(sample.cabinet_id)}</TableCell>
                          <TableCell>{sample.laboratory_name || '-'}</TableCell>
                          <TableCell>{getDoctorName(sample.doctor_id)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleMarkAsFinalized(sample.id)}
                                title="Marchează ca finalizat"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenResendDialog(sample.id)}
                                title="Retrimite la laborator"
                              >
                                <RotateCcw className="h-4 w-4 text-orange-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirmId(sample.id)}
                                title="Șterge"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Tab: Finalizate */}
            <TabsContent value="finalized">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Se încarcă...</div>
              ) : filteredFinalizedSamples.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Nicio probă găsită' : 'Nu există lucrări finalizate'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data Finalizare</TableHead>
                        <TableHead>Pacient</TableHead>
                        <TableHead>Tip Lucrare</TableHead>
                        <TableHead>Zona/Cadran</TableHead>
                        <TableHead>Culoare Vita</TableHead>
                        <TableHead>Laborator</TableHead>
                        <TableHead>Medic</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFinalizedSamples.map((sample) => (
                        <TableRow key={sample.id}>
                          <TableCell>
                            {sample.finalized_date
                              ? format(new Date(sample.finalized_date), 'dd.MM.yyyy', { locale: ro })
                              : '-'}
                          </TableCell>
                          <TableCell className="font-medium">{sample.patient_name}</TableCell>
                          <TableCell>{sample.work_type}</TableCell>
                          <TableCell>{sample.zone_quadrant || '-'}</TableCell>
                          <TableCell>{sample.vita_color || '-'}</TableCell>
                          <TableCell>{sample.laboratory_name || '-'}</TableCell>
                          <TableCell>{getDoctorName(sample.doctor_id)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirmId(sample.id)}
                              title="Șterge"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Sample Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Trimite Probă la Laborator</DialogTitle>
            <DialogDescription>
              Completează datele pentru trimiterea probei
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Patient Selection */}
            <div className="space-y-2">
              <Label>Pacient *</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Caută pacient..."
                  value={formData.patient_name || patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setFormData(prev => ({ ...prev, patient_name: e.target.value, patient_id: undefined }));
                  }}
                  className="pl-8"
                />
              </div>
              {patientSearch && filteredPatients.length > 0 && (
                <div className="border rounded-md max-h-32 overflow-y-auto">
                  {filteredPatients.slice(0, 5).map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-muted text-sm"
                      onClick={() => handleSelectPatient(patient)}
                    >
                      {patient.first_name} {patient.last_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Work Type */}
            <div className="space-y-2">
              <Label>Tip Lucrare *</Label>
              <Select
                value={formData.work_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, work_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează tipul lucrării" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_WORK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Zone/Quadrant */}
            <div className="space-y-2">
              <Label>Zona / Cadran</Label>
              <Input
                placeholder="ex: 14, 15, SUP INF, etc."
                value={formData.zone_quadrant || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, zone_quadrant: e.target.value }))}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Trimitere</Label>
                <Input
                  type="date"
                  value={formData.sample_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, sample_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Gata (estimată)</Label>
                <Input
                  type="date"
                  value={formData.expected_return_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, expected_return_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Vita Color */}
            <div className="space-y-2">
              <Label>Culoare Vita</Label>
              <Select
                value={formData.vita_color || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, vita_color: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează culoarea" />
                </SelectTrigger>
                <SelectContent>
                  {VITA_COLORS.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Laboratory */}
            <div className="space-y-2">
              <Label>Laborator</Label>
              <Select
                value={formData.laboratory_name || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, laboratory_name: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează laboratorul" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_LABORATORIES.map((lab) => (
                    <SelectItem key={lab} value={lab}>
                      {lab}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Doctor */}
            <div className="space-y-2">
              <Label>Medic</Label>
              <Select
                value={formData.doctor_id || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, doctor_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează medicul" />
                </SelectTrigger>
                <SelectContent>
                  {activeDoctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              Anulează
            </Button>
            <Button
              onClick={handleAddSample}
              disabled={!formData.patient_name || !formData.work_type}
            >
              Trimite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trial Dialog - requires cabinet selection */}
      <Dialog open={showTrialDialog} onOpenChange={setShowTrialDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Trimite la Cabinet pentru Probă</DialogTitle>
            <DialogDescription>
              Selectează cabinetul unde va avea loc proba
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cabinet *</Label>
              <Select
                value={selectedCabinetId}
                onValueChange={setSelectedCabinetId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează cabinetul" />
                </SelectTrigger>
                <SelectContent>
                  {activeCabinets.map((cabinet) => (
                    <SelectItem key={cabinet.id} value={cabinet.id.toString()}>
                      {cabinet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowTrialDialog(false); setSelectedCabinetId(''); setTrialSampleId(null); }}>
              Anulează
            </Button>
            <Button
              onClick={handleMarkAsTrial}
              disabled={!selectedCabinetId}
            >
              Trimite la Probă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resend Dialog - requires reason */}
      <Dialog open={showResendDialog} onOpenChange={setShowResendDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Retrimite la Laborator</DialogTitle>
            <DialogDescription>
              Specifică motivul retrimirii la laborator
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motiv Retrimitere *</Label>
              <Textarea
                placeholder="Descrie motivul retrimirii (ex: ajustare contact, modificare formă, etc.)"
                value={resendReason}
                onChange={(e) => setResendReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowResendDialog(false); setResendReason(''); setResendSampleId(null); }}>
              Anulează
            </Button>
            <Button
              onClick={handleResend}
              disabled={!resendReason.trim()}
            >
              Retrimite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmă ștergerea</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să ștergi această probă? Această acțiune nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
