import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Treatment {
  id: string;
  name: string;
  default_duration: number;
  default_price?: number;
  cas?: number;
  category?: string;
}

interface TreatmentListDialogProps {
  open: boolean;
  onClose: () => void;
  treatments: Treatment[];
  onSelectTreatment: (treatment: Treatment) => void;
  onTreatmentCreated?: () => void;
}

export function TreatmentListDialog({
  open,
  onClose,
  treatments,
  onSelectTreatment,
  onTreatmentCreated,
}: TreatmentListDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTreatment, setNewTreatment] = useState({
    name: '',
    category: '',
    default_duration: 30,
    default_price: 0,
    cas: 0,
  });

  // Normalize text by removing diacritics for search
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const filteredTreatments = treatments.filter(t => {
    const searchNormalized = normalizeText(searchTerm);
    return normalizeText(t.name).includes(searchNormalized) ||
      (t.category && normalizeText(t.category).includes(searchNormalized));
  });

  // Group treatments by category
  const groupedTreatments = filteredTreatments.reduce((acc, treatment) => {
    const category = treatment.category || 'Alte tratamente';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(treatment);
    return acc;
  }, {} as Record<string, Treatment[]>);

  const sortedCategories = Object.keys(groupedTreatments).sort();

  const handleSelect = (treatment: Treatment) => {
    onSelectTreatment(treatment);
    onClose();
  };

  const handleCreateTreatment = async () => {
    if (!newTreatment.name.trim()) {
      toast.error('Numele intervenției este obligatoriu');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('treatments')
        .insert({
          name: newTreatment.name.trim(),
          category: newTreatment.category.trim() || null,
          default_duration: newTreatment.default_duration,
          default_price: newTreatment.default_price,
          cas: newTreatment.cas,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Intervenția a fost creată cu succes');
      setNewTreatment({
        name: '',
        category: '',
        default_duration: 30,
        default_price: 0,
        cas: 0,
      });
      setShowCreateForm(false);
      onTreatmentCreated?.();
    } catch (error) {
      console.error('Error creating treatment:', error);
      toast.error('Eroare la crearea intervenției');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setSearchTerm('');
        setShowCreateForm(false);
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[700px] h-[85vh] overflow-hidden flex flex-col min-h-0">
        <DialogHeader>
          <DialogTitle>Lista de Intervenții</DialogTitle>
        </DialogHeader>

        {/* Create Button & Search */}
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant={showCreateForm ? "secondary" : "default"}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showCreateForm ? 'Anulează' : 'Creare Intervenție'}
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută tratament..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Create Treatment Form */}
        {showCreateForm && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <h4 className="font-medium">Creare Intervenție Nouă</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Nume Intervenție *</Label>
                <Input
                  placeholder="Ex: Detartraj"
                  value={newTreatment.name}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Categorie</Label>
                <Input
                  placeholder="Ex: Profilaxie"
                  value={newTreatment.category}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Durată (minute)</Label>
                <Input
                  type="number"
                  value={newTreatment.default_duration}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, default_duration: parseInt(e.target.value) || 30 }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Preț (lei)</Label>
                <Input
                  type="number"
                  value={newTreatment.default_price}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, default_price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CAS</Label>
                <Input
                  type="number"
                  value={newTreatment.cas}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, cas: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreateTreatment} disabled={creating}>
                {creating ? 'Se salvează...' : 'Salvează Intervenția'}
              </Button>
            </div>
          </div>
        )}

        {/* Treatments List */}
        <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
          <div className="space-y-4 pb-4">
            {sortedCategories.map((category) => (
              <div key={category} className="space-y-1">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide sticky top-0 bg-background py-2">
                  {category}
                </h3>
                <div className="space-y-1">
                  {groupedTreatments[category].map((treatment) => (
                    <button
                      key={treatment.id}
                      type="button"
                      onClick={() => handleSelect(treatment)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border transition-colors',
                        'hover:bg-accent hover:border-primary/50',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                      )}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{treatment.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Durată: {treatment.default_duration} min
                          </div>
                        </div>
                        <span className="font-bold text-sm shrink-0">
                          {treatment.default_price?.toFixed(2) || '0.00'} lei
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {filteredTreatments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Niciun tratament găsit pentru "{searchTerm}"
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
