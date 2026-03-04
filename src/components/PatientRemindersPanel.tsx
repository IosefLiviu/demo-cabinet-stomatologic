import { useState } from 'react';
import { format, isToday, isPast, isTomorrow } from 'date-fns';
import { ro } from 'date-fns/locale';
import {
  Bell,
  Phone,
  CheckCircle2,
  Trash2,
  Edit,
  Calendar,
  User,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { usePendingReminders, usePatientReminders, PatientReminder } from '@/hooks/usePatientReminders';
import { PatientReminderDialog } from './PatientReminderDialog';

export function PatientRemindersPanel() {
  const { reminders, isLoading } = usePendingReminders();
  const { updateReminder, deleteReminder } = usePatientReminders();
  const [editingReminder, setEditingReminder] = useState<PatientReminder | null>(null);

  const todayReminders = reminders.filter((r) => isToday(new Date(r.reminder_date)));
  const overdueReminders = reminders.filter((r) => isPast(new Date(r.reminder_date)) && !isToday(new Date(r.reminder_date)));
  const upcomingReminders = reminders.filter((r) => !isPast(new Date(r.reminder_date)) && !isToday(new Date(r.reminder_date)));

  const handleMarkComplete = (id: string) => {
    updateReminder.mutate({ id, is_completed: true });
  };

  const handleDelete = (id: string) => {
    deleteReminder.mutate(id);
  };

  const getDateBadge = (dateStr: string) => {
    const date = new Date(dateStr);
    
    if (isPast(date) && !isToday(date)) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Întârziat
        </Badge>
      );
    }
    
    if (isToday(date)) {
      return (
        <Badge className="gap-1 bg-orange-500">
          <Clock className="h-3 w-3" />
          Azi
        </Badge>
      );
    }
    
    if (isTomorrow(date)) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Calendar className="h-3 w-3" />
          Mâine
        </Badge>
      );
    }
    
    return null;
  };

  const recallTypeLabels: Record<string, string> = {
    control: 'Control',
    profilaxie: 'Profilaxie',
    control_aparat: 'Control aparat',
  };

  const ReminderTable = ({ items }: { items: PatientReminder[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pacient</TableHead>
          <TableHead>Telefon</TableHead>
          <TableHead className="hidden sm:table-cell">Tip</TableHead>
          <TableHead className="hidden md:table-cell">La cine</TableHead>
          <TableHead className="hidden md:table-cell">Data</TableHead>
          <TableHead className="hidden lg:table-cell">Notă</TableHead>
          <TableHead className="text-right">Acțiuni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
              Nu există remindere în această categorie
            </TableCell>
          </TableRow>
        ) : (
          items.map((reminder) => (
            <TableRow key={reminder.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {reminder.patient?.last_name} {reminder.patient?.first_name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <a
                  href={`tel:${reminder.patient?.phone}`}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {reminder.patient?.phone}
                </a>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <div className="flex flex-wrap gap-1">
                  {(reminder.recall_type || []).map((type) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {recallTypeLabels[type] || type}
                    </Badge>
                  ))}
                  {(!reminder.recall_type || reminder.recall_type.length === 0) && (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="text-sm">
                  {reminder.doctor?.name || '-'}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-2">
                  <span>{format(new Date(reminder.reminder_date), 'd MMM yyyy', { locale: ro })}</span>
                  {getDateBadge(reminder.reminder_date)}
                </div>
              </TableCell>
              <TableCell className="max-w-[200px] hidden lg:table-cell">
                <span className="text-sm text-muted-foreground truncate block">
                  {reminder.note || '-'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleMarkComplete(reminder.id)}
                    title="Marchează ca finalizat"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hidden sm:inline-flex"
                    onClick={() => setEditingReminder(reminder)}
                    title="Editează"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Șterge"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Ștergeți reminder-ul?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Această acțiune nu poate fi anulată.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Anulează</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(reminder.id)}
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
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Se încarcă...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            Remindere Rechemare Pacienți
            {reminders.length > 0 && (
              <Badge variant="secondary">{reminders.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <div className="overflow-x-auto mb-4 -mx-2 px-2 sm:mx-0 sm:px-0 flex justify-center">
              <TabsList className="inline-flex w-auto">
                <TabsTrigger value="all" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                  Toate
                  <Badge variant="outline" className="ml-0.5 text-[10px] px-1">{reminders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="overdue" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                  Întârziate
                  {overdueReminders.length > 0 && (
                    <Badge variant="destructive" className="ml-0.5 text-[10px] px-1">{overdueReminders.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="today" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                  Azi
                  {todayReminders.length > 0 && (
                    <Badge className="ml-0.5 bg-orange-500 text-[10px] px-1">{todayReminders.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                  Viitoare
                  {upcomingReminders.length > 0 && (
                    <Badge variant="secondary" className="ml-0.5 text-[10px] px-1">{upcomingReminders.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all">
              <ReminderTable items={reminders} />
            </TabsContent>
            <TabsContent value="overdue">
              <ReminderTable items={overdueReminders} />
            </TabsContent>
            <TabsContent value="today">
              <ReminderTable items={todayReminders} />
            </TabsContent>
            <TabsContent value="upcoming">
              <ReminderTable items={upcomingReminders} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {editingReminder && (
        <PatientReminderDialog
          open={!!editingReminder}
          onClose={() => setEditingReminder(null)}
          patientId={editingReminder.patient_id}
          patientName={`${editingReminder.patient?.last_name} ${editingReminder.patient?.first_name}`}
          existingReminder={editingReminder}
        />
      )}
    </>
  );
}
