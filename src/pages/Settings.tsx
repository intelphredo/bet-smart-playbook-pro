import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import PageFooter from '@/components/PageFooter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  ArrowLeft, 
  Settings2, 
  Bell, 
  Wallet, 
  Star, 
  Palette,
  Save,
  RotateCcw,
  Loader2,
  X
} from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';
import { useAuth } from '@/hooks/useAuth';
import { isDevMode } from '@/utils/devMode';

const AVAILABLE_LEAGUES = ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'SOCCER'];
const AVAILABLE_SPORTSBOOKS = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'PointsBet', 'BetRivers'];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const devMode = isDevMode();
  const { preferences, isLoading, updatePreference, updatePreferences, resetPreferences } = usePreferences();
  const [isSaving, setIsSaving] = useState(false);
  const [localPrefs, setLocalPrefs] = useState(preferences);

  // Sync local state when preferences load
  useState(() => {
    setLocalPrefs(preferences);
  });

  const handleSave = async () => {
    setIsSaving(true);
    await updatePreferences(localPrefs);
    setIsSaving(false);
  };

  const handleReset = async () => {
    await resetPreferences();
    setLocalPrefs(preferences);
  };

  const toggleLeague = (league: string) => {
    const leagues = localPrefs.favorites.leagues.includes(league)
      ? localPrefs.favorites.leagues.filter(l => l !== league)
      : [...localPrefs.favorites.leagues, league];
    setLocalPrefs({ ...localPrefs, favorites: { ...localPrefs.favorites, leagues } });
  };

  const toggleSportsbook = (sportsbook: string) => {
    const sportsbooks = localPrefs.favorites.sportsbooks.includes(sportsbook)
      ? localPrefs.favorites.sportsbooks.filter(s => s !== sportsbook)
      : [...localPrefs.favorites.sportsbooks, sportsbook];
    setLocalPrefs({ ...localPrefs, favorites: { ...localPrefs.favorites, sportsbooks } });
  };

  if (!user && !devMode) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-secondary/30 to-accent/10">
        <NavBar />
        <main className="flex-1 container px-4 py-12 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <Settings2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-bold mb-2">Settings</h2>
              <p className="text-muted-foreground mb-6">
                Login to customize your preferences and settings.
              </p>
              <Button onClick={() => navigate('/auth')}>Login to Continue</Button>
            </CardContent>
          </Card>
        </main>
        <PageFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <NavBar />
      <main className="flex-1 container px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="display" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2 h-auto p-1">
            <TabsTrigger value="display" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Display</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Favorites</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="bankroll" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Bankroll</span>
            </TabsTrigger>
            <TabsTrigger value="betting" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Betting</span>
            </TabsTrigger>
          </TabsList>

          {/* Display Settings */}
          <TabsContent value="display">
            <Card>
              <CardHeader>
                <CardTitle>Display Preferences</CardTitle>
                <CardDescription>Customize how odds and data are displayed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Odds Format</Label>
                  <Select
                    value={localPrefs.display.odds_format}
                    onValueChange={(value: any) =>
                      setLocalPrefs({ ...localPrefs, display: { ...localPrefs.display, odds_format: value } })
                    }
                  >
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="american">American (+150, -110)</SelectItem>
                      <SelectItem value="decimal">Decimal (2.50, 1.91)</SelectItem>
                      <SelectItem value="fractional">Fractional (3/2, 10/11)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={localPrefs.display.theme}
                    onValueChange={(value: any) =>
                      setLocalPrefs({ ...localPrefs, display: { ...localPrefs.display, theme: value } })
                    }
                  >
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Favorites Settings */}
          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle>Favorites</CardTitle>
                <CardDescription>Select your favorite leagues and sportsbooks for quick filtering</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Favorite Leagues</Label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_LEAGUES.map((league) => (
                      <Badge
                        key={league}
                        variant={localPrefs.favorites.leagues.includes(league) ? 'default' : 'outline'}
                        className="cursor-pointer transition-all hover:scale-105"
                        onClick={() => toggleLeague(league)}
                      >
                        {localPrefs.favorites.leagues.includes(league) && (
                          <Star className="h-3 w-3 mr-1 fill-current" />
                        )}
                        {league}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Favorite Sportsbooks</Label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_SPORTSBOOKS.map((sportsbook) => (
                      <Badge
                        key={sportsbook}
                        variant={localPrefs.favorites.sportsbooks.includes(sportsbook) ? 'default' : 'outline'}
                        className="cursor-pointer transition-all hover:scale-105"
                        onClick={() => toggleSportsbook(sportsbook)}
                      >
                        {localPrefs.favorites.sportsbooks.includes(sportsbook) && (
                          <Star className="h-3 w-3 mr-1 fill-current" />
                        )}
                        {sportsbook}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Favorite Teams</Label>
                  <div className="flex flex-wrap gap-2">
                    {localPrefs.favorites.teams.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No favorite teams yet. Click the star icon on team cards to add them.
                      </p>
                    ) : (
                      localPrefs.favorites.teams.map((team) => (
                        <Badge key={team} variant="default" className="gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          {team}
                          <button
                            onClick={() => {
                              const teams = localPrefs.favorites.teams.filter(t => t !== team);
                              setLocalPrefs({ ...localPrefs, favorites: { ...localPrefs.favorites, teams } });
                            }}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose which alerts you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Line Movements</Label>
                    <p className="text-sm text-muted-foreground">Alert when odds move significantly</p>
                  </div>
                  <Switch
                    checked={localPrefs.notifications.line_movements}
                    onCheckedChange={(checked) =>
                      setLocalPrefs({ ...localPrefs, notifications: { ...localPrefs.notifications, line_movements: checked } })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Positive EV Opportunities</Label>
                    <p className="text-sm text-muted-foreground">Alert for +EV betting opportunities</p>
                  </div>
                  <Switch
                    checked={localPrefs.notifications.positive_ev}
                    onCheckedChange={(checked) =>
                      setLocalPrefs({ ...localPrefs, notifications: { ...localPrefs.notifications, positive_ev: checked } })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Arbitrage Opportunities</Label>
                    <p className="text-sm text-muted-foreground">Alert for arbitrage betting opportunities</p>
                  </div>
                  <Switch
                    checked={localPrefs.notifications.arbitrage}
                    onCheckedChange={(checked) =>
                      setLocalPrefs({ ...localPrefs, notifications: { ...localPrefs.notifications, arbitrage: checked } })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Game Start Reminders</Label>
                    <p className="text-sm text-muted-foreground">Remind before games start</p>
                  </div>
                  <Switch
                    checked={localPrefs.notifications.game_start}
                    onCheckedChange={(checked) =>
                      setLocalPrefs({ ...localPrefs, notifications: { ...localPrefs.notifications, game_start: checked } })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Bet Results</Label>
                    <p className="text-sm text-muted-foreground">Notify when your bets settle</p>
                  </div>
                  <Switch
                    checked={localPrefs.notifications.bet_results}
                    onCheckedChange={(checked) =>
                      setLocalPrefs({ ...localPrefs, notifications: { ...localPrefs.notifications, bet_results: checked } })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bankroll Settings */}
          <TabsContent value="bankroll">
            <Card>
              <CardHeader>
                <CardTitle>Bankroll Settings</CardTitle>
                <CardDescription>Configure your bankroll management parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Current Bankroll ($)</Label>
                  <Input
                    type="number"
                    value={localPrefs.bankroll.current_bankroll}
                    onChange={(e) =>
                      setLocalPrefs({
                        ...localPrefs,
                        bankroll: { ...localPrefs.bankroll, current_bankroll: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full md:w-[200px]"
                    min="0"
                    step="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unit Size ($)</Label>
                  <Input
                    type="number"
                    value={localPrefs.bankroll.unit_size}
                    onChange={(e) =>
                      setLocalPrefs({
                        ...localPrefs,
                        bankroll: { ...localPrefs.bankroll, unit_size: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full md:w-[200px]"
                    min="0"
                    step="5"
                  />
                  <p className="text-sm text-muted-foreground">
                    {localPrefs.bankroll.current_bankroll > 0
                      ? `${((localPrefs.bankroll.unit_size / localPrefs.bankroll.current_bankroll) * 100).toFixed(1)}% of bankroll`
                      : '0% of bankroll'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Kelly Fraction</Label>
                    <span className="text-sm font-medium">{(localPrefs.bankroll.kelly_fraction * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[localPrefs.bankroll.kelly_fraction * 100]}
                    onValueChange={([value]) =>
                      setLocalPrefs({
                        ...localPrefs,
                        bankroll: { ...localPrefs.bankroll, kelly_fraction: value / 100 },
                      })
                    }
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Recommended: 25% (Quarter Kelly) for safer betting
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Max Bet (% of Bankroll)</Label>
                    <span className="text-sm font-medium">{localPrefs.bankroll.max_bet_percentage}%</span>
                  </div>
                  <Slider
                    value={[localPrefs.bankroll.max_bet_percentage]}
                    onValueChange={([value]) =>
                      setLocalPrefs({
                        ...localPrefs,
                        bankroll: { ...localPrefs.bankroll, max_bet_percentage: value },
                      })
                    }
                    min={1}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Max single bet: ${((localPrefs.bankroll.max_bet_percentage / 100) * localPrefs.bankroll.current_bankroll).toFixed(0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Betting Settings */}
          <TabsContent value="betting">
            <Card>
              <CardHeader>
                <CardTitle>Betting Preferences</CardTitle>
                <CardDescription>Configure default betting behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Default Stake ($)</Label>
                  <Input
                    type="number"
                    value={localPrefs.betting.default_stake}
                    onChange={(e) =>
                      setLocalPrefs({
                        ...localPrefs,
                        betting: { ...localPrefs.betting, default_stake: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full md:w-[200px]"
                    min="0"
                    step="5"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Apply Kelly Stake</Label>
                    <p className="text-sm text-muted-foreground">Automatically use Kelly-recommended stake</p>
                  </div>
                  <Switch
                    checked={localPrefs.betting.auto_kelly}
                    onCheckedChange={(checked) =>
                      setLocalPrefs({ ...localPrefs, betting: { ...localPrefs.betting, auto_kelly: checked } })
                    }
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Show EV Threshold (%)</Label>
                    <span className="text-sm font-medium">{localPrefs.betting.show_ev_threshold}%</span>
                  </div>
                  <Slider
                    value={[localPrefs.betting.show_ev_threshold]}
                    onValueChange={([value]) =>
                      setLocalPrefs({
                        ...localPrefs,
                        betting: { ...localPrefs.betting, show_ev_threshold: value },
                      })
                    }
                    min={0}
                    max={10}
                    step={0.5}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Highlight bets with EV above this threshold
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Hide Negative EV Bets</Label>
                    <p className="text-sm text-muted-foreground">Only show positive expected value opportunities</p>
                  </div>
                  <Switch
                    checked={localPrefs.betting.hide_negative_ev}
                    onCheckedChange={(checked) =>
                      setLocalPrefs({ ...localPrefs, betting: { ...localPrefs.betting, hide_negative_ev: checked } })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <PageFooter />
    </div>
  );
}
