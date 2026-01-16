import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TeamLogoImage } from '@/components/ui/TeamLogoImage';
import { League } from '@/types/sports';

interface Props {
  team: {
    logo?: string;
    name: string;
    shortName: string;
    record?: string;
  };
  injuryCount?: number;
  injuryImpact?: number;
  league?: League;
}

const getInjuryIndicator = (count: number, impact: number) => {
  if (count === 0) return null;
  
  // Determine severity based on impact or count
  const severity = impact >= 20 || count >= 3 ? 'high' : impact >= 10 || count >= 2 ? 'medium' : 'low';
  
  const colorClass = {
    high: 'text-destructive bg-destructive/10',
    medium: 'text-cyan-600 bg-cyan-500/10',
    low: 'text-cyan-400 bg-cyan-400/10'
  }[severity];
  
  return (
    <Badge variant="secondary" className={cn("h-4 text-[10px] gap-0.5 px-1", colorClass)}>
      <AlertTriangle className="h-2.5 w-2.5" />
      {count}
    </Badge>
  );
};

const MatchParticipant = ({ team, injuryCount = 0, injuryImpact = 0, league }: Props) => (
  <div className="text-center group">
    <div className="w-12 h-12 bg-card border border-border rounded-full mx-auto mb-2 flex items-center justify-center transition-all group-hover:shadow-lg group-hover:scale-105">
      <TeamLogoImage 
        teamName={team.name} 
        logoUrl={team.logo}
        league={league}
        size="sm"
        showFallback
      />
    </div>
    <div className="text-sm font-medium truncate text-foreground">{team.shortName}</div>
    {team.record && (
      <div className="text-xs text-muted-foreground font-mono">{team.record}</div>
    )}
    {injuryCount > 0 && (
      <div className="mt-1 flex justify-center">
        {getInjuryIndicator(injuryCount, injuryImpact)}
      </div>
    )}
  </div>
);

export default MatchParticipant;
