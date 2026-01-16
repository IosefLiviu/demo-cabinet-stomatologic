import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Treatment {
  id: string;
  name: string;
  default_duration: number;
  default_price?: number;
  decont?: number;
  co_plata?: number;
  category?: string;
}

interface TreatmentListDialogProps {
  open: boolean;
  onClose: () => void;
  treatments: Treatment[];
  onSelectTreatment: (treatment: Treatment) => void;
}

export function TreatmentListDialog({
  open,
  onClose,
  treatments,
  onSelectTreatment,
}: TreatmentListDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTreatments = treatments.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setSearchTerm('');
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Lista de Intervenții</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută tratament..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Treatments List */}
        <ScrollArea className="flex-1 max-h-[60vh] -mx-6 px-6">
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
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <span className="font-bold text-sm">
                            {treatment.default_price?.toFixed(2) || '0.00'} lei
                          </span>
                          <div className="flex gap-2 text-xs">
                            {treatment.decont ? (
                              <span className="text-green-600 font-medium">
                                Decont: {treatment.decont.toFixed(2)}
                              </span>
                            ) : null}
                            {treatment.co_plata ? (
                              <span className="text-orange-600 font-medium">
                                Co-plată: {treatment.co_plata.toFixed(2)}
                              </span>
                            ) : null}
                          </div>
                        </div>
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
