
import { Card, CardContent } from "@/components/ui/card";
import PlayerPropCard from "@/components/PlayerPropCard";
import { PlayerProp, Match, League } from "@/types/sports";

interface Props {
  filteredProps: PlayerProp[];
}

const PlayerPropsSection = ({ filteredProps }: Props) => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold">Player Props</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredProps.length > 0 ? (
        filteredProps.map(prop => (
          <PlayerPropCard key={prop.id} prop={prop} />
        ))
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p>No player props available for this league.</p>
          </CardContent>
        </Card>
      )}
    </div>
  </div>
);

export default PlayerPropsSection;
