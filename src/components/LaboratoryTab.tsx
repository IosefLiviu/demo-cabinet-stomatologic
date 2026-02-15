import { useState, useRef, useCallback, DragEvent } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Plus, Check, Trash2, Search, Send, ArrowDownToLine, FlaskConical, RotateCcw, CheckCircle, User, Calendar, Palette, MapPin, Stethoscope, Clock, Building2, MessageSquare, GripVertical, LayoutGrid, Columns3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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
  SelectGroup,
  SelectLabel,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLabSamples, LabSampleInsert, LabSampleStatus } from '@/hooks/useLabSamples';
import { Patient } from '@/hooks/usePatients';
import { useCabinets } from '@/hooks/useCabinets';
import { LAB_WORK_TYPES, getWorkTypesByCategory, getLabPrice, LABORATORIES } from '@/constants/laboratoryPricing';
import { cn } from '@/lib/utils';

interface Doctor {
  id: string;
  name: string;
  is_active: boolean;
}

interface LaboratoryTabProps {
  patients: Patient[];
  doctors: Doctor[];
}

const VITA_COLORS = [
  'A1', 'A2', 'A3', 'A3.5', 'A4',
  'B1', 'B2', 'B3', 'B4',
  'C1', 'C2', 'C3', 'C4',
  'D2', 'D3', 'D4',
];

type TabStatus = 'sent' | 'returned' | 'trial' | 'finalized';

const STATUS_CONFIG: Record<LabSampleStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof Send }> = {
  sent: { label: 'Trimis', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950/30', borderColor: 'border-blue-200 dark:border-blue-800', icon: Send },
  resent: { label: 'Retrimis', color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-950/30', borderColor: 'border-orange-200 dark:border-orange-800', icon: RotateCcw },
  returned: { label: 'Primit', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30', borderColor: 'border-emerald-200 dark:border-emerald-800', icon: ArrowDownToLine },
  trial: { label: 'La Probă', color: 'text-violet-700 dark:text-violet-400', bgColor: 'bg-violet-50 dark:bg-violet-950/30', borderColor: 'border-violet-200 dark:border-violet-800', icon: FlaskConical },
  finalized: { label: 'Finalizat', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30', borderColor: 'border-emerald-200 dark:border-emerald-800', icon: CheckCircle },
};

export function LaboratoryTab({ patients, doctors }: LaboratoryTabProps) {
  const { samples, loading, addSample, markAsReturned, markAsTrial, markAsFinalized, resendToLab, deleteSample } = useLabSamples();
  const { cabinets } = useCabinets();
  const [activeSubTab, setActiveSubTab] = useState<TabStatus>('sent');
  const [viewMode, setViewMode] = useState<'kanban' | 'tabs'>('kanban');
  const [draggedSampleId, setDraggedSampleId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TabStatus | null>(null);
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

  // Filter samples by status
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
    if (!formData.patient_name || !formData.work_type) return;
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
    if (!trialSampleId || !selectedCabinetId) return;
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
    if (!resendSampleId || !resendReason.trim()) return;
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
    if (!doctorId) return null;
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor?.name || null;
  };

  // Drag and drop handlers
  const VALID_TRANSITIONS: Record<string, TabStatus[]> = {
    sent: ['returned'],
    resent: ['returned'],
    returned: ['trial'],
    trial: ['finalized', 'sent'],
    finalized: ['returned', 'trial'],
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, sampleId: string) => {
    setDraggedSampleId(sampleId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sampleId);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    setDraggedSampleId(null);
    setDragOverColumn(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, column: TabStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(column);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetColumn: TabStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const sampleId = e.dataTransfer.getData('text/plain');
    if (!sampleId) return;

    const sample = samples.find(s => s.id === sampleId);
    if (!sample) return;

    const validTargets = VALID_TRANSITIONS[sample.status] || [];
    if (!validTargets.includes(targetColumn)) {
      setDraggedSampleId(null);
      return;
    }

    if (targetColumn === 'returned') {
      await markAsReturned(sampleId);
    } else if (targetColumn === 'trial') {
      // Need cabinet selection - open dialog
      setTrialSampleId(sampleId);
      setSelectedCabinetId('');
      setShowTrialDialog(true);
    } else if (targetColumn === 'finalized') {
      await markAsFinalized(sampleId);
    } else if (targetColumn === 'sent') {
      // Resend - need reason
      setResendSampleId(sampleId);
      setResendReason('');
      setShowResendDialog(true);
    }

    setDraggedSampleId(null);
  };

  const canDropOnColumn = (column: TabStatus): boolean => {
    if (!draggedSampleId) return false;
    const sample = samples.find(s => s.id === draggedSampleId);
    if (!sample) return false;
    const validTargets = VALID_TRANSITIONS[sample.status] || [];
    return validTargets.includes(column);
  };

  const getCabinetName = (cabinetId: number | null) => {
    if (!cabinetId) return null;
    const cabinet = cabinets.find(c => c.id === cabinetId);
    return cabinet?.name || null;
  };

  // Render a sample card
  const renderSampleCard = (sample: typeof samples[0], tab: TabStatus) => {
    const config = STATUS_CONFIG[sample.status];
    const StatusIcon = config.icon;
    const doctorName = getDoctorName(sample.doctor_id);
    const cabinetName = getCabinetName(sample.cabinet_id);

    // Determine the primary date to show
    const primaryDate = tab === 'finalized' ? sample.finalized_date
      : tab === 'trial' ? sample.trial_date
      : tab === 'returned' ? sample.actual_return_date
      : sample.resend_date || sample.sample_date;

    return (
      <div
        key={sample.id}
        draggable
        onDragStart={(e) => handleDragStart(e, sample.id)}
        onDragEnd={handleDragEnd}
        className={cn(
          "group relative rounded-xl border p-4 transition-all hover:shadow-md cursor-grab active:cursor-grabbing",
          config.bgColor, config.borderColor,
          draggedSampleId === sample.id && "opacity-50 scale-95"
        )}
      >
        {/* Drag handle indicator */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-30 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        {/* Top row: status + date + actions */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center justify-center h-7 w-7 rounded-lg", config.bgColor)}>
              <StatusIcon className={cn("h-3.5 w-3.5", config.color)} />
            </div>
            <Badge variant="outline" className={cn("text-[10px] font-medium border", config.borderColor, config.color)}>
              {config.label}
            </Badge>
            {primaryDate && (
              <span className="text-[11px] text-muted-foreground">
                {format(new Date(primaryDate), 'd MMM yyyy', { locale: ro })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {tab === 'sent' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMarkAsReturned(sample.id)}>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Marchează ca primită</TooltipContent>
              </Tooltip>
            )}
            {tab === 'returned' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenTrialDialog(sample.id)}>
                    <FlaskConical className="h-3.5 w-3.5 text-violet-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Trimite la probă</TooltipContent>
              </Tooltip>
            )}
            {tab === 'trial' && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMarkAsFinalized(sample.id)}>
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Finalizează</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenResendDialog(sample.id)}>
                      <RotateCcw className="h-3.5 w-3.5 text-orange-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Retrimite</TooltipContent>
                </Tooltip>
              </>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteConfirmId(sample.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Șterge</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Patient name + work type */}
        <div className="mb-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold text-sm text-foreground">{sample.patient_name}</span>
          </div>
          <div className="text-xs font-medium text-primary ml-5">{sample.work_type}</div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 ml-5 text-[11px] text-muted-foreground">
          {sample.zone_quadrant && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{sample.zone_quadrant}</span>
            </div>
          )}
          {sample.vita_color && (
            <div className="flex items-center gap-1">
              <Palette className="h-3 w-3" />
              <span className="font-medium">{sample.vita_color}</span>
            </div>
          )}
          {sample.laboratory_name && (
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              <span>{sample.laboratory_name}</span>
            </div>
          )}
          {doctorName && (
            <div className="flex items-center gap-1">
              <Stethoscope className="h-3 w-3" />
              <span>Dr. {doctorName}</span>
            </div>
          )}
          {sample.expected_return_date && tab === 'sent' && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Gata: {format(new Date(sample.expected_return_date), 'd MMM', { locale: ro })}</span>
            </div>
          )}
          {cabinetName && tab === 'trial' && (
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              <span>{cabinetName}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {sample.notes && (
          <div className="mt-2 ml-5 flex items-start gap-1 text-[11px] text-muted-foreground">
            <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
            <span className="italic line-clamp-2" title={sample.notes}>{sample.notes}</span>
          </div>
        )}

        {/* Resend reason */}
        {sample.status === 'resent' && sample.resend_reason && (
          <div className="mt-2 ml-5 text-[10px] text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 rounded px-2 py-1">
            <span className="font-medium">Motiv retrimitere:</span> {sample.resend_reason}
          </div>
        )}
      </div>
    );
  };

  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <FlaskConical className="h-10 w-10 mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );

  const renderCardGrid = (sampleList: typeof samples, tab: TabStatus) => {
    if (loading) return <div className="text-center py-8 text-muted-foreground">Se încarcă...</div>;
    if (sampleList.length === 0) return renderEmptyState(searchTerm ? 'Nicio probă găsită' : 'Nu există lucrări în acest stadiu');
    return (
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {sampleList.map(s => renderSampleCard(s, tab))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FlaskConical className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Laborator</h2>
            <p className="text-xs text-muted-foreground">
              {samples.length} lucrări totale
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full sm:w-[200px] h-9"
            />
          </div>
          <div className="flex items-center border rounded-lg h-9">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setViewMode('kanban')}
            >
              <Columns3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'tabs' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setViewMode('tabs')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2 h-9">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Lucrare Nouă</span>
          </Button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        /* Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {([
            { key: 'sent' as TabStatus, list: filteredSentSamples, label: 'La Laborator', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', headerBg: 'bg-blue-100 dark:bg-blue-900/40', Icon: Send },
            { key: 'returned' as TabStatus, list: filteredReturnedSamples, label: 'Primite', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', headerBg: 'bg-emerald-100 dark:bg-emerald-900/40', Icon: ArrowDownToLine },
            { key: 'trial' as TabStatus, list: filteredTrialSamples, label: 'La Probă', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800', headerBg: 'bg-violet-100 dark:bg-violet-900/40', Icon: FlaskConical },
            { key: 'finalized' as TabStatus, list: filteredFinalizedSamples, label: 'Finalizate', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', headerBg: 'bg-emerald-100 dark:bg-emerald-900/40', Icon: CheckCircle },
          ]).map(({ key, list, label, color, bg, border, headerBg, Icon }) => (
            <div
              key={key}
              className={cn(
                "flex flex-col rounded-xl border-2 transition-all min-h-[300px]",
                border,
                dragOverColumn === key && canDropOnColumn(key) && "ring-2 ring-primary shadow-lg scale-[1.01]",
                dragOverColumn === key && !canDropOnColumn(key) && "opacity-50",
              )}
              onDragOver={(e) => handleDragOver(e, key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, key)}
            >
              {/* Column header */}
              <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-t-[10px]", headerBg)}>
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", color)} />
                  <span className={cn("text-sm font-semibold", color)}>{label}</span>
                </div>
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{list.length}</Badge>
              </div>

              {/* Column body */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[600px]">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">Se încarcă...</div>
                ) : list.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <FlaskConical className="h-6 w-6 mb-2 opacity-20" />
                    <p className="text-[11px]">{searchTerm ? 'Nimic găsit' : 'Gol'}</p>
                    {draggedSampleId && canDropOnColumn(key) && (
                      <p className="text-[10px] mt-1 text-primary font-medium animate-pulse">Trage aici ↓</p>
                    )}
                  </div>
                ) : (
                  list.map(s => renderSampleCard(s, key))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Tabs View (original) */
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-2">
            {([
              { key: 'sent' as TabStatus, count: sentSamples.length, label: 'La Laborator', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', Icon: Send },
              { key: 'returned' as TabStatus, count: returnedSamples.length, label: 'Primite', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', Icon: ArrowDownToLine },
              { key: 'trial' as TabStatus, count: trialSamples.length, label: 'La Probă', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800', Icon: FlaskConical },
              { key: 'finalized' as TabStatus, count: finalizedSamples.length, label: 'Finalizate', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', Icon: CheckCircle },
            ]).map(({ key, count, label, color, bg, border, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSubTab(key)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all hover:shadow-sm cursor-pointer",
                  activeSubTab === key ? `${bg} ${border} ring-1 ring-primary/20` : "bg-card border-border"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn("h-3.5 w-3.5", color)} />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
                </div>
                <p className={cn("text-2xl font-bold", color)}>{count}</p>
              </button>
            ))}
          </div>

          <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as TabStatus)}>
            <TabsList className="mb-4">
              <TabsTrigger value="sent" className="gap-1.5">
                <Send className="h-3.5 w-3.5" />
                La Laborator
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{sentSamples.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="returned" className="gap-1.5">
                <ArrowDownToLine className="h-3.5 w-3.5" />
                Primite
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{returnedSamples.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="trial" className="gap-1.5">
                <FlaskConical className="h-3.5 w-3.5" />
                La Probă
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{trialSamples.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="finalized" className="gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" />
                Finalizate
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{finalizedSamples.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sent">{renderCardGrid(filteredSentSamples, 'sent')}</TabsContent>
            <TabsContent value="returned">{renderCardGrid(filteredReturnedSamples, 'returned')}</TabsContent>
            <TabsContent value="trial">{renderCardGrid(filteredTrialSamples, 'trial')}</TabsContent>
            <TabsContent value="finalized">{renderCardGrid(filteredFinalizedSamples, 'finalized')}</TabsContent>
          </Tabs>
        </>
      )}

      {/* Add Sample Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Lucrare Nouă
            </DialogTitle>
            <DialogDescription>
              Completează datele pentru trimiterea la laborator
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Patient Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Pacient *</Label>
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
                <div className="border rounded-lg max-h-32 overflow-y-auto bg-popover">
                  {filteredPatients.slice(0, 5).map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-muted text-sm transition-colors"
                      onClick={() => handleSelectPatient(patient)}
                    >
                      <span className="font-medium">{patient.first_name} {patient.last_name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{patient.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Laboratory + Doctor row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Laborator *</Label>
                <Select
                  value={formData.laboratory_name || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, laboratory_name: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează" />
                  </SelectTrigger>
                  <SelectContent>
                    {LABORATORIES.map((lab) => (
                      <SelectItem key={lab.id} value={lab.name}>
                        {lab.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Medic</Label>
                <Select
                  value={formData.doctor_id || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, doctor_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează" />
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

            {/* Work Type */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Tip Lucrare *</Label>
              <Select
                value={formData.work_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, work_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează tipul lucrării" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  {Object.entries(getWorkTypesByCategory()).map(([category, workTypes]) => (
                    <SelectGroup key={category}>
                      <SelectLabel className="font-semibold text-primary">{category}</SelectLabel>
                      {workTypes.map((workType) => {
                        const price = formData.laboratory_name 
                          ? getLabPrice(workType.id, formData.laboratory_name)
                          : null;
                        const priceText = price !== null ? ` — ${price} RON` : '';
                        return (
                          <SelectItem 
                            key={workType.id} 
                            value={workType.name}
                            disabled={formData.laboratory_name ? price === null : false}
                          >
                            {workType.name}{priceText}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              {formData.work_type && formData.laboratory_name && (
                <p className="text-xs text-muted-foreground">
                  Preț: {(() => {
                    const workType = LAB_WORK_TYPES.find(w => w.name === formData.work_type);
                    if (workType) {
                      const price = getLabPrice(workType.id, formData.laboratory_name || '');
                      return price !== null ? `${price} RON` : 'N/A';
                    }
                    return 'N/A';
                  })()}
                </p>
              )}
            </div>

            {/* Zone + Vita Color + Dates row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Zonă / Cadran</Label>
                <Input
                  placeholder="ex: 1.4-1.6"
                  value={formData.zone_quadrant || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, zone_quadrant: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Culoare Vita</Label>
                <Select
                  value={formData.vita_color || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, vita_color: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează" />
                  </SelectTrigger>
                  <SelectContent>
                    {VITA_COLORS.map((color) => (
                      <SelectItem key={color} value={color}>{color}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Data trimitere</Label>
                <Input
                  type="date"
                  value={formData.sample_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, sample_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Data estimată primire</Label>
                <Input
                  type="date"
                  value={formData.expected_return_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, expected_return_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Observații</Label>
              <Textarea
                placeholder="Observații suplimentare..."
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              Anulează
            </Button>
            <Button
              onClick={handleAddSample}
              disabled={!formData.patient_name || !formData.work_type}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Trimite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trial Dialog */}
      <Dialog open={showTrialDialog} onOpenChange={setShowTrialDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-violet-600" />
              Trimite la Cabinet pentru Probă
            </DialogTitle>
            <DialogDescription>
              Selectează cabinetul unde va avea loc proba
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Cabinet *</Label>
              <Select value={selectedCabinetId} onValueChange={setSelectedCabinetId}>
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
            <Button onClick={handleMarkAsTrial} disabled={!selectedCabinetId} className="gap-2">
              <FlaskConical className="h-4 w-4" />
              Trimite la Probă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resend Dialog */}
      <Dialog open={showResendDialog} onOpenChange={setShowResendDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-600" />
              Retrimite la Laborator
            </DialogTitle>
            <DialogDescription>
              Specifică motivul retrimirii la laborator
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Motiv Retrimitere *</Label>
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
            <Button onClick={handleResend} disabled={!resendReason.trim()} className="gap-2">
              <RotateCcw className="h-4 w-4" />
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
