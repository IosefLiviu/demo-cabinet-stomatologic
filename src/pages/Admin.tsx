import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ArrowLeft, Save, X, Users, Stethoscope, Shield, ShieldCheck, Palette, Mail, Download, FileText, CheckCircle, XCircle, ChevronLeft, ChevronRight, Wrench, Loader2, KeyRound, CalendarClock } from 'lucide-react';
import { TimeOffApprovalPanel } from '@/components/TimeOffApprovalPanel';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useToothStatuses, ToothStatusCustom } from '@/hooks/useToothStatuses';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface LoginLog {
  id: string;
  username: string;
  user_id: string | null;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
  error_message: string | null;
  created_at: string;
}

interface Doctor {
  id: string;
  name: string;
  color: string;
  specialization?: string;
  doctor_code?: string;
  email?: string | null;
  email_notifications_enabled?: boolean;
  is_active: boolean;
  user_id?: string | null;
}

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
];

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  // Doctors state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: PRESET_COLORS[0],
    specialization: '',
    doctor_code: '',
    email: '',
    email_notifications_enabled: true,
  });

  // Users state
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    fullName: '',
    username: '',
    role: 'user' as 'admin' | 'user',
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [editUserData, setEditUserData] = useState({ username: '', fullName: '' });
  const [savingUser, setSavingUser] = useState(false);
  
  // Password reset state
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserWithRole | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  // Tooth statuses state
  const { statuses: toothStatuses, loading: loadingStatuses, addStatus, updateStatus, deleteStatus, toggleActive: toggleStatusActive } = useToothStatuses();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<ToothStatusCustom | null>(null);
  const [statusFormData, setStatusFormData] = useState({
    name: '',
    color: PRESET_COLORS[0],
  });

  // Login logs state
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logsFilter, setLogsFilter] = useState<'all' | 'success' | 'failed'>('all');
  const LOGS_PER_PAGE = 20;

  // Maintenance state
  const [cleaningNotes, setCleaningNotes] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // ============ LOGIN LOGS FUNCTIONS ============
  const fetchLoginLogs = async () => {
    try {
      setLoadingLogs(true);
      
      let query = supabase
        .from('login_logs')
        .select('*', { count: 'exact' });
      
      if (logsFilter === 'success') {
        query = query.eq('success', true);
      } else if (logsFilter === 'failed') {
        query = query.eq('success', false);
      }
      
      query = query
        .order('created_at', { ascending: false })
        .range((logsPage - 1) * LOGS_PER_PAGE, logsPage * LOGS_PER_PAGE - 1);
      
      const { data, error, count } = await query;

      if (error) throw error;
      setLoginLogs(data || []);
      setTotalLogs(count || 0);
    } catch (error: any) {
      console.error('Error fetching login logs:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca logurile de autentificare',
        variant: 'destructive',
      });
    } finally {
      setLoadingLogs(false);
    }
  };

  const formatUserAgent = (ua: string | null): string => {
    if (!ua) return '-';
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'Mac';
    if (ua.includes('Linux')) return 'Linux';
    return 'Altul';
  };

  const totalLogsPages = Math.ceil(totalLogs / LOGS_PER_PAGE);

  useEffect(() => {
    fetchDoctors();
    fetchUsers();
    fetchLoginLogs();
  }, []);

  useEffect(() => {
    fetchLoginLogs();
  }, [logsPage, logsFilter]);

  // ============ DOCTORS FUNCTIONS ============
  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca doctorii',
        variant: 'destructive',
      });
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleOpenDialog = (doctor?: Doctor) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        name: doctor.name,
        color: doctor.color,
        specialization: doctor.specialization || '',
        doctor_code: doctor.doctor_code || '',
        email: doctor.email || '',
        email_notifications_enabled: doctor.email_notifications_enabled !== false,
      });
    } else {
      setEditingDoctor(null);
      setFormData({
        name: '',
        color: PRESET_COLORS[0],
        specialization: '',
        doctor_code: '',
        email: '',
        email_notifications_enabled: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSaveDoctor = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Eroare',
        description: 'Numele doctorului este obligatoriu',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingDoctor) {
        const { error } = await supabase
          .from('doctors')
          .update({
            name: formData.name,
            color: formData.color,
            specialization: formData.specialization || null,
            doctor_code: formData.doctor_code || null,
            email: formData.email || null,
            email_notifications_enabled: formData.email_notifications_enabled,
          })
          .eq('id', editingDoctor.id);

        if (error) throw error;
        toast({ title: 'Succes', description: 'Doctorul a fost actualizat' });
      } else {
        const { error } = await supabase
          .from('doctors')
          .insert({
            name: formData.name,
            color: formData.color,
            specialization: formData.specialization || null,
            doctor_code: formData.doctor_code || null,
            email: formData.email || null,
            email_notifications_enabled: formData.email_notifications_enabled,
          });

        if (error) throw error;
        toast({ title: 'Succes', description: 'Doctorul a fost adăugat' });
      }

      setDialogOpen(false);
      fetchDoctors();
    } catch (error: any) {
      console.error('Error saving doctor:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut salva doctorul',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    try {
      const { error } = await supabase.from('doctors').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Succes', description: 'Doctorul a fost șters' });
      fetchDoctors();
    } catch (error: any) {
      console.error('Error deleting doctor:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge doctorul',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (doctor: Doctor) => {
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ is_active: !doctor.is_active })
        .eq('id', doctor.id);

      if (error) throw error;
      fetchDoctors();
    } catch (error: any) {
      console.error('Error toggling doctor status:', error);
    }
  };

  const handleAssignUser = async (doctorId: string, userId: string | null) => {
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ user_id: userId })
        .eq('id', doctorId);

      if (error) throw error;
      
      toast({ 
        title: 'Succes', 
        description: userId ? 'Utilizatorul a fost asociat cu doctorul' : 'Asocierea a fost eliminată' 
      });
      fetchDoctors();
    } catch (error: any) {
      console.error('Error assigning user to doctor:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut asocia utilizatorul',
        variant: 'destructive',
      });
    }
  };

  // ============ USERS FUNCTIONS ============
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      
      // Fetch profiles with their roles including username
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, username, created_at');

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine the data
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          username: profile.username,
          email: '', // We'll need to get this from a different source
          role: (userRole?.role as 'admin' | 'user') || 'user',
          created_at: profile.created_at,
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca utilizatorii',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      // First check if user has a role entry
      const { data: existingRole, error: checkError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      toast({ 
        title: 'Succes', 
        description: `Rolul a fost schimbat la ${newRole === 'admin' ? 'Administrator' : 'Utilizator'}` 
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut schimba rolul',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Call edge function to delete user completely (including auth.users)
      const response = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Eroare la ștergerea utilizatorului');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({ 
        title: 'Succes', 
        description: 'Utilizatorul a fost șters complet din sistem' 
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Eroare',
        description: error.message || 'Nu s-a putut șterge utilizatorul',
        variant: 'destructive',
      });
    }
  };

  const handleOpenEditUser = (userItem: UserWithRole) => {
    setEditingUser(userItem);
    setEditUserData({
      username: userItem.username || '',
      fullName: userItem.full_name || '',
    });
    setEditUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    if (editUserData.username && editUserData.username.length < 3) {
      toast({
        title: 'Eroare',
        description: 'Numele de utilizator trebuie să aibă minim 3 caractere',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingUser(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          username: editUserData.username || null,
          full_name: editUserData.fullName || null,
        })
        .eq('user_id', editingUser.user_id);

      if (error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          throw new Error('Acest nume de utilizator este deja folosit');
        }
        throw error;
      }

      toast({
        title: 'Succes',
        description: 'Datele utilizatorului au fost actualizate',
      });

      setEditUserDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Eroare',
        description: error.message || 'Nu s-au putut actualiza datele utilizatorului',
        variant: 'destructive',
      });
    } finally {
      setSavingUser(false);
    }
  };

  const handleOpenResetPassword = (userItem: UserWithRole) => {
    setResetPasswordUser(userItem);
    setNewPassword('');
    setResetPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser) return;

    if (newPassword.length < 6) {
      toast({
        title: 'Eroare',
        description: 'Parola trebuie să aibă minim 6 caractere',
        variant: 'destructive',
      });
      return;
    }

    try {
      setResettingPassword(true);

      const response = await supabase.functions.invoke('reset-user-password', {
        body: {
          userId: resetPasswordUser.user_id,
          newPassword: newPassword,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Eroare la resetarea parolei');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Succes',
        description: response.data?.message || 'Parola a fost resetată cu succes',
      });

      setResetPasswordDialogOpen(false);
      setResetPasswordUser(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Eroare',
        description: error.message || 'Nu s-a putut reseta parola',
        variant: 'destructive',
      });
    } finally {
      setResettingPassword(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserData.email || !newUserData.password || !newUserData.username) {
      toast({
        title: 'Eroare',
        description: 'Email, nume utilizator și parola sunt obligatorii',
        variant: 'destructive',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserData.email)) {
      toast({
        title: 'Eroare',
        description: 'Formatul email-ului nu este valid',
        variant: 'destructive',
      });
      return;
    }

    if (newUserData.username.length < 3) {
      toast({
        title: 'Eroare',
        description: 'Numele de utilizator trebuie să aibă minim 3 caractere',
        variant: 'destructive',
      });
      return;
    }

    if (newUserData.password.length < 6) {
      toast({
        title: 'Eroare',
        description: 'Parola trebuie să aibă minim 6 caractere',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreatingUser(true);
      
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Nu ești autentificat');
      }
      
      // Call edge function to create user (doesn't affect current session)
      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: newUserData.email,
          password: newUserData.password,
          fullName: newUserData.fullName,
          username: newUserData.username,
          role: newUserData.role,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Eroare la crearea utilizatorului');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({ 
        title: 'Succes', 
        description: 'Utilizatorul a fost creat cu succes.' 
      });
      
      setNewUserDialogOpen(false);
      setNewUserData({ email: '', password: '', fullName: '', username: '', role: 'user' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Eroare',
        description: error.message || 'Nu s-a putut crea utilizatorul',
        variant: 'destructive',
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const exportUsersToExcel = () => {
    const exportData = users.map((u) => ({
      'Nume Complet': u.full_name || '-',
      'Nume Utilizator': u.username || '-',
      'Rol': u.role === 'admin' ? 'Administrator' : 'Utilizator',
      'Data Creare': u.created_at ? new Date(u.created_at).toLocaleDateString('ro-RO') : '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Utilizatori');
    
    // Auto-size columns
    const colWidths = [
      { wch: 25 }, // Nume Complet
      { wch: 20 }, // Nume Utilizator
      { wch: 15 }, // Rol
      { wch: 15 }, // Data Creare
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `utilizatori_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: 'Succes',
      description: 'Lista utilizatorilor a fost exportată',
    });
  };

  // ============ TOOTH STATUSES FUNCTIONS ============
  const handleOpenStatusDialog = (status?: ToothStatusCustom) => {
    if (status) {
      setEditingStatus(status);
      setStatusFormData({
        name: status.name,
        color: status.color,
      });
    } else {
      setEditingStatus(null);
      setStatusFormData({
        name: '',
        color: PRESET_COLORS[0],
      });
    }
    setStatusDialogOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!statusFormData.name.trim()) {
      toast({
        title: 'Eroare',
        description: 'Numele statusului este obligatoriu',
        variant: 'destructive',
      });
      return;
    }

    if (editingStatus) {
      await updateStatus(editingStatus.id, statusFormData.name, statusFormData.color);
    } else {
      await addStatus(statusFormData.name, statusFormData.color);
    }
    setStatusDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Administrare</h1>
            <p className="text-muted-foreground">Gestionează doctori, utilizatori și statusuri</p>
          </div>
        </div>

        <Tabs defaultValue="doctors" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="doctors" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              Doctori
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Utilizatori
            </TabsTrigger>
            <TabsTrigger value="statuses" className="gap-2">
              <Palette className="h-4 w-4" />
              Statusuri
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <FileText className="h-4 w-4" />
              Loguri
            </TabsTrigger>
            <TabsTrigger value="timeoff" className="gap-2">
              <CalendarClock className="h-4 w-4" />
              Concedii
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="gap-2">
              <Wrench className="h-4 w-4" />
              Mentenanță
            </TabsTrigger>
          </TabsList>

          {/* ============ DOCTORS TAB ============ */}
          <TabsContent value="doctors" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Adaugă Doctor
              </Button>
            </div>

            {loadingDoctors ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-4">
                {doctors.map((doctor) => (
                  <Card key={doctor.id} className={!doctor.is_active ? 'opacity-50' : ''}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: doctor.color }}
                        >
                          {doctor.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold">{doctor.name}</h3>
                          {doctor.specialization && (
                            <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                          )}
                          {doctor.user_id && (
                            <p className="text-xs text-primary">
                              ✓ Asociat cu utilizator
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={doctor.user_id || 'none'}
                          onValueChange={(value) => handleAssignUser(doctor.id, value === 'none' ? null : value)}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Asociază utilizator" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Fără asociere</SelectItem>
                            {users.map((u) => (
                              <SelectItem key={u.user_id} value={u.user_id}>
                                {u.full_name || 'Fără nume'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(doctor)}
                        >
                          {doctor.is_active ? 'Activ' : 'Inactiv'}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(doctor)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Ștergeți doctorul?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Această acțiune nu poate fi anulată. Doctorul {doctor.name} va fi șters definitiv.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Anulează</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteDoctor(doctor.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Șterge
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {doctors.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-muted-foreground mb-4">Nu există doctori înregistrați</p>
                      <Button onClick={() => handleOpenDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adaugă primul doctor
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={exportUsersToExcel} className="gap-2">
                <Download className="h-4 w-4" />
                Exportă
              </Button>
              <Button onClick={() => setNewUserDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Creează Utilizator
              </Button>
            </div>

            {loadingUsers ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-4">
                {users.map((userItem) => (
                  <Card key={userItem.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {userItem.role === 'admin' ? (
                            <ShieldCheck className="h-5 w-5 text-primary" />
                          ) : (
                            <Shield className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {userItem.full_name || 'Fără nume'}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{userItem.role === 'admin' ? 'Administrator' : 'Utilizator'}</span>
                            {userItem.username ? (
                              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                                @{userItem.username}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-destructive/10 text-destructive rounded text-xs">
                                fără username
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenEditUser(userItem)}
                          title="Editează utilizator"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenResetPassword(userItem)}
                          title="Resetează parola"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Select
                          value={userItem.role}
                          onValueChange={(value: 'admin' | 'user') => handleChangeRole(userItem.user_id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Utilizator</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive"
                              disabled={userItem.user_id === user?.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Ștergeți utilizatorul?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Această acțiune nu poate fi anulată. Utilizatorul {userItem.full_name || 'Fără nume'} va fi șters definitiv din sistem.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Anulează</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(userItem.user_id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Șterge
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {users.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-muted-foreground mb-4">Nu există utilizatori înregistrați</p>
                      <Button onClick={() => setNewUserDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Creează primul utilizator
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* ============ TOOTH STATUSES TAB ============ */}
          <TabsContent value="statuses" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => handleOpenStatusDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Adaugă Status
              </Button>
            </div>

            {loadingStatuses ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-4">
                {toothStatuses.map((status) => (
                  <Card key={status.id} className={!status.is_active ? 'opacity-50' : ''}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold border-2"
                          style={{ 
                            backgroundColor: `${status.color}20`, 
                            borderColor: status.color,
                            color: status.color 
                          }}
                        >
                          {status.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold">{status.name}</h3>
                          <p className="text-sm text-muted-foreground">{status.color}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStatusActive(status.id, !status.is_active)}
                        >
                          {status.is_active ? 'Activ' : 'Inactiv'}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenStatusDialog(status)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Ștergeți statusul?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Această acțiune nu poate fi anulată. Statusul {status.name} va fi șters definitiv.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Anulează</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteStatus(status.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Șterge
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {toothStatuses.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-muted-foreground mb-4">Nu există statusuri dentare</p>
                      <Button onClick={() => handleOpenStatusDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adaugă primul status
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* ============ LOGIN LOGS TAB ============ */}
          <TabsContent value="logs" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filtrare:</span>
                <Select
                  value={logsFilter}
                  onValueChange={(value: 'all' | 'success' | 'failed') => {
                    setLogsFilter(value);
                    setLogsPage(1);
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate</SelectItem>
                    <SelectItem value="success">Reușite</SelectItem>
                    <SelectItem value="failed">Eșuate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                Total: {totalLogs} înregistrări
              </p>
            </div>

            {loadingLogs ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <Card>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Stare</TableHead>
                          <TableHead>Utilizator</TableHead>
                          <TableHead>IP</TableHead>
                          <TableHead>Dispozitiv</TableHead>
                          <TableHead>Data/Ora</TableHead>
                          <TableHead>Eroare</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loginLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              {log.success ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-destructive" />
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{log.username}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {log.ip_address || '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatUserAgent(log.user_agent)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(log.created_at).toLocaleString('ro-RO', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </TableCell>
                            <TableCell className="text-destructive text-sm max-w-[200px] truncate">
                              {log.error_message || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                        {loginLogs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              Nu există loguri de autentificare
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>

                {/* Pagination */}
                {totalLogsPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                      disabled={logsPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Pagina {logsPage} din {totalLogsPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLogsPage((p) => Math.min(totalLogsPages, p + 1))}
                      disabled={logsPage === totalLogsPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ============ MAINTENANCE TAB ============ */}
          <TabsContent value="maintenance" className="space-y-6">
            <Card>
              <CardContent className="py-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-warning/10">
                    <Wrench className="h-6 w-6 text-warning" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Curăță notițe dentare vechi</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Elimină datele tehnice (coordonate 3D, JSON de diagnostic) rămase în notițele 
                      dinților din baza de date. Aceasta curăță notițele pentru export/print.
                    </p>
                    <Button
                      onClick={async () => {
                        setCleaningNotes(true);
                        try {
                          const { data: sessionData } = await supabase.auth.getSession();
                          const response = await supabase.functions.invoke('clean-dental-notes', {
                            headers: {
                              Authorization: `Bearer ${sessionData.session?.access_token}`,
                            },
                          });
                          
                          if (response.error) {
                            throw new Error(response.error.message || 'Eroare la curățare');
                          }
                          
                          const result = response.data;
                          toast({
                            title: 'Curățare finalizată',
                            description: `S-au curățat ${result.updatedDentalStatus} notițe din status dentar și ${result.updatedHistory} din istoric.`,
                          });
                        } catch (err: any) {
                          console.error('Clean notes error:', err);
                          toast({
                            title: 'Eroare',
                            description: err.message || 'Nu s-au putut curăța notițele',
                            variant: 'destructive',
                          });
                        } finally {
                          setCleaningNotes(false);
                        }
                      }}
                      disabled={cleaningNotes}
                      variant="outline"
                      className="gap-2"
                    >
                      {cleaningNotes ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Se curăță...
                        </>
                      ) : (
                        <>
                          <Wrench className="h-4 w-4" />
                          Curăță notițe vechi
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ TIME OFF TAB ============ */}
          <TabsContent value="timeoff" className="space-y-4">
            <TimeOffApprovalPanel />
          </TabsContent>
        </Tabs>

        {/* Doctor Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingDoctor ? 'Editare Doctor' : 'Adaugă Doctor Nou'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="doctor-name">Nume *</Label>
                <Input
                  id="doctor-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Dr. Popescu Ion"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor-spec">Specializare</Label>
                <Input
                  id="doctor-spec"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="Medic Stomatolog"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor-code">Cod Parafă</Label>
                <Input
                  id="doctor-code"
                  value={formData.doctor_code}
                  onChange={(e) => setFormData({ ...formData, doctor_code: e.target.value })}
                  placeholder="Ex: H08327"
                />
                <p className="text-xs text-muted-foreground">
                  Codul medical afișat pe rețete și documente oficiale
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor-email">Email (pentru notificări)</Label>
                <Input
                  id="doctor-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="doctor@exemplu.ro"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Notificări Email
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Primește notificări la programări noi
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={formData.email_notifications_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, email_notifications_enabled: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label>Culoare</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Label htmlFor="custom-color" className="text-sm">Culoare personalizată:</Label>
                  <Input
                    id="custom-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-8 p-0 border-0"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Anulează
              </Button>
              <Button onClick={handleSaveDoctor}>
                <Save className="h-4 w-4 mr-2" />
                {editingDoctor ? 'Salvează' : 'Adaugă'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New User Dialog */}
        <Dialog open={newUserDialogOpen} onOpenChange={setNewUserDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Creează Utilizator Nou</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Nume complet</Label>
                <Input
                  id="user-name"
                  value={newUserData.fullName}
                  onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                  placeholder="Ion Popescu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-username">Nume utilizator *</Label>
                <Input
                  id="user-username"
                  type="text"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  placeholder="ion.popescu"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">Minim 3 caractere. Utilizatorul se va autentifica cu acest nume.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email *</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="email@exemplu.ro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password">Parolă *</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Minim 6 caractere"
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={newUserData.role}
                  onValueChange={(value: 'admin' | 'user') => setNewUserData({ ...newUserData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utilizator</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewUserDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Anulează
              </Button>
              <Button onClick={handleCreateUser} disabled={creatingUser}>
                <Save className="h-4 w-4 mr-2" />
                {creatingUser ? 'Se creează...' : 'Creează'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editare Utilizator</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-user-name">Nume complet</Label>
                <Input
                  id="edit-user-name"
                  value={editUserData.fullName}
                  onChange={(e) => setEditUserData({ ...editUserData, fullName: e.target.value })}
                  placeholder="Ion Popescu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-user-username">Nume utilizator *</Label>
                <Input
                  id="edit-user-username"
                  type="text"
                  value={editUserData.username}
                  onChange={(e) => setEditUserData({ ...editUserData, username: e.target.value })}
                  placeholder="ion.popescu"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Minim 3 caractere. Utilizatorul se va autentifica cu acest nume.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditUserDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Anulează
              </Button>
              <Button onClick={handleSaveUser} disabled={savingUser}>
                <Save className="h-4 w-4 mr-2" />
                {savingUser ? 'Se salvează...' : 'Salvează'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status Add/Edit Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingStatus ? 'Editare Status' : 'Adaugă Status Nou'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="status-name">Nume *</Label>
                <Input
                  id="status-name"
                  value={statusFormData.name}
                  onChange={(e) => setStatusFormData({ ...statusFormData, name: e.target.value })}
                  placeholder="Ex: Carie, Plombat..."
                />
              </div>
              <div className="space-y-2">
                <Label>Culoare</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        statusFormData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setStatusFormData({ ...statusFormData, color })}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Label htmlFor="status-custom-color" className="text-sm">Culoare personalizată:</Label>
                  <Input
                    id="status-custom-color"
                    type="color"
                    value={statusFormData.color}
                    onChange={(e) => setStatusFormData({ ...statusFormData, color: e.target.value })}
                    className="w-12 h-8 p-0 border-0"
                  />
                </div>
                <div className="mt-4 p-4 rounded-lg border-2" style={{ 
                  backgroundColor: `${statusFormData.color}20`, 
                  borderColor: statusFormData.color 
                }}>
                  <span className="font-medium" style={{ color: statusFormData.color }}>
                    {statusFormData.name || 'Preview'}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Anulează
              </Button>
              <Button onClick={handleSaveStatus}>
                <Save className="h-4 w-4 mr-2" />
                {editingStatus ? 'Salvează' : 'Adaugă'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Resetare parolă
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Resetați parola pentru <strong>{resetPasswordUser?.full_name || resetPasswordUser?.username || 'utilizator'}</strong>. 
                Utilizatorul va trebui să-și schimbe parola la prima autentificare.
              </p>
              <div className="space-y-2">
                <Label htmlFor="new-password">Parolă temporară *</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minim 6 caractere"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Anulează
              </Button>
              <Button onClick={handleResetPassword} disabled={resettingPassword}>
                {resettingPassword ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4 mr-2" />
                )}
                {resettingPassword ? 'Se procesează...' : 'Resetează parola'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
