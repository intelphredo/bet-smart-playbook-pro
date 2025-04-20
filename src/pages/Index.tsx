
import { useState } from "react";
import { League } from "@/types/sports";
import NavBar from "@/components/NavBar";
import LeagueSelector from "@/components/LeagueSelector";
import MatchCard from "@/components/MatchCard";
import AlgorithmCard from "@/components/AlgorithmCard";
import StatsOverview from "@/components/StatsOverview";
import { upcomingMatches, liveMatches, algorithms } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PlayerPropCard from "@/components/PlayerPropCard";
import { playerProps } from "@/data/playerPropData";
import ArbitrageCard from "@/components/ArbitrageCard";
import PremiumContent from "@/components/PremiumContent";
import { arbitrageOpportunities } from "@/data/arbitrageData";

const Index = () => {
  const [selectedLeague, setSelectedLeague] = useState<League | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState("upcoming");

  const filteredUpcoming = selectedLeague === "ALL" 
    ? upcomingMatches 
    : upcomingMatches.filter(match => match.league === selectedLeague);
  
  const filteredLive = selectedLeague === "ALL"
    ? liveMatches
    : liveMatches.filter(match => match.league === selectedLeague);

  const filteredProps = selectedLeague === "ALL"
    ? playerProps
    : playerProps.filter(prop => {
        const match = [...upcomingMatches, ...liveMatches].find(m => m.id === prop.matchId);
        return match?.league === selectedLeague;
      });
      
  const filteredArbitrage = selectedLeague === "ALL"
    ? arbitrageOpportunities
    : arbitrageOpportunities.filter(opportunity => opportunity.match.league === selectedLeague);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <div className="container px-4 py-6">
        <div className="flex flex-col space-y-6">
          {/* Hero section */}
          <div className="text-center mb-4 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="text-navy-500 dark:text-navy-200">Smart Betting.</span>{" "}
              <span className="text-gold-500">Winning Algorithms.</span>
            </h1>
            <p className="text-md md:text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">
              Data-driven predictions for all major sports leagues with proven algorithms to maximize your winning potential.
            </p>
            <Button size="lg" className="bg-navy-500 hover:bg-navy-600 text-white">
              Get Started
            </Button>
          </div>
          
          {/* Stats Overview */}
          <div className="animate-slide-in">
            <StatsOverview />
          </div>
          
          {/* Arbitrage Opportunities */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold mr-2">Arbitrage Opportunities</h2>
                <Badge className="bg-gold-500 text-navy-900">Premium</Badge>
              </div>
            </div>
            
            <PremiumContent
              title="Premium Arbitrage Betting"
              description="Get guaranteed profits with our arbitrage betting opportunities. Upgrade to premium to unlock."
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredArbitrage.map(opportunity => (
                  <ArbitrageCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </div>
            </PremiumContent>
          </div>

          {/* Leagues and Matches */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h2 className="text-2xl font-bold">Sports & Matches</h2>
              <LeagueSelector 
                selectedLeague={selectedLeague} 
                onSelectLeague={setSelectedLeague} 
              />
            </div>
            
            <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="live">Live</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming" className="mt-4">
                {filteredUpcoming.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUpcoming.map(match => (
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
                {filteredLive.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredLive.map(match => (
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
            </Tabs>
          </div>
          
          {/* Player Props */}
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
          
          {/* Algorithms */}
          <div className="space-y-4 py-2">
            <h2 className="text-2xl font-bold">Winning Algorithms</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {algorithms.map(algorithm => (
                <AlgorithmCard key={algorithm.name} algorithm={algorithm} />
              ))}
            </div>
          </div>
          
          {/* Subscribe section */}
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
