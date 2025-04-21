
interface Props {
  team: {
    logo?: string;
    name: string;
    shortName: string;
    record?: string;
  };
}

const MatchParticipant = ({ team }: Props) => (
  <div className="text-center">
    <div className="w-10 h-10 bg-navy-50 dark:bg-navy-700 rounded-full mx-auto mb-1 flex items-center justify-center">
      {team.logo ? (
        <img 
          src={team.logo} 
          alt={team.name} 
          className="w-8 h-8 object-contain rounded-full"
        />
      ) : (
        team.shortName.substring(0, 2)
      )}
    </div>
    <div className="text-sm font-medium truncate">{team.shortName}</div>
    <div className="text-xs text-muted-foreground">{team.record}</div>
  </div>
);

export default MatchParticipant;
