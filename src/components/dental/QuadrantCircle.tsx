import { cn } from '@/lib/utils';

// FDI quadrant definitions
const Q1 = [18, 17, 16, 15, 14, 13, 12, 11];
const Q2 = [21, 22, 23, 24, 25, 26, 27, 28];
const Q3 = [31, 32, 33, 34, 35, 36, 37, 38];
const Q4 = [48, 47, 46, 45, 44, 43, 42, 41];
const UPPER = [...Q1, ...Q2];
const LOWER = [...Q4, ...Q3];

interface QuadrantCircleProps {
  /** Currently highlighted teeth (to determine active zones) */
  selectedTeeth?: number[];
  /** Called when a zone is clicked, with the array of teeth in that zone */
  onZoneClick?: (teeth: number[]) => void;
  /** Size in px (width & height) */
  size?: number;
  className?: string;
}

export function QuadrantCircle({
  selectedTeeth = [],
  onZoneClick,
  size = 90,
  className,
}: QuadrantCircleProps) {
  const cx = 65, cy = 65, r = 56;
  const bandTop = 30, bandBot = 100;
  const chordHalf = (y: number) => Math.sqrt(r * r - (y - cy) * (y - cy));

  const xL_top = cx - chordHalf(bandTop);
  const xR_top = cx + chordHalf(bandTop);
  const xL_bot = cx - chordHalf(bandBot);
  const xR_bot = cx + chordHalf(bandBot);

  const isGroupActive = (teeth: number[]) =>
    selectedTeeth.length > 0 && teeth.some(t => selectedTeeth.includes(t));

  const zones = [
    {
      key: 'maxilar',
      path: `M${xL_top},${bandTop} A${r},${r} 0 0,1 ${xR_top},${bandTop} Z`,
      labelX: 65, labelY: 19, label: 'MAX', fontSize: 6,
      teeth: UPPER,
    },
    {
      key: 'q1',
      path: `M${xL_top},${bandTop} A${r},${r} 0 0,0 ${cx - r},${cy} L${cx},${cy} L${cx},${bandTop} Z`,
      labelX: 38, labelY: 48, label: '1', fontSize: 14,
      teeth: Q1,
    },
    {
      key: 'q2',
      path: `M${cx},${bandTop} L${xR_top},${bandTop} A${r},${r} 0 0,1 ${cx + r},${cy} L${cx},${cy} Z`,
      labelX: 92, labelY: 48, label: '2', fontSize: 14,
      teeth: Q2,
    },
    {
      key: 'q3',
      path: `M${cx},${cy} L${cx + r},${cy} A${r},${r} 0 0,1 ${xR_bot},${bandBot} L${cx},${bandBot} Z`,
      labelX: 92, labelY: 84, label: '3', fontSize: 14,
      teeth: Q3,
    },
    {
      key: 'q4',
      path: `M${cx - r},${cy} L${cx},${cy} L${cx},${bandBot} L${xL_bot},${bandBot} A${r},${r} 0 0,1 ${cx - r},${cy} Z`,
      labelX: 38, labelY: 84, label: '4', fontSize: 14,
      teeth: Q4,
    },
    {
      key: 'mandibular',
      path: `M${xL_bot},${bandBot} L${xR_bot},${bandBot} A${r},${r} 0 0,1 ${xL_bot},${bandBot} Z`,
      labelX: 65, labelY: 112, label: 'MND', fontSize: 6,
      teeth: LOWER,
    },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 130 130"
      className={cn('select-none', className)}
    >
      <defs>
        <linearGradient id="qcm-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7f2e8" />
          <stop offset="25%" stopColor="#f0e9d8" />
          <stop offset="55%" stopColor="#e6ddca" />
          <stop offset="85%" stopColor="#d8ceb8" />
          <stop offset="100%" stopColor="#cfc4aa" />
        </linearGradient>
        <linearGradient id="qcm-hl" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.35" />
          <stop offset="40%" stopColor="white" stopOpacity="0.1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="qcm-sh" cx="0.5" cy="0.6" r="0.5">
          <stop offset="70%" stopColor="transparent" />
          <stop offset="100%" stopColor="#a0926e" stopOpacity="0.12" />
        </radialGradient>
      </defs>

      {/* Drop shadow */}
      <circle cx="66.2" cy="66.5" r={r} fill="rgba(0,0,0,0.06)" />

      {/* Base fill */}
      <circle cx={cx} cy={cy} r={r} fill="url(#qcm-fill)" stroke="#c4b898" strokeWidth="0.7" />
      <circle cx={cx} cy={cy} r={r} fill="url(#qcm-sh)" />
      <circle cx={cx} cy={cy} r={r} fill="url(#qcm-hl)" />

      {/* Clickable zones */}
      {zones.map(z => {
        const active = isGroupActive(z.teeth);
        return (
          <g
            key={z.key}
            className={onZoneClick ? 'cursor-pointer' : undefined}
            onClick={() => onZoneClick?.(z.teeth)}
          >
            <path
              d={z.path}
              fill={active ? 'hsl(var(--primary) / 0.18)' : 'transparent'}
              className="transition-colors duration-200 hover:fill-[hsl(var(--primary)/0.1)]"
            />
            <text
              x={z.labelX}
              y={z.labelY}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={z.fontSize}
              fontWeight={z.fontSize > 10 ? '700' : '600'}
              letterSpacing={z.fontSize > 10 ? undefined : '0.5'}
              fill={active ? 'hsl(var(--primary))' : '#b8a680'}
              className="pointer-events-none transition-colors duration-200"
              opacity={active ? 1 : 0.6}
            >
              {z.label}
            </text>
          </g>
        );
      })}

      {/* Divider lines */}
      <line x1={cx - chordHalf(bandTop)} y1={bandTop} x2={cx + chordHalf(bandTop)} y2={bandTop} stroke="#b8a680" strokeWidth="1.5" opacity="0.5" />
      <line x1={cx - chordHalf(bandBot)} y1={bandBot} x2={cx + chordHalf(bandBot)} y2={bandBot} stroke="#b8a680" strokeWidth="1.5" opacity="0.5" />
      <line x1={cx} y1={bandTop} x2={cx} y2={bandBot} stroke="#b8a680" strokeWidth="2" opacity="0.7" />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#b8a680" strokeWidth="2" opacity="0.7" />
    </svg>
  );
}
