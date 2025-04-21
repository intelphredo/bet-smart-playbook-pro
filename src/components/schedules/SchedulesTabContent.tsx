
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SchedulesDateNavigation from "./SchedulesDateNavigation";
import SchedulesResults from "@/components/schedules/SchedulesResults";
import { League, DataSource, Match } from "@/types/sports";

interface SchedulesTabContentProps {
  view: "schedule" | "standings";
  setView: (v: "schedule" | "standings") => void;
  formattedDate: string;
  showWeekGames: boolean;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
  filteredMatches: Match[];
  isLoading: boolean;
  error: Error | null;
  refetchSchedule: () => void;
  itemsPerPage: number;
  divisionsStandings: any[];
  isLoadingStandings: boolean;
  selectedLeague: "ALL" | League;
}

const SchedulesTabContent: React.FC<SchedulesTabContentProps> = ({
  view,
  setView,
  formattedDate,
  showWeekGames,
  goToPreviousDay,
  goToNextDay,
  goToToday,
  filteredMatches,
  isLoading,
  error,
  refetchSchedule,
  itemsPerPage,
  divisionsStandings,
  isLoadingStandings,
  selectedLeague,
}) => (
  <div className="mt-6">
    <Tabs defaultValue={view} value={view} onValueChange={(v) => setView(v as "schedule" | "standings")}>
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="schedule">Schedule</TabsTrigger>
        <TabsTrigger value="standings">Standings</TabsTrigger>
      </TabsList>
      
      <TabsContent value="schedule" className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <SchedulesDateNavigation
              formattedDate={formattedDate}
              showWeekGames={showWeekGames}
              goToPreviousDay={goToPreviousDay}
              goToNextDay={goToNextDay}
              goToToday={goToToday}
            />
            <SchedulesResults 
              filteredMatches={filteredMatches}
              isLoading={isLoading}
              error={error}
              handleRefreshData={refetchSchedule}
              itemsPerPage={itemsPerPage}
            />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="standings" className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">
              {selectedLeague === "ALL" ? "MLB" : selectedLeague} Standings
            </h2>
            {isLoadingStandings ? (
              <div className="text-center p-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-navy-500"></div>
                <p className="mt-4">Loading standings...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {divisionsStandings.map((division, index) => (
                  <div key={index} className="overflow-hidden">
                    <h3 className="text-lg font-medium mb-2">{division.divisionName}</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left p-2">Team</th>
                            <th className="p-2">W</th>
                            <th className="p-2">L</th>
                            <th className="p-2">PCT</th>
                            <th className="p-2">GB</th>
                            <th className="p-2">STRK</th>
                          </tr>
                        </thead>
                        <tbody>
                          {division.teams.map((team: any) => (
                            <tr key={team.team.id} className="border-b hover:bg-muted/50">
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  {team.team.logo && (
                                    <img 
                                      src={team.team.logo} 
                                      alt={team.team.name} 
                                      className="w-5 h-5 object-contain"
                                    />
                                  )}
                                  <span>{team.team.name}</span>
                                </div>
                              </td>
                              <td className="p-2 text-center">{team.wins}</td>
                              <td className="p-2 text-center">{team.losses}</td>
                              <td className="p-2 text-center">{team.winPercentage}</td>
                              <td className="p-2 text-center">{team.gamesBack}</td>
                              <td className="p-2 text-center">{team.streak}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
);

export default SchedulesTabContent;
