import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface Tooth3DCardProps {
  toothImage: string;
  toothNumber: number;
  isLower?: boolean;
  isHovered?: boolean;
  statusOverlay?: string;
  isMissing?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Tooth3DCard({
  toothImage,
  toothNumber,
  isLower = false,
  isHovered = false,
  statusOverlay,
  isMissing = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  disabled = false,
  className,
  children,
}: Tooth3DCardProps) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current || disabled) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate rotation based on mouse position relative to center
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Limit rotation to ±20 degrees
    const maxRotation = 20;
    const rotateYValue = (mouseX / (rect.width / 2)) * maxRotation;
    const rotateXValue = -(mouseY / (rect.height / 2)) * maxRotation;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  }, [disabled]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    setIsActive(true);
    onMouseEnter?.();
  }, [onMouseEnter]);

  const handleMouseLeave = useCallback(() => {
    setIsActive(false);
    setRotateX(0);
    setRotateY(0);
    onMouseLeave?.();
  }, [onMouseLeave]);

  return (
    <div 
      className="relative"
      style={{ perspective: '500px' }}
    >
      <button
        ref={cardRef}
        type="button"
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={disabled}
        className={cn(
          'relative flex items-center justify-center transition-all duration-200 rounded-md overflow-visible',
          !disabled && 'cursor-pointer',
          className
        )}
        style={{
          transformStyle: 'preserve-3d',
          transform: isActive 
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.1)` 
            : 'rotateX(0) rotateY(0) scale(1)',
          transition: isActive 
            ? 'transform 0.1s ease-out' 
            : 'transform 0.3s ease-out',
        }}
      >
        {/* Card background with depth effect */}
        <div 
          className={cn(
            "absolute inset-0 rounded-md transition-shadow duration-200",
            isActive && "shadow-lg shadow-primary/20"
          )}
          style={{
            transform: 'translateZ(-5px)',
            background: isActive 
              ? 'linear-gradient(135deg, hsl(var(--muted)/0.3), transparent)' 
              : 'transparent',
          }}
        />
        
        {/* Tooth image container */}
        <div 
          className="relative w-full h-full"
          style={{
            transform: 'translateZ(10px)',
          }}
        >
          <img 
            src={toothImage} 
            alt={`Dinte ${toothNumber}`}
            className={cn(
              "w-full h-full object-contain drop-shadow-md",
              isMissing && 'opacity-30 grayscale',
              isLower && 'rotate-180'
            )}
            style={{
              filter: isActive && !isMissing
                ? 'drop-shadow(0 8px 12px rgba(0,0,0,0.25))' 
                : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            }}
          />
          
          {/* Status overlay */}
          {statusOverlay && !isMissing && (
            <div 
              className={cn("absolute inset-0 pointer-events-none rounded-md", statusOverlay)}
              style={{ transform: 'translateZ(5px)' }}
            />
          )}
        </div>

        {/* Shine effect on hover */}
        {isActive && !isMissing && (
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-md"
            style={{ transform: 'translateZ(15px)' }}
          >
            <div 
              className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent"
              style={{
                transform: `translateX(${rotateY * 2}px) translateY(${-rotateX * 2}px)`,
              }}
            />
          </div>
        )}
      </button>
      
      {/* Children (tooltips, etc.) rendered outside the 3D context */}
      {children}
    </div>
  );
}
