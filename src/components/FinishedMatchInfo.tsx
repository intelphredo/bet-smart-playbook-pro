import { Match } from "@/types";
import MatchOutcomeBadges from "./MatchOutcomeBadges";
import MatchOutcomeReasoning from "./MatchOutcomeReasoning";

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
    </div>
  );
};

export default FinishedMatchInfo;
