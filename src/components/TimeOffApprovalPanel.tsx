import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import { 
  Palmtree,
  Check,
  X,
  AlertCircle,
  Calendar as CalendarIcon,
  Clock,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDoctors, Doctor } from '@/hooks/useDoctors';
import { useDoctorTimeOff, DoctorTimeOff } from '@/hooks/useDoctorTimeOff';
import { useAuth } from '@/hooks/useAuth';

const TIME_OFF_TYPES = [
  { value: 'vacation', label: 'Concediu de odihnă', icon: Palmtree },
  { value: 'sick_leave', label: 'Concediu medical', icon: AlertCircle },
  { value: 'personal', label: 'Zi liberă personală', icon: CalendarIcon },
  { value: 'other', label: 'Altele', icon: Clock },
];

const STATUS_BADGES = {
  pending: { label: 'În așteptare', variant: 'outline' as const, className: 'border-yellow-500 text-yellow-600' },
  approved: { label: 'Aprobat', variant: 'outline' as const, className: 'border-green-500 text-green-600' },
  rejected: { label: 'Respins', variant: 'outline' as const, className: 'border-red-500 text-red-600' },
};

export function TimeOffApprovalPanel() {
  const { doctors } = useDoctors();
  const { user, isAdmin } = useAuth();
  
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  
  // Rejection dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState<DoctorTimeOff | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const {
    timeOffRequests,
    loading: timeOffLoading,
    approveTimeOffRequest,
    rejectTimeOffRequest,
    deleteTimeOffRequest,
  } = useDoctorTimeOff(
    doctorFilter !== 'all' ? doctorFilter : undefined,
    statusFilter !== 'all' ? statusFilter : undefined
  );

  const handleApprove = async (request: DoctorTimeOff) => {
    if (user?.id) {
      await approveTimeOffRequest(request.id, user.id);
    }
  };

  const handleReject = async () => {
    if (rejectingRequest && rejectionReason) {
      await rejectTimeOffRequest(rejectingRequest.id, rejectionReason);
      setRejectDialogOpen(false);
      setRejectingRequest(null);
      setRejectionReason('');
    }
  };

  const getDoctorById = (id: string): Doctor | undefined => {
    return doctors.find(d => d.id === id);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Select value={doctorFilter} onValueChange={setDoctorFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Toți doctorii" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toți doctorii</SelectItem>
              {doctors.map(d => (
                <SelectItem key={d.id} value={d.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: d.color }} 
                    />
                    {d.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate statusurile</SelectItem>
              <SelectItem value="pending">În așteptare</SelectItem>
              <SelectItem value="approved">Aprobate</SelectItem>
              <SelectItem value="rejected">Respinse</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Time Off Requests List */}
      <div className="grid gap-4">
        {timeOffLoading ? (
          <div className="text-center py-8 text-muted-foreground">Se încarcă...</div>
        ) : timeOffRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Palmtree className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nu există cereri de concediu</p>
            </CardContent>
          </Card>
        ) : (
          timeOffRequests.map(request => {
            const doctor = getDoctorById(request.doctor_id);
            const typeInfo = TIME_OFF_TYPES.find(t => t.value === request.time_off_type);
            const statusInfo = STATUS_BADGES[request.status];
            const TypeIcon = typeInfo?.icon || CalendarIcon;
            
            return (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: doctor?.color || '#ccc' }}
                      >
                        <TypeIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{doctor?.name || 'Doctor necunoscut'}</div>
                        <div className="text-sm text-muted-foreground">
                          {typeInfo?.label}
                        </div>
                        <div className="text-sm mt-1">
                          {format(parseISO(request.start_date), 'd MMM yyyy', { locale: ro })}
                          {request.start_date !== request.end_date && (
                            <> - {format(parseISO(request.end_date), 'd MMM yyyy', { locale: ro })}</>
                          )}
                        </div>
                        {request.reason && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {request.reason}
                          </div>
                        )}
                        {request.rejection_reason && (
                          <div className="text-sm text-red-600 mt-1">
                            Motiv respingere: {request.rejection_reason}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={statusInfo.variant}
                        className={statusInfo.className}
                      >
                        {statusInfo.label}
                      </Badge>
                      
                      {request.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                            onClick={() => handleApprove(request)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                            onClick={() => {
                              setRejectingRequest(request);
                              setRejectDialogOpen(true);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteTimeOffRequest(request.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respinge cererea</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivul respingerii</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Introduceți motivul respingerii..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setRejectDialogOpen(false);
              setRejectingRequest(null);
              setRejectionReason('');
            }}>
              Anulează
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Respinge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
