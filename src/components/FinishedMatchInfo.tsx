
import { Match } from "@/types/sports";
import MatchOutcomeBadges from "./MatchOutcomeBadges";
import MatchOutcomeReasoning from "./MatchOutcomeReasoning";
import { useUpdateAlgorithmResults } from "@/hooks/useUpdateAlgorithmResults";
import { useSavePrediction } from "@/hooks/useSavePrediction";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

/**
 * Utility function to determine prediction correctness
 */
function isPredictionCorrect(match: any) {
  if (!match.prediction || !match.score) return null;
  const { recommended } = match.prediction;
  if (recommended === "home" && match.score.home > match.score.away) return true;
  if (recommended === "away" && match.score.away > match.score.home) return true;
  if (recommended === "draw" && match.score.home === match.score.away) return true;
  return false;
}

interface Props {
  match: Match;
}

const FinishedMatchInfo = ({ match }: Props) => {
  const correct = isPredictionCorrect(match);
  const [isUpdated, setIsUpdated] = useState(false);
  
  // Get the mutation hooks
  const savePrediction = useSavePrediction();
  const updateResults = useUpdateAlgorithmResults();

  // Auto-update for finished matches
  useEffect(() => {
    // Only update if the match has a prediction and score and is finished
    if (match.status === "finished" && match.prediction && match.score && !isUpdated) {
      updateResults.mutate(match, {
        onSuccess: () => {
          console.log(`Automatically updated results for match: ${match.id}`);
          setIsUpdated(true);
        }
      });
    }
  }, [match, updateResults, isUpdated]);
  
  const handleSavePrediction = () => {
    savePrediction.mutate(match);
  };

  const handleUpdateResults = () => {
    updateResults.mutate(match);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <MatchOutcomeBadges match={match} isCorrect={correct} />
        <span className="text-xs text-muted-foreground">
          Algo pick:
          <span className="font-bold ml-1 uppercase">
            {match.prediction?.recommended === "home"
              ? match.homeTeam.shortName
              : match.prediction?.recommended === "away"
              ? match.awayTeam.shortName
              : "Draw"}
          </span>
        </span>
        <span className="text-xs text-muted-foreground ml-2">{match.prediction?.confidence}%</span>
      </div>
      <div className="mt-2">
        {match.smartScore?.recommendation?.reasoning ? (
          <div>
            <span className="font-semibold text-navy-600 dark:text-navy-200">
              Reason:{" "}
            </span>
            {match.smartScore.recommendation.reasoning}
          </div>
        ) : match.prediction?.recommended ? (
          <div>
            <span className="font-semibold text-navy-600 dark:text-navy-200">
              Reason:{" "}
            </span>
            Prediction based on statistical edge from available match data.
          </div>
        ) : null}
        <MatchOutcomeReasoning match={match} isCorrect={correct} />
      </div>
      
      {/* Add manual update buttons for debugging */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleSavePrediction} 
          disabled={savePrediction.isPending}
        >
          {savePrediction.isPending ? "Saving..." : "Save Prediction"}
        </Button>
        
        {match.status === "finished" && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleUpdateResults}
            disabled={updateResults.isPending}
          >
            {updateResults.isPending ? "Updating..." : "Update Result"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default FinishedMatchInfo;
