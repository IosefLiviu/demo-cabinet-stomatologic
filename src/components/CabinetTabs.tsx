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
    <div className="flex flex-wrap gap-1.5 sm:gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => onSelectCabinet(null)}
        className={cn(
          "px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap",
          selectedCabinet === null
            ? "bg-primary text-primary-foreground shadow-md"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        )}
      >
        Toate
      </button>
      {cabinets.map((cabinet) => (
        <button
          key={cabinet.id}
          onClick={() => onSelectCabinet(cabinet.id)}
          className={cn(
            "px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap",
            selectedCabinet === cabinet.id
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          <span
            className={cn(
              "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0",
              cabinetColors[cabinet.id] || 'bg-gray-400'
            )}
          />
          <span className="hidden sm:inline">{cabinet.name}</span>
          <span className="sm:hidden">C{cabinet.id}</span>
        </button>
      ))}
    </div>
  );
}
