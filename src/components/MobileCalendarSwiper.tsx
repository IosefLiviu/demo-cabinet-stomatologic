import { useRef, useCallback, type ReactNode } from 'react';
import { Cabinet } from '@/hooks/useCabinets';
import { cn } from '@/lib/utils';

const cabinetDotColors: Record<number, string> = {
  1: 'bg-cabinet-1',
  2: 'bg-cabinet-2',
  3: 'bg-cabinet-3',
  4: 'bg-cabinet-4',
  5: 'bg-cabinet-5',
};

interface MobileCalendarSwiperProps {
  selectedCabinet: number | null;
  onSelectCabinet: (cabinetId: number) => void;
  cabinets: Cabinet[];
  children: ReactNode;
}

export function MobileCalendarSwiper({
  selectedCabinet,
  onSelectCabinet,
  cabinets,
  children,
}: MobileCalendarSwiperProps) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const swiping = useRef(false);

  const currentIndex = cabinets.findIndex((c) => c.id === selectedCabinet);

  const swipeTo = useCallback(
    (direction: 'left' | 'right') => {
      if (cabinets.length === 0) return;
      let newIndex: number;
      if (direction === 'left') {
        // swipe left = next cabinet
        newIndex = currentIndex + 1;
        if (newIndex >= cabinets.length) return;
      } else {
        // swipe right = previous cabinet
        newIndex = currentIndex - 1;
        if (newIndex < 0) return;
      }
      onSelectCabinet(cabinets[newIndex].id);
    },
    [cabinets, currentIndex, onSelectCabinet]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    // Only register as horizontal swipe if horizontal movement > vertical
    if (Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      swiping.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || !swiping.current) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(deltaX) > 50) {
        swipeTo(deltaX < 0 ? 'left' : 'right');
      }
      touchStartX.current = null;
      touchStartY.current = null;
      swiping.current = false;
    },
    [swipeTo]
  );

  return (
    <div>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 py-2">
        {cabinets.map((cabinet, index) => (
          <button
            key={cabinet.id}
            onClick={() => onSelectCabinet(cabinet.id)}
            className={cn(
              'rounded-full transition-all',
              index === currentIndex
                ? cn('w-6 h-2.5', cabinetDotColors[cabinet.id] || 'bg-primary')
                : 'w-2.5 h-2.5 bg-muted-foreground/30'
            )}
            aria-label={cabinet.name}
          />
        ))}
      </div>
    </div>
  );
}
