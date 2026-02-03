import { useState, useEffect, useMemo } from 'react';
import { Search, Save, Loader2, Plus, Edit, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Treatment {
  id: string;
  name: string;
  description?: string;
  default_duration: number;
  default_price?: number;
  cas?: number;
  category?: string;
  is_active: boolean;
  created_at: string;
}

export function TreatmentsManagement() {
  const { toast } = useToast();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Treatment>>({});
  
  // Dialog for new treatment
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTreatment, setNewTreatment] = useState({
    name: '',
    category: '',
    default_duration: 30,
    default_price: 0,
    cas: 0,
    description: '',
  });

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setTreatments(data || []);
    } catch (error) {
      console.error('Error fetching treatments:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca intervențiile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatments();
  }, []);

  // Normalize text for search
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const filteredTreatments = useMemo(() => {
    if (!searchTerm.trim()) return treatments;
    const searchNormalized = normalizeText(searchTerm);
    return treatments.filter(t => 
      normalizeText(t.name).includes(searchNormalized) ||
      (t.category && normalizeText(t.category).includes(searchNormalized))
    );
  }, [treatments, searchTerm]);

  // Group by category
  const groupedTreatments = useMemo(() => {
    return filteredTreatments.reduce((acc, treatment) => {
      const category = treatment.category || 'Fără categorie';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(treatment);
      return acc;
    }, {} as Record<string, Treatment[]>);
  }, [filteredTreatments]);

  const sortedCategories = Object.keys(groupedTreatments).sort();

  const handleStartEdit = (treatment: Treatment) => {
    setEditingId(treatment.id);
    setEditValues({
      name: treatment.name,
      default_price: treatment.default_price || 0,
      default_duration: treatment.default_duration,
      cas: treatment.cas || 0,
      category: treatment.category || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('treatments')
        .update({
          name: editValues.name,
          default_price: editValues.default_price,
          default_duration: editValues.default_duration,
          cas: editValues.cas,
          category: editValues.category || null,
        })
        .eq('id', editingId);

      if (error) throw error;
      
      toast({ title: 'Succes', description: 'Intervenția a fost actualizată' });
      setEditingId(null);
      setEditValues({});
      fetchTreatments();
    } catch (error) {
      console.error('Error updating treatment:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza intervenția',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (treatment: Treatment) => {
    try {
      const { error } = await supabase
        .from('treatments')
        .update({ is_active: !treatment.is_active })
        .eq('id', treatment.id);

      if (error) throw error;
      fetchTreatments();
    } catch (error) {
      console.error('Error toggling treatment status:', error);
    }
  };

  const handleDeleteTreatment = async (id: string) => {
    try {
      const { error } = await supabase.from('treatments').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Succes', description: 'Intervenția a fost ștearsă' });
      fetchTreatments();
    } catch (error) {
      console.error('Error deleting treatment:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge intervenția',
        variant: 'destructive',
      });
    }
  };

  const handleCreateTreatment = async () => {
    if (!newTreatment.name.trim()) {
      toast({
        title: 'Eroare',
        description: 'Numele intervenției este obligatoriu',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('treatments')
        .insert({
          name: newTreatment.name.trim(),
          category: newTreatment.category.trim() || null,
          default_duration: newTreatment.default_duration,
          default_price: newTreatment.default_price,
          cas: newTreatment.cas,
          description: newTreatment.description.trim() || null,
          is_active: true,
        });

      if (error) throw error;
      
      toast({ title: 'Succes', description: 'Intervenția a fost creată' });
      setDialogOpen(false);
      setNewTreatment({
        name: '',
        category: '',
        default_duration: 30,
        default_price: 0,
        cas: 0,
        description: '',
      });
      fetchTreatments();
    } catch (error) {
      console.error('Error creating treatment:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut crea intervenția',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută intervenție..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Adaugă Intervenție
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>Total: {treatments.length} intervenții</span>
        <span>Active: {treatments.filter(t => t.is_active).length}</span>
        <span>Inactive: {treatments.filter(t => !t.is_active).length}</span>
      </div>

      {/* Treatments by category */}
      <div className="space-y-6">
        {sortedCategories.map((category) => (
          <Card key={category}>
            <CardContent className="p-0">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <h3 className="font-semibold text-sm">{category}</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Nume</TableHead>
                    <TableHead className="w-[120px]">Preț (lei)</TableHead>
                    <TableHead className="w-[100px]">Durată (min)</TableHead>
                    <TableHead className="w-[100px]">CAS</TableHead>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead className="w-[120px]">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedTreatments[category].map((treatment) => (
                    <TableRow 
                      key={treatment.id} 
                      className={!treatment.is_active ? 'opacity-50' : ''}
                    >
                      {editingId === treatment.id ? (
                        <>
                          <TableCell>
                            <Input
                              value={editValues.name || ''}
                              onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={editValues.default_price || 0}
                              onChange={(e) => setEditValues({ ...editValues, default_price: parseFloat(e.target.value) || 0 })}
                              className="h-8 w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={editValues.default_duration || 30}
                              onChange={(e) => setEditValues({ ...editValues, default_duration: parseInt(e.target.value) || 30 })}
                              className="h-8 w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={editValues.cas || 0}
                              onChange={(e) => setEditValues({ ...editValues, cas: parseFloat(e.target.value) || 0 })}
                              className="h-8 w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant={treatment.is_active ? 'default' : 'secondary'}>
                              {treatment.is_active ? 'Activ' : 'Inactiv'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="h-8 w-8 text-green-600"
                              >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancelEdit}
                                className="h-8 w-8"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-medium">{treatment.name}</TableCell>
                          <TableCell>{treatment.default_price?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>{treatment.default_duration}</TableCell>
                          <TableCell>{treatment.cas?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>
                            <Switch
                              checked={treatment.is_active}
                              onCheckedChange={() => handleToggleActive(treatment)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStartEdit(treatment)}
                                className="h-8 w-8"
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
                                    <AlertDialogTitle>Ștergeți intervenția?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Această acțiune nu poate fi anulată. Intervenția "{treatment.name}" va fi ștearsă definitiv.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Anulează</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteTreatment(treatment.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Șterge
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {filteredTreatments.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? `Nicio intervenție găsită pentru "${searchTerm}"` : 'Nu există intervenții'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Treatment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adaugă Intervenție Nouă</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="treatment-name">Nume *</Label>
              <Input
                id="treatment-name"
                value={newTreatment.name}
                onChange={(e) => setNewTreatment({ ...newTreatment, name: e.target.value })}
                placeholder="Ex: Detartraj"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="treatment-category">Categorie</Label>
              <Input
                id="treatment-category"
                value={newTreatment.category}
                onChange={(e) => setNewTreatment({ ...newTreatment, category: e.target.value })}
                placeholder="Ex: Profilaxie"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="treatment-price">Preț (lei)</Label>
                <Input
                  id="treatment-price"
                  type="number"
                  value={newTreatment.default_price}
                  onChange={(e) => setNewTreatment({ ...newTreatment, default_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="treatment-duration">Durată (min)</Label>
                <Input
                  id="treatment-duration"
                  type="number"
                  value={newTreatment.default_duration}
                  onChange={(e) => setNewTreatment({ ...newTreatment, default_duration: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="treatment-cas">CAS</Label>
                <Input
                  id="treatment-cas"
                  type="number"
                  value={newTreatment.cas}
                  onChange={(e) => setNewTreatment({ ...newTreatment, cas: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="treatment-desc">Descriere</Label>
              <Input
                id="treatment-desc"
                value={newTreatment.description}
                onChange={(e) => setNewTreatment({ ...newTreatment, description: e.target.value })}
                placeholder="Descriere opțională..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Anulează
            </Button>
            <Button onClick={handleCreateTreatment} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Se salvează...' : 'Adaugă'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
