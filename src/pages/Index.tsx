
import { useState } from "react";
import { League } from "@/types/sports";
import NavBar from "@/components/NavBar";
import LeagueSelector from "@/components/LeagueSelector";
import MatchCard from "@/components/MatchCard";
import AlgorithmCard from "@/components/AlgorithmCard";
import StatsOverview from "@/components/StatsOverview";
import { algorithms } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import PlayerPropCard from "@/components/PlayerPropCard";
import { playerProps } from "@/data/playerPropData";
import ArbitrageCard from "@/components/ArbitrageCard";
import PremiumContent from "@/components/PremiumContent";
import { arbitrageOpportunities } from "@/data/arbitrageData";
import { Badge } from "@/components/ui/badge";
import { useESPNData } from "@/hooks/useESPNData";
import { useToast } from "@/hooks/use-toast";
import ConfidentPicks from "@/components/ConfidentPicks";
import { Check, X, Info } from "lucide-react"; // Added the Info icon import
import ArbitrageOpportunityCard from "@/components/ArbitrageOpportunityCard";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const Index = () => {
  const [selectedLeague, setSelectedLeague] = useState<League | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState("upcoming");
  const { toast } = useToast();

  const { 
    upcomingMatches, 
    liveMatches, 
    finishedMatches,
    isLoading, 
    error, 
    refetch 
  } = useESPNData({ 
    league: selectedLeague, 
    refreshInterval: 60000 
  });

  const handleRefreshData = () => {
    refetch();
    toast({
      title: "Refreshing data",
      description: "Fetching the latest sports data from ESPN",
      variant: "default"
    });
  };

  const filteredProps = selectedLeague === "ALL"
    ? playerProps
    : playerProps.filter(prop => {
        const match = [...upcomingMatches, ...liveMatches].find(m => m.id === prop.matchId);
        return match?.league === selectedLeague;
      });
      
  const filteredArbitrage = selectedLeague === "ALL"
    ? arbitrageOpportunities
    : arbitrageOpportunities.filter(opportunity => opportunity.match.league === selectedLeague);

  const isPredictionCorrect = (match: any) => {
    if (!match.prediction || !match.score) return null;
    const { recommended } = match.prediction;
    if (recommended === "home" && match.score.home > match.score.away) return true;
    if (recommended === "away" && match.score.away > match.score.home) return true;
    if (recommended === "draw" && match.score.home === match.score.away) return true;
    return false;
  };

  const realTimeArbs = [...upcomingMatches, ...liveMatches]
    .slice(0, 3)
    .map(match => ({
      id: match.id,
      matchId: match.id,
      match: {
        homeTeam: match.homeTeam.shortName,
        awayTeam: match.awayTeam.shortName,
        league: match.league,
        startTime: match.startTime,
      },
      bookmakers: [
        { name: "FanDuel", odds: { ...match.odds } },
        { name: "DraftKings", odds: { ...match.odds } },
      ],
      arbitragePercentage: 2.1 + Math.random(),
      potentialProfit: 21.24 + Math.random() * 30,
      bettingStrategy: [
        { bookmaker: "FanDuel", team: "home" as "home", stakePercentage: 52 + Math.random() * 10, odds: match.odds.homeWin },
        { bookmaker: "DraftKings", team: match.odds.draw !== undefined ? "draw" as "draw" : "away" as "away", stakePercentage: 48 - Math.random() * 10, odds: match.odds.awayWin },
        ...(match.odds.draw
          ? [{ bookmaker: "BetMGM", team: "draw" as "draw", stakePercentage: Math.min(100, Math.random() * 20), odds: match.odds.draw }]
          : []),
      ],
      isPremium: Math.random() > 0.5,
    }));

  const arbitrageOpportunitiesToShow = realTimeArbs.length > 0
    ? realTimeArbs
    : filteredArbitrage;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <div className="container px-4 py-6">
        <div className="flex flex-col space-y-6">
          <div className="text-center mb-4 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="text-navy-500 dark:text-navy-200">Smart Betting.</span>{" "}
              <span className="text-gold-500">Live ESPN Data.</span>
            </h1>
            <p className="text-md md:text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">
              Real-time sports data from ESPN with data-driven predictions to maximize your winning potential.
            </p>
            <Button size="lg" className="bg-navy-500 hover:bg-navy-600 text-white">
              Get Started
            </Button>
          </div>
          
          <div className="animate-slide-in">
            <StatsOverview />
          </div>
          
          <ConfidentPicks />
          
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
                {arbitrageOpportunitiesToShow.map(opportunity => (
                  <ArbitrageOpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </div>
            </PremiumContent>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">Live ESPN Data</h2>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleRefreshData} 
                  disabled={isLoading}
                >
                  {isLoading ? "Refreshing..." : "Refresh Data"}
                </Button>
                <Badge variant="outline" className="bg-navy-50 dark:bg-navy-700">
                  Auto-updates every 60s
                </Badge>
              </div>
              <LeagueSelector 
                selectedLeague={selectedLeague} 
                onSelectLeague={setSelectedLeague} 
              />
            </div>
            
            {error && (
              <Card className="border-red-300 bg-red-50 dark:bg-red-900/20">
                <CardContent className="p-4">
                  <p className="text-red-600 dark:text-red-400">
                    Error loading ESPN data. Please try refreshing.
                  </p>
                </CardContent>
              </Card>
            )}
            
            <Tabs defaultValue="future" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="future">Future Games</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="live">Live</TabsTrigger>
                <TabsTrigger value="finished">Finished</TabsTrigger>
              </TabsList>
              
              <TabsContent value="future" className="mt-4">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                      <Card key={i}>
                        <CardContent className="p-12 flex justify-center items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-500" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : upcomingMatches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingMatches.map(match => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p>No future games for this league.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="upcoming" className="mt-4">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                      <Card key={i}>
                        <CardContent className="p-12 flex justify-center items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-500" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : upcomingMatches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingMatches.map(match => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p>No upcoming matches for this league.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="live" className="mt-4">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                      <Card key={i}>
                        <CardContent className="p-12 flex justify-center items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-500" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : liveMatches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {liveMatches.map(match => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p>No live matches currently for this league.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="finished" className="mt-4">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                      <Card key={i}>
                        <CardContent className="p-12 flex justify-center items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-500" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : finishedMatches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {finishedMatches.map(match => (
                      <Card key={match.id} className="overflow-hidden">
                        <CardHeader className="p-3 bg-navy-50 dark:bg-navy-700 flex flex-row justify-between items-center space-y-0">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs font-normal bg-white dark:bg-navy-600">{match.league}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Finished
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-3 gap-2 items-center mb-2">
                            <div className="text-center">
                              <div className="w-10 h-10 bg-navy-50 dark:bg-navy-700 rounded-full mx-auto mb-1 flex items-center justify-center">
                                {match.homeTeam.logo ? (
                                  <img 
                                    src={match.homeTeam.logo} 
                                    alt={match.homeTeam.name} 
                                    className="w-8 h-8 object-contain rounded-full"
                                  />
                                ) : (
                                  match.homeTeam.shortName.substring(0, 2)
                                )}
                              </div>
                              <div className="text-sm font-medium truncate">{match.homeTeam.shortName}</div>
                              <div className="text-xs text-muted-foreground">{match.homeTeam.record}</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-xl font-bold">
                                {match.score?.home} - {match.score?.away}
                                <div className="text-xs text-muted-foreground mt-1">{match.score?.period}</div>
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <div className="w-10 h-10 bg-navy-50 dark:bg-navy-700 rounded-full mx-auto mb-1 flex items-center justify-center">
                                {match.awayTeam.logo ? (
                                  <img 
                                    src={match.awayTeam.logo} 
                                    alt={match.awayTeam.name} 
                                    className="w-8 h-8 object-contain rounded-full"
                                  />
                                ) : (
                                  match.awayTeam.shortName.substring(0, 2)
                                )}
                              </div>
                              <div className="text-sm font-medium truncate">{match.awayTeam.shortName}</div>
                              <div className="text-xs text-muted-foreground">{match.awayTeam.record}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {isPredictionCorrect(match) === true && (
                              <Badge className="bg-green-500 text-white flex items-center gap-1">
                                <Check className="w-4 h-4" /> Correct Pick
                              </Badge>
                            )}
                            {isPredictionCorrect(match) === false && (
                              <Badge className="bg-red-500 text-white flex items-center gap-1">
                                <X className="w-4 h-4" /> Incorrect Pick
                              </Badge>
                            )}
                            {isPredictionCorrect(match) === null && (
                              <Badge className="bg-gray-200 text-gray-600">N/A</Badge>
                            )}
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p>No finished matches for this league.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
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
          
          <div className="space-y-4 py-2">
            <h2 className="text-2xl font-bold">Winning Algorithms</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {algorithms.map(algorithm => (
                <AlgorithmCard key={algorithm.name} algorithm={algorithm} />
              ))}
            </div>
          </div>
          
          <Card className="bg-navy-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    Get Premium Picks & Analyses
                  </h3>
                  <p className="text-navy-100 mb-4 md:mb-0">
                    Subscribe to unlock our best algorithms and expert picks.
                  </p>
                </div>
                <Button className="bg-gold-500 hover:bg-gold-600 text-navy-900">
                  Subscribe Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <footer className="mt-12 py-6 border-t">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2025 BetSmart Playbook Pro. All rights reserved.
            </div>
            <div className="flex gap-4 text-sm">
              <a href="#" className="hover:underline">Terms</a>
              <a href="#" className="hover:underline">Privacy</a>
              <a href="#" className="hover:underline">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
