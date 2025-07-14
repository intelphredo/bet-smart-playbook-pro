
import { Match } from "@/types/sports";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

interface Props {
  match: Match;
  isCorrect: boolean | null;
}

const MatchOutcomeBadges = ({ match, isCorrect }: Props) => {
  return (
    <>
      {isCorrect === true && (
        <Badge className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-1 shadow-lg animate-fade-in">
          <Check className="w-4 h-4" /> Correct Pick
        </Badge>
      )}
      {isCorrect === false && (
        <Badge className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center gap-1 shadow-lg animate-fade-in">
          <X className="w-4 h-4" /> Incorrect Pick
        </Badge>
      )}
      {isCorrect === null && (
        <Badge variant="secondary" className="shadow-sm">
          Pending
        </Badge>
      )}
    </>
  );
};

export default MatchOutcomeBadges;
