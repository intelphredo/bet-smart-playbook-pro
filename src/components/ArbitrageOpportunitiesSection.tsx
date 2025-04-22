
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import PremiumContent from "@/components/PremiumContent";
import ArbitrageOpportunityCard from "@/components/ArbitrageOpportunityCard";
import { ArbitrageOpportunity, League } from "@/types/sports";

interface Props {
  selectedLeague: League | "ALL";
  arbitrageOpportunitiesToShow: ArbitrageOpportunity[];
}

const ArbitrageOpportunitiesSection = ({
  selectedLeague,
  arbitrageOpportunitiesToShow,
}: Props) => (
  <div className="space-y-4">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">Arbitrage Opportunities</h2>
        <Badge className="bg-gold-500 text-navy-900">Premium</Badge>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info size={18} className="text-accentblue-500 cursor-pointer" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs text-left">
            <b>What is Arbitrage?</b><br/>
            Arbitrage betting means placing bets on all possible outcomes with different bookmakers to secure a guaranteed profit thanks to price differences.
            Opportunities update in real-time from the latest matchups and odds.
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
    <PremiumContent
      title="Premium Arbitrage Betting"
      description="Get guaranteed profits with our arbitrage betting opportunities. Upgrade to premium to unlock."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {arbitrageOpportunitiesToShow.map((opportunity) => (
          <ArbitrageOpportunityCard key={opportunity.id} opportunity={opportunity} />
        ))}
      </div>
    </PremiumContent>
  </div>
);

export default ArbitrageOpportunitiesSection;
