import { useMemo } from 'react';
import { BettingTrend } from '@/types/bettingTrends';

interface LineMovementMiniChartProps {
  trend: BettingTrend;
  width?: number;
  height?: number;
}

export function LineMovementMiniChart({ trend, width = 120, height = 32 }: LineMovementMiniChartProps) {
  // Generate synthetic line movement path from open → current
  const points = useMemo(() => {
    const open = trend.lineMovement.openSpread;
    const current = trend.lineMovement.currentSpread;
    const steps = 8;
    const pts: number[] = [open];
    
    for (let i = 1; i < steps; i++) {
      const progress = i / steps;
      const base = open + (current - open) * progress;
      // Add some realistic noise
      const noise = (Math.sin(i * 2.7 + open) * 0.3) + (Math.cos(i * 1.3) * 0.2);
      pts.push(base + noise);
    }
    pts.push(current);
    return pts;
  }, [trend.lineMovement.openSpread, trend.lineMovement.currentSpread]);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const padding = 4;
  
  const pathD = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (p - min) / range) * (height - padding * 2);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  const movement = trend.lineMovement.spreadMovement;
  const color = Math.abs(movement) < 0.3 ? 'hsl(var(--muted-foreground))' 
    : movement > 0 ? 'hsl(142 71% 45%)' : 'hsl(0 84% 60%)';
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* End dot */}
      <circle 
        cx={padding + (width - padding * 2)} 
        cy={padding + (1 - (points[points.length - 1] - min) / range) * (height - padding * 2)}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}
