// Reusable info explainer component with tooltip and optional modal
import React, { useState } from "react";
import { Info, HelpCircle, BookOpen } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ExplainerKey = keyof typeof EXPLAINERS;

export const EXPLAINERS = {
  // Sharp Money Signals
  steam_move: {
    title: "Steam Move",
    short: "Rapid line movement from coordinated sharp action",
    full: "A Steam Move occurs when betting lines move rapidly across multiple sportsbooks simultaneously. This indicates coordinated action from professional bettors (sharps) who have identified value. Steam moves typically happen within seconds and are considered strong indicators of sharp money.",
    icon: "⚡",
  },
  reverse_line: {
    title: "Reverse Line Movement (RLM)",
    short: "Line moves against public betting percentages",
    full: "Reverse Line Movement happens when the betting line moves in the opposite direction of where the majority of public bets are placed. For example, if 70% of bets are on Team A, but the line moves in favor of Team B, it suggests sharps are betting heavily on Team B with larger wagers.",
    icon: "📈",
  },
  money_split: {
    title: "Money/Ticket Split",
    short: "Difference between money wagered and number of bets",
    full: "A Money/Ticket Split occurs when the percentage of money wagered differs significantly from the percentage of tickets (individual bets). Since sharp bettors typically place larger wagers, a split where money favors one side but tickets favor another suggests professional action on the money side.",
    icon: "⚖️",
  },
  whale_bet: {
    title: "Whale Bet",
    short: "Large single wager from a high-stakes bettor",
    full: "A Whale Bet is an exceptionally large wager, typically $50,000 or more, placed by a high-stakes bettor. These bets can move lines significantly and are tracked by sportsbooks. Whale bets from known sharp bettors are considered valuable signals.",
    icon: "🐋",
  },
  sharp_action: {
    title: "Sharp Action",
    short: "Betting activity from professional bettors",
    full: "Sharp Action refers to wagers placed by professional bettors who have a proven track record of beating the closing line. Sportsbooks track these bettors and their action often causes line movements. Following sharp action is a common strategy.",
    icon: "🧠",
  },
  syndicate_play: {
    title: "Syndicate Play",
    short: "Coordinated betting from a betting group",
    full: "A Syndicate Play occurs when a betting syndicate (organized group of professional bettors) coordinates to place large wagers across multiple sportsbooks. This concentrated action often moves lines quickly and is considered highly significant.",
    icon: "👥",
  },

  // Scores & Metrics
  smart_score: {
    title: "Smart Score",
    short: "Overall betting value rating (0-100)",
    full: "The Smart Score is a composite rating from 0-100 that combines multiple factors: momentum, value, odds movement, weather impact, injury impact, and arbitrage opportunities. Higher scores indicate better betting opportunities based on our algorithms.",
    icon: "📊",
  },
  confidence: {
    title: "Confidence Level",
    short: "Algorithm's certainty in the prediction",
    full: "The Confidence Level represents how certain our prediction algorithms are about a particular pick. It's calculated based on historical accuracy, data quality, and the strength of the underlying signals. Higher confidence generally correlates with better long-term results.",
    icon: "🎯",
  },
  expected_value: {
    title: "Expected Value (EV)",
    short: "Average profit/loss per bet over time",
    full: "Expected Value (EV) represents the average amount you can expect to win or lose per bet if you were to place the same bet many times. Positive EV (+EV) means the bet is profitable long-term. EV is calculated as: (Probability × Potential Profit) - (1 - Probability) × Stake.",
    icon: "💰",
  },
  clv: {
    title: "Closing Line Value (CLV)",
    short: "How your odds compare to closing odds",
    full: "Closing Line Value measures whether you got better odds than the final (closing) line before the game starts. Consistently beating the closing line is the best indicator of long-term betting success, as closing lines are considered the most accurate odds.",
    icon: "📉",
  },
  kelly_criterion: {
    title: "Kelly Criterion",
    short: "Optimal bet sizing formula",
    full: "The Kelly Criterion is a mathematical formula that determines the optimal bet size based on your edge and bankroll. It maximizes long-term growth while minimizing risk of ruin. The formula is: (bp - q) / b, where b = odds, p = win probability, q = loss probability.",
    icon: "📐",
  },
  roi: {
    title: "Return on Investment (ROI)",
    short: "Profit as percentage of total wagered",
    full: "ROI measures your profit relative to the total amount wagered. It's calculated as (Total Profit / Total Wagered) × 100. A positive ROI means you're profitable overall. Professional bettors typically aim for 3-10% ROI long-term.",
    icon: "📈",
  },

  // Betting Types
  moneyline: {
    title: "Moneyline",
    short: "Bet on which team will win outright",
    full: "A Moneyline bet is the simplest form of sports betting - you're picking which team will win the game. American odds show how much you need to bet to win $100 (negative odds like -150) or how much you'd win on a $100 bet (positive odds like +130).",
    icon: "🏆",
  },
  spread: {
    title: "Point Spread",
    short: "Bet on margin of victory",
    full: "The Point Spread (or line) is a handicap given to the underdog to level the playing field. If a team is -7.5, they must win by 8+ points to cover. If they're +7.5, they can lose by up to 7 points and still cover. This creates roughly 50/50 betting on each side.",
    icon: "📏",
  },
  totals: {
    title: "Over/Under (Totals)",
    short: "Bet on combined score",
    full: "Totals betting, also called Over/Under, involves betting whether the combined score of both teams will be over or under a set number. For example, if the total is 220.5, you bet whether the final combined score will be 221+ (over) or 220 or less (under).",
    icon: "🔢",
  },
  arbitrage: {
    title: "Arbitrage",
    short: "Risk-free profit from odds differences",
    full: "Arbitrage betting exploits differences in odds between sportsbooks to guarantee a profit regardless of the outcome. By betting on all outcomes at different books, you can lock in a small but certain profit. Arb opportunities are rare and typically small (1-3%).",
    icon: "🔄",
  },

  // Line Movement
  line_movement: {
    title: "Line Movement",
    short: "How odds change over time",
    full: "Line Movement tracks how betting odds change from when they open until game time. Lines move based on betting action, injury news, weather, and other factors. Understanding why lines move can provide valuable insights into where sharp money is going.",
    icon: "📊",
  },
  opening_line: {
    title: "Opening Line",
    short: "Initial odds when betting opens",
    full: "The Opening Line is the first set of odds released by sportsbooks, typically 1-2 weeks before the game. Opening lines are set by oddsmakers and are often considered less efficient than closing lines, creating potential value opportunities.",
    icon: "🎬",
  },
  closing_line: {
    title: "Closing Line",
    short: "Final odds before game starts",
    full: "The Closing Line is the final set of odds available just before the game begins. It's considered the most accurate line because it incorporates all available information and betting action. Beating the closing line consistently is the mark of a sharp bettor.",
    icon: "🏁",
  },

  // Public vs Sharp
  public_betting: {
    title: "Public Betting",
    short: "Bets from recreational bettors",
    full: "Public Betting refers to wagers from recreational or casual bettors (also called 'squares'). Public bettors tend to favor favorites, overs, popular teams, and are influenced by recent results. Fading the public is a common sharp strategy.",
    icon: "👥",
  },
  sharp_betting: {
    title: "Sharp Betting",
    short: "Bets from professional bettors",
    full: "Sharp Betting refers to wagers from professional bettors who have proven long-term profitability. Sharps use mathematical models, have access to better information, and are tracked by sportsbooks. Their action often moves lines.",
    icon: "🧠",
  },

  // Other
  live_odds: {
    title: "Live Odds",
    short: "Real-time odds during the game",
    full: "Live Odds (or in-play odds) are betting lines that update in real-time during a game based on the current score, time remaining, and game flow. Live betting offers unique opportunities but requires quick decision-making.",
    icon: "⚡",
  },
  injury_impact: {
    title: "Injury Impact",
    short: "How injuries affect the line",
    full: "Injury Impact measures how player injuries affect the expected outcome and betting lines. Key player injuries can move lines significantly. Our system tracks injury reports and calculates their impact on team performance.",
    icon: "🏥",
  },
  weather_impact: {
    title: "Weather Impact",
    short: "How weather affects outdoor games",
    full: "Weather Impact is relevant for outdoor sports (NFL, MLB, soccer). Wind affects passing and kicking games, rain affects ball handling, and extreme temperatures can impact player performance. These factors are incorporated into our predictions.",
    icon: "🌦️",
  },
  momentum: {
    title: "Team Momentum",
    short: "Recent team performance trend",
    full: "Momentum measures a team's recent performance trend, including win streaks, scoring trends, and form. Teams on hot streaks may continue performing well, while slumping teams might struggle. However, momentum can also mean regression to the mean is coming.",
    icon: "🔥",
  },
  consensus_pick: {
    title: "Consensus Pick",
    short: "When 2+ algorithms agree on the same prediction",
    full: "A Consensus Pick occurs when multiple prediction algorithms agree on the same outcome. Research shows that when algorithms converge on the same pick, the win rate tends to be higher than when they disagree. Full consensus (all 3 algorithms agree) typically has the highest success rate.",
    icon: "🤝",
  },
  head_to_head: {
    title: "Head-to-Head Win Rate",
    short: "How often Algorithm A beats Algorithm B when they disagree",
    full: "Head-to-Head Win Rate measures which algorithm is more accurate when two algorithms make opposing predictions for the same match. This helps identify which algorithm to trust in split-decision situations.",
    icon: "⚔️",
  },
  agreement_rate: {
    title: "Agreement Rate",
    short: "Percentage of matches where all algorithms picked the same outcome",
    full: "Agreement Rate shows how often the prediction algorithms converge on the same pick. A high agreement rate combined with a high consensus win rate suggests the algorithms are working effectively together.",
    icon: "📊",
  },
  algorithm_edge: {
    title: "Algorithm Edge",
    short: "The unique strength of each prediction model",
    full: "Each algorithm has different strengths based on its methodology. ML Power Index excels at pattern recognition, Value Pick Finder specializes in odds analysis, and Statistical Edge focuses on situational factors. Understanding each algorithm's edge helps you know when to trust its predictions.",
    icon: "💡",
  },
} as const;

interface InfoExplainerProps {
  term: ExplainerKey;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "badge" | "inline";
  showTitle?: boolean;
  className?: string;
}

export function InfoExplainer({
  term,
  size = "sm",
  variant = "icon",
  showTitle = false,
  className,
}: InfoExplainerProps) {
  const explainer = EXPLAINERS[term];
  if (!explainer) return null;

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 cursor-help text-muted-foreground hover:text-foreground transition-colors",
              className
            )}
          >
            {showTitle && (
              <span className="text-xs font-medium">{explainer.title}</span>
            )}
            <Info className={iconSizes[size]} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <span>{explainer.icon}</span>
              {explainer.title}
            </p>
            <p className="text-xs text-muted-foreground">{explainer.short}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Full glossary modal component
interface GlossaryModalProps {
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
}

export function GlossaryModal({ trigger, defaultOpen = false }: GlossaryModalProps) {
  const [open, setOpen] = useState(defaultOpen);

  const categories = {
    "Sharp Money Signals": ["steam_move", "reverse_line", "money_split", "whale_bet", "sharp_action", "syndicate_play"],
    "Scores & Metrics": ["smart_score", "confidence", "expected_value", "clv", "kelly_criterion", "roi"],
    "Bet Types": ["moneyline", "spread", "totals", "arbitrage"],
    "Line Movement": ["line_movement", "opening_line", "closing_line"],
    "Betting Action": ["public_betting", "sharp_betting"],
    "Other Factors": ["live_odds", "injury_impact", "weather_impact", "momentum"],
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-1.5">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Glossary</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Betting Glossary
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {Object.entries(categories).map(([category, terms]) => (
            <div key={category}>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-3">
                {terms.map((termKey) => {
                  const exp = EXPLAINERS[termKey as ExplainerKey];
                  if (!exp) return null;
                  return (
                    <div
                      key={termKey}
                      className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{exp.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{exp.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {exp.full}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick explainer inline component
interface QuickExplainerProps {
  term: ExplainerKey;
  children: React.ReactNode;
  className?: string;
}

export function QuickExplainer({ term, children, className }: QuickExplainerProps) {
  const explainer = EXPLAINERS[term];
  if (!explainer) return <>{children}</>;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "cursor-help border-b border-dotted border-muted-foreground/50 hover:border-foreground transition-colors",
              className
            )}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm">
          <div className="space-y-2">
            <p className="font-semibold flex items-center gap-1.5">
              <span>{explainer.icon}</span>
              {explainer.title}
            </p>
            <p className="text-xs">{explainer.full}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default InfoExplainer;
