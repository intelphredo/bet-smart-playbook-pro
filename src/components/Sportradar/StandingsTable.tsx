import { useState, useMemo } from 'react';
import { SportLeague, SportradarStanding } from '@/types/sportradar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown, Minus, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StandingsTableProps {
  league: SportLeague;
  standings: SportradarStanding[];
  isLoading?: boolean;
  compact?: boolean;
}

type SortField = 'rank' | 'wins' | 'losses' | 'winPct' | 'gamesBack' | 'pointsFor' | 'pointsAgainst' | 'pointDiff';
type SortDirection = 'asc' | 'desc';

export function StandingsTable({ league, standings, isLoading, compact = false }: StandingsTableProps) {
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'rank' ? 'asc' : 'desc');
    }
  };

  const sortedStandings = useMemo(() => {
    if (!standings) return [];
    
    return [...standings].sort((a, b) => {
      let aVal: number, bVal: number;
      
      switch (sortField) {
        case 'rank':
          aVal = a.confRank || 0;
          bVal = b.confRank || 0;
          break;
        case 'wins':
          aVal = a.wins;
          bVal = b.wins;
          break;
        case 'losses':
          aVal = a.losses;
          bVal = b.losses;
          break;
        case 'winPct':
          aVal = a.winPct;
          bVal = b.winPct;
          break;
        case 'gamesBack':
          aVal = a.gamesBack || 0;
          bVal = b.gamesBack || 0;
          break;
        case 'pointsFor':
          aVal = a.pointsFor || 0;
          bVal = b.pointsFor || 0;
          break;
        case 'pointsAgainst':
          aVal = a.pointsAgainst || 0;
          bVal = b.pointsAgainst || 0;
          break;
        case 'pointDiff':
          aVal = a.pointDiff || 0;
          bVal = b.pointDiff || 0;
          break;
        default:
          return 0;
      }
      
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [standings, sortField, sortDirection]);

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        )}
      </div>
    </TableHead>
  );

  const getPlayoffBadge = (position?: string) => {
    if (!position) return null;
    
    const styles: Record<string, string> = {
      clinched: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      in: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
      wildcard: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
      out: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
      eliminated: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
    };
    
    const labels: Record<string, string> = {
      clinched: 'x',
      in: 'in',
      wildcard: 'WC',
      out: 'out',
      eliminated: 'E',
    };
    
    return (
      <Badge variant="outline" className={cn('text-xs px-1.5 py-0', styles[position])}>
        {labels[position]}
      </Badge>
    );
  };

  const getStreakBadge = (streak?: { kind: 'win' | 'loss'; length: number }) => {
    if (!streak) return <Minus className="h-3 w-3 text-muted-foreground" />;
    
    const isWin = streak.kind === 'win';
    return (
      <Badge 
        variant="outline" 
        className={cn(
          'text-xs px-1.5 py-0 font-mono',
          isWin 
            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
            : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
        )}
      >
        {isWin ? 'W' : 'L'}{streak.length}
      </Badge>
    );
  };

  const getPointDiffDisplay = (diff?: number) => {
    if (diff === undefined) return null;
    return (
      <span className={cn(
        'font-mono text-sm',
        diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
        diff < 0 ? 'text-red-600 dark:text-red-400' : 
        'text-muted-foreground'
      )}>
        {diff > 0 ? '+' : ''}{diff.toFixed(1)}
      </span>
    );
  };

  const isSoccerLeague = league === 'SOCCER';

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No standings data available
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <SortableHeader field="rank">
              <span className="text-xs font-medium">#</span>
            </SortableHeader>
            <TableHead className="min-w-[140px]">Team</TableHead>
            <SortableHeader field="wins">W</SortableHeader>
            <SortableHeader field="losses">{isSoccerLeague ? 'D' : 'L'}</SortableHeader>
            {isSoccerLeague && <TableHead>L</TableHead>}
            <SortableHeader field="winPct">{isSoccerLeague ? 'PTS' : 'PCT'}</SortableHeader>
            {!isSoccerLeague && <SortableHeader field="gamesBack">GB</SortableHeader>}
            <TableHead>STRK</TableHead>
            {!compact && (
              <>
                <TableHead className="hidden md:table-cell">HOME</TableHead>
                <TableHead className="hidden md:table-cell">AWAY</TableHead>
                <TableHead className="hidden lg:table-cell">L10</TableHead>
                <SortableHeader field="pointDiff">DIFF</SortableHeader>
              </>
            )}
            <TableHead className="text-center">PO</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStandings.map((team, index) => (
            <TableRow 
              key={team.teamId}
              className={cn(
                'transition-colors',
                team.playoffPosition === 'clinched' && 'bg-emerald-500/5',
                (team.playoffPosition === 'out' || team.playoffPosition === 'eliminated') && 'bg-red-500/5 opacity-75'
              )}
            >
              <TableCell className="font-medium text-center w-10">
                <div className="flex items-center justify-center gap-1">
                  {index === 0 && <Trophy className="h-3 w-3 text-amber-500" />}
                  <span className="text-muted-foreground">{index + 1}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs px-1.5 py-0.5 bg-muted rounded">
                    {team.alias || team.teamName.substring(0, 3).toUpperCase()}
                  </span>
                  <span className="font-medium truncate max-w-[100px]">{team.teamName}</span>
                </div>
              </TableCell>
              <TableCell className="font-mono">{team.wins}</TableCell>
              <TableCell className="font-mono">{isSoccerLeague ? (team.ties || 0) : team.losses}</TableCell>
              {isSoccerLeague && <TableCell className="font-mono">{team.losses}</TableCell>}
              <TableCell className="font-mono">
                {isSoccerLeague 
                  ? (team.wins * 3 + (team.ties || 0))
                  : team.winPct.toFixed(3).replace('0.', '.')
                }
              </TableCell>
              {!isSoccerLeague && (
                <TableCell className="font-mono text-muted-foreground">
                  {team.gamesBack === 0 ? '-' : team.gamesBack?.toFixed(1)}
                </TableCell>
              )}
              <TableCell>{getStreakBadge(team.streak)}</TableCell>
              {!compact && (
                <>
                  <TableCell className="hidden md:table-cell font-mono text-muted-foreground text-sm">
                    {team.homeRecord || '-'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-muted-foreground text-sm">
                    {team.awayRecord || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {team.last10 ? (
                      <span className="font-mono text-sm text-muted-foreground">{team.last10}</span>
                    ) : (
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              'w-2 h-2 rounded-full',
                              i < 3 ? 'bg-emerald-500' : 'bg-red-500'
                            )} 
                          />
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getPointDiffDisplay(team.pointDiff)}</TableCell>
                </>
              )}
              <TableCell className="text-center">
                {getPlayoffBadge(team.playoffPosition)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default StandingsTable;
