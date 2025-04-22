import { Match } from "@/types";
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
        <Badge className="bg-green-500 text-white flex items-center gap-1">
          <Check className="w-4 h-4" /> Correct Pick
        </Badge>
      )}
      {isCorrect === false && (
        <Badge className="bg-red-500 text-white flex items-center gap-1">
          <X className="w-4 h-4" /> Incorrect Pick
        </Badge>
      )}
      {isCorrect === null && (
        <Badge className="bg-gray-200 text-gray-600">N/A</Badge>
      )}
    </>
  );
};

export default MatchOutcomeBadges;
