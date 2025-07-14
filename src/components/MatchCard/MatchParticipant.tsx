
interface Props {
  team: {
    logo?: string;
    name: string;
    shortName: string;
    record?: string;
  };
}

const TeamImage = ({ logo, name, shortName }: { logo?: string; name: string; shortName: string }) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
    const parent = e.currentTarget.parentElement;
    if (parent) {
      parent.innerHTML = shortName.substring(0, 2);
      parent.className += ' text-xs font-semibold text-muted-foreground';
    }
  };

  if (!logo) {
    return <span className="text-xs font-semibold text-muted-foreground">{shortName.substring(0, 2)}</span>;
  }

  return (
    <img 
      src={logo} 
      alt={name} 
      className="w-8 h-8 object-contain rounded-full transition-transform hover:scale-110"
      onError={handleImageError}
      loading="lazy"
    />
  );
};

const MatchParticipant = ({ team }: Props) => (
  <div className="text-center group">
    <div className="w-12 h-12 bg-card border border-border rounded-full mx-auto mb-2 flex items-center justify-center transition-all group-hover:shadow-lg group-hover:scale-105">
      <TeamImage logo={team.logo} name={team.name} shortName={team.shortName} />
    </div>
    <div className="text-sm font-medium truncate text-foreground">{team.shortName}</div>
    {team.record && (
      <div className="text-xs text-muted-foreground font-mono">{team.record}</div>
    )}
  </div>
);

export default MatchParticipant;
