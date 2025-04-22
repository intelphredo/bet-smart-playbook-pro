import { Match } from "@/types";

interface MatchOutcomeReasoningProps {
  match: Match;
  isCorrect: boolean | null;
}

function personalizeReasoning(match: Match, isCorrect: boolean | null): string {
  if (isCorrect === null) {
    return "No prediction or score available to analyze outcome.";
  }
  const { prediction, smartScore, score } = match;
  const team =
    prediction?.recommended === "home"
      ? match.homeTeam.shortName
      : prediction?.recommended === "away"
      ? match.awayTeam.shortName
      : prediction?.recommended === "draw"
      ? "Draw"
      : "";

  const pointsDiff =
    score && typeof score.home === "number" && typeof score.away === "number"
      ? Math.abs(score.home - score.away)
      : null;

  const confidence = prediction?.confidence;
  const smartScoreOverall = smartScore?.overall;
  const reasoningLines: string[] = [];

  // 'Correct' outcome
  if (isCorrect) {
    reasoningLines.push(
      `Model correctly predicted ${team} as the outcome${confidence ? `, with ${confidence}% confidence.` : "."}`
    );
    if (smartScoreOverall && smartScoreOverall >= 70) {
      reasoningLines.push(
        `The SmartScore™ (${smartScoreOverall}) reflected strong statistical support for this pick.`
      );
    }
    if (typeof pointsDiff === "number") {
      if (pointsDiff === 0 && prediction?.recommended === "draw") {
        reasoningLines.push(
          "It was anticipated to be a close contest and a draw, which matched the final score—a sign of high model accuracy in identifying evenly matched teams."
        );
      } else if (pointsDiff >= 15) {
        reasoningLines.push(
          `A decisive victory (margin: ${pointsDiff}) means the model picked up on a clear disparity between the teams.`
        );
      } else if (pointsDiff >= 7) {
        reasoningLines.push(
          `The significant win margin (${pointsDiff}) aligns with key momentum or value indicators found by the algorithm.`
        );
      } else if (pointsDiff > 0) {
        reasoningLines.push(
          `A narrow win (${pointsDiff}) shows the model flagged a close matchup—small advantages can decide tight games.`
        );
      }
    }
    if (smartScore?.recommendation?.reasoning) {
      reasoningLines.push(
        `Main rationale: ${smartScore.recommendation.reasoning}`
      );
    }
    // Add edge case: low confidence but correct
    if (confidence && confidence <= 55) {
      reasoningLines.push(
        "Although the confidence was not high, this outcome supports the model’s risk-aware selections."
      );
    }
  }
  // 'Incorrect' outcome
  else {
    let base = `Prediction (${team}`;
    if (confidence) base += `, ${confidence}% confidence`;
    base +=
      ") did not match the actual result. " +
      (smartScoreOverall
        ? `Predicted SmartScore™: ${smartScoreOverall}. `
        : "");
    reasoningLines.push(base);

    if (typeof pointsDiff === "number") {
      if (pointsDiff >= 15) {
        reasoningLines.push(
          "A wide margin of defeat suggests impactful factors—like late lineup changes, unexpected injuries, or momentum swings—were not captured by available data."
        );
      } else if (pointsDiff >= 7) {
        reasoningLines.push(
          "A clear win by the opposite team may have involved emerging trends the model did not fully weigh."
        );
      } else if (pointsDiff > 0) {
        reasoningLines.push(
          "A close result indicates that the game could have swung either way. Tiny performance variations or critical plays proved decisive."
        );
      } else if (pointsDiff === 0 && prediction?.recommended !== "draw") {
        reasoningLines.push(
          "A draw, when the model expected a winner, points to stronger-than-expected parity between these teams."
        );
      }
    }
    if (smartScore?.recommendation?.reasoning) {
      reasoningLines.push(
        `Model rationale: ${smartScore.recommendation.reasoning}`
      );
    }
    if (confidence && confidence >= 70) {
      reasoningLines.push(
        "Despite high confidence, this miss suggests possible data gaps or highly volatile matchup factors."
      );
    }
    reasoningLines.push(
      "For future picks, including more granular live stats or injury updates could boost model accuracy."
    );
  }
  return reasoningLines.join(" ");
}

const MatchOutcomeReasoning = ({ match, isCorrect }: MatchOutcomeReasoningProps) => {
  return (
    <div className="pl-1 space-y-1 text-xs text-muted-foreground italic">
      {personalizeReasoning(match, isCorrect)}
    </div>
  );
};

export default MatchOutcomeReasoning;
