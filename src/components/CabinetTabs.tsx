import { cn } from '@/lib/utils';
import { Cabinet } from '@/hooks/useCabinets';

interface CabinetTabsProps {
  selectedCabinet: number | null;
  onSelectCabinet: (cabinetId: number | null) => void;
  cabinets: Cabinet[];
}

const cabinetColors: Record<number, string> = {
  1: 'bg-cabinet-1',
  2: 'bg-cabinet-2',
  3: 'bg-cabinet-3',
  4: 'bg-cabinet-4',
  5: 'bg-cabinet-5',
};

export function CabinetTabs({ selectedCabinet, onSelectCabinet, cabinets }: CabinetTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelectCabinet(null)}
        className={cn(
          "px-4 py-2 rounded-lg font-medium text-sm transition-all",
          selectedCabinet === null
            ? "bg-primary text-primary-foreground shadow-md"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        )}
      >
        Toate cabinetele
      </button>
      {cabinets.map((cabinet) => (
        <button
          key={cabinet.id}
          onClick={() => onSelectCabinet(cabinet.id)}
          className={cn(
            "px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2",
            selectedCabinet === cabinet.id
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          <span
            className={cn(
              "w-2.5 h-2.5 rounded-full",
              cabinetColors[cabinet.id] || 'bg-gray-400'
            )}
          />
          {cabinet.name}
        </button>
      ))}
    </div>
  );
}
