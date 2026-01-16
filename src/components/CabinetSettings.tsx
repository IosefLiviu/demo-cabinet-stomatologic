import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Cabinet } from '@/hooks/useCabinets';
import { Pencil, Check, X } from 'lucide-react';

interface CabinetSettingsProps {
  open: boolean;
  onClose: () => void;
  cabinets: Cabinet[];
  onUpdateDoctor: (cabinetId: number, doctor: string) => Promise<void>;
}

export function CabinetSettings({ open, onClose, cabinets, onUpdateDoctor }: CabinetSettingsProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (cabinet: Cabinet) => {
    setEditingId(cabinet.id);
    setEditValue(cabinet.doctor);
  };

  const handleSave = async (cabinetId: number) => {
    if (editValue.trim()) {
      await onUpdateDoctor(cabinetId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Setări Cabinete</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {cabinets.map((cabinet) => (
            <div key={cabinet.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  {cabinet.name}
                </Label>
                
                {editingId === cabinet.id ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-8"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave(cabinet.id);
                        if (e.key === 'Escape') handleCancel();
                      }}
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-green-600"
                      onClick={() => handleSave(cabinet.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-red-600"
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-semibold">{cabinet.doctor}</span>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8"
                      onClick={() => handleEdit(cabinet)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Închide
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
