
export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  record?: string;
  recentForm?: string[];
  stats?: {
    [key: string]: number | string;
  };
}
