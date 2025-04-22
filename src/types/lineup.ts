
export interface MatchLineup {
  teamId: string;
  players: {
    playerId: string;
    playerName: string;
    position: string;
    isStarter: boolean;
    isInjured?: boolean;
    injuryStatus?: string;
  }[];
}
