import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ArrowLeft, Save, X, Users, Stethoscope, Shield, ShieldCheck, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface Doctor {
  id: string;
  name: string;
  color: string;
  specialization?: string;
  is_active: boolean;
  user_id?: string | null;
}

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
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
  });

  // Users state
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'user' as 'admin' | 'user',
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // Tooth statuses state
  const { statuses: toothStatuses, loading: loadingStatuses, addStatus, updateStatus, deleteStatus, toggleActive: toggleStatusActive } = useToothStatuses();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<ToothStatusCustom | null>(null);
  const [statusFormData, setStatusFormData] = useState({
    name: '',
    color: PRESET_COLORS[0],
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    fetchDoctors();
    fetchUsers();
  }, []);

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
      });
    } else {
      setEditingDoctor(null);
      setFormData({
        name: '',
        color: PRESET_COLORS[0],
        specialization: '',
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
      
      // Fetch profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, created_at');

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
      // Delete user role first
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) throw roleError;

      // Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) throw profileError;

      toast({ 
        title: 'Succes', 
        description: 'Utilizatorul a fost șters' 
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge utilizatorul',
        variant: 'destructive',
      });
    }
  };

  const handleCreateUser = async () => {
    if (!newUserData.email || !newUserData.password) {
      toast({
        title: 'Eroare',
        description: 'Email și parola sunt obligatorii',
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
      
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserData.email,
        password: newUserData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: newUserData.fullName,
          },
        },
      });

      if (authError) throw authError;

      // If we need to set admin role and user was created
      if (authData.user && newUserData.role === 'admin') {
        // Wait a bit for the trigger to create the user_roles entry
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', authData.user.id);

        if (roleError) {
          console.error('Error setting admin role:', roleError);
        }
      }

      toast({ 
        title: 'Succes', 
        description: 'Utilizatorul a fost creat. Va primi un email de confirmare.' 
      });
      
      setNewUserDialogOpen(false);
      setNewUserData({ email: '', password: '', fullName: '', role: 'user' });
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
          <TabsList className="grid w-full max-w-lg grid-cols-3">
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

          {/* ============ USERS TAB ============ */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-end">
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
                          <p className="text-sm text-muted-foreground">
                            {userItem.role === 'admin' ? 'Administrator' : 'Utilizator'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                  placeholder="Stomatologie generală"
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
      </div>
    </div>
  );
}
