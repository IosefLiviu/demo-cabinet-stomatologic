import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavigationButtonsProps {
  canGoBack: boolean;
  canGoForward: boolean;
  previousLabel?: string;
  nextLabel?: string;
  onBack: () => void;
  onForward: () => void;
}

const tabLabels: Record<string, string> = {
  'calendar': 'Calendar',
  'patients': 'Pacienți',
  'reports': 'Rapoarte',
  'expenses': 'Cheltuieli',
  'treatment-plan': 'Plan Tratament',
  'printabile': 'Printabile',
};

export function NavigationButtons({
  canGoBack,
  canGoForward,
  previousLabel,
  nextLabel,
  onBack,
  onForward,
}: NavigationButtonsProps) {
  const formatLabel = (label?: string) => {
    if (!label) return '';
    return tabLabels[label] || label;
  };

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!canGoBack}
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {canGoBack ? `Înapoi la ${formatLabel(previousLabel)}` : 'Nu există istoric'}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!canGoForward}
            onClick={onForward}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {canGoForward ? `Înainte la ${formatLabel(nextLabel)}` : 'Nu există istoric'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
