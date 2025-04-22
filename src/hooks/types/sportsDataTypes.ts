
import { League, DataSource } from "@/types/sports";

export interface UseSportsDataOptions {
  league?: League | "ALL";
  refreshInterval?: number;
  includeSchedule?: boolean;
  includeTeams?: boolean;
  includePlayerStats?: boolean;
  includeStandings?: boolean;
  teamId?: string;
  defaultSource?: DataSource;
  useExternalApis?: boolean;
  preferredApiSource?: 'SPORTRADAR' | 'ODDSAPI' | 'ALL';
}
