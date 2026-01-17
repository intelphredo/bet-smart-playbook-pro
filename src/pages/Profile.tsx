import { useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBetSlip } from "@/components/BetSlip/BetSlipContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Camera, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Trophy,
  Percent,
  DollarSign,
  Activity,
  BarChart3,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";

export default function Profile() {
  const { user, profile, loading: authLoading } = useAuth();
  const { stats, isLoading: statsLoading } = useBetSlip();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: `${publicUrl}?t=${Date.now()}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success("Avatar updated successfully");
      // Force page reload to show new avatar
      window.location.reload();
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  // Calculate win rate
  const winRate = stats && stats.total_bets && stats.total_bets > 0
    ? ((stats.wins || 0) / ((stats.wins || 0) + (stats.losses || 0))) * 100
    : 0;

  // CLV performance indicator
  const avgClv = stats?.avg_clv || 0;
  const clvStatus = avgClv > 0 ? 'positive' : avgClv < 0 ? 'negative' : 'neutral';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      <main id="main-content" className="flex-1 container py-6 px-4 max-w-4xl">
        <div className="space-y-6">
          {/* Profile Header Card */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Manage your account information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-primary/30">
                    <AvatarImage 
                      src={profile?.avatar_url || undefined} 
                      alt={profile?.full_name || "User"} 
                    />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={handleAvatarClick}
                    disabled={isUploading}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-semibold">{profile?.full_name || "Set your name"}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge variant={profile?.subscription_status === 'premium' ? 'default' : 'secondary'}>
                    {profile?.subscription_status === 'premium' ? 'Premium' : 'Free'} Plan
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Edit Profile Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Display Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your display name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Betting Statistics Card */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Betting Statistics
              </CardTitle>
              <CardDescription>
                Your overall betting performance and metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : stats ? (
                <div className="space-y-6">
                  {/* Main Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                      label="Total Bets"
                      value={stats.total_bets || 0}
                      icon={<Activity className="h-4 w-4" />}
                    />
                    <StatCard
                      label="Win Rate"
                      value={`${winRate.toFixed(1)}%`}
                      icon={<Target className="h-4 w-4" />}
                      trend={winRate >= 50 ? 'up' : winRate > 0 ? 'down' : undefined}
                    />
                    <StatCard
                      label="Total Profit"
                      value={`$${(stats.total_profit || 0).toFixed(2)}`}
                      icon={<DollarSign className="h-4 w-4" />}
                      trend={(stats.total_profit || 0) >= 0 ? 'up' : 'down'}
                    />
                    <StatCard
                      label="ROI"
                      value={`${(stats.roi_percentage || 0).toFixed(1)}%`}
                      icon={<Percent className="h-4 w-4" />}
                      trend={(stats.roi_percentage || 0) >= 0 ? 'up' : 'down'}
                    />
                  </div>

                  <Separator />

                  {/* Win/Loss Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Win/Loss Breakdown</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{stats.wins || 0} Wins</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm">{stats.losses || 0} Losses</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-muted-foreground/50" />
                        <span className="text-sm">{stats.pushes || 0} Pushes</span>
                      </div>
                    </div>
                    <Progress 
                      value={winRate} 
                      className="h-2"
                    />
                  </div>

                  <Separator />

                  {/* CLV Performance */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      CLV Performance
                      <Badge variant={clvStatus === 'positive' ? 'default' : clvStatus === 'negative' ? 'destructive' : 'secondary'}>
                        {clvStatus === 'positive' ? 'Beating the market' : clvStatus === 'negative' ? 'Below market' : 'Neutral'}
                      </Badge>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Avg CLV</p>
                        <p className={`text-lg font-semibold ${avgClv >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {avgClv >= 0 ? '+' : ''}{avgClv.toFixed(2)}%
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Best Streak</p>
                        <p className="text-lg font-semibold flex items-center gap-1">
                          <Trophy className="h-4 w-4 text-primary" />
                          {stats.best_streak || 0}
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Current Streak</p>
                        <p className={`text-lg font-semibold ${(stats.current_streak || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {(stats.current_streak || 0) >= 0 ? '+' : ''}{stats.current_streak || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Additional Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Pending Bets</p>
                      <p className="text-lg font-semibold">{stats.pending_bets || 0}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Total Staked</p>
                      <p className="text-lg font-semibold">${(stats.total_staked || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Avg Odds</p>
                      <p className="text-lg font-semibold">
                        {(stats.avg_odds || 0) >= 0 ? '+' : ''}{(stats.avg_odds || 0).toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No betting statistics yet</p>
                  <p className="text-sm">Start placing bets to see your performance</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <PageFooter />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
}

function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {trend && (
          trend === 'up' ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <span className="text-lg font-semibold">{value}</span>
      </div>
    </div>
  );
}