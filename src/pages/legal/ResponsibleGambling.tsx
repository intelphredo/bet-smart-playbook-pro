import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import AppBreadcrumb from "@/components/layout/AppBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  AlertTriangle, 
  Phone, 
  Globe, 
  MessageCircle, 
  Clock,
  DollarSign,
  Users,
  Brain,
  ShieldCheck,
  ExternalLink
} from "lucide-react";

const helplineResources = [
  {
    name: "National Council on Problem Gambling",
    phone: "1-800-522-4700",
    website: "https://www.ncpgambling.org",
    description: "24/7 confidential helpline for problem gambling",
    available: "24/7"
  },
  {
    name: "Gamblers Anonymous",
    phone: null,
    website: "https://www.gamblersanonymous.org",
    description: "Support meetings and recovery resources",
    available: "Meetings worldwide"
  },
  {
    name: "National Problem Gambling Helpline",
    phone: "1-800-522-4700",
    website: "https://www.ncpgambling.org/help-treatment/chat/",
    description: "Free, confidential chat support",
    available: "24/7 Chat Available"
  },
  {
    name: "SAMHSA National Helpline",
    phone: "1-800-662-4357",
    website: "https://www.samhsa.gov/find-help/national-helpline",
    description: "Mental health and substance abuse referrals",
    available: "24/7, 365 days"
  },
  {
    name: "GamTalk",
    phone: null,
    website: "https://www.gamtalk.org",
    description: "Free online peer support community",
    available: "24/7 Forum"
  }
];

const warningSigns = [
  "Spending more money or time gambling than you intended",
  "Feeling restless or irritable when trying to cut back",
  "Gambling to escape problems or relieve negative emotions",
  "Lying to family or friends about gambling habits",
  "Borrowing money or selling possessions to gamble",
  "Chasing losses by betting more to win back money",
  "Neglecting work, school, or family responsibilities",
  "Failed attempts to control or stop gambling"
];

const responsibleTips = [
  {
    icon: DollarSign,
    title: "Set a Budget",
    description: "Only gamble with money you can afford to lose. Set strict limits before you start."
  },
  {
    icon: Clock,
    title: "Set Time Limits",
    description: "Decide how much time you'll spend and stick to it. Take regular breaks."
  },
  {
    icon: Brain,
    title: "Stay Informed",
    description: "Understand the odds. No system or strategy can guarantee wins."
  },
  {
    icon: Users,
    title: "Don't Gamble Alone",
    description: "Talk to friends or family about your gambling. Stay accountable."
  }
];

export default function ResponsibleGambling() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-8 max-w-4xl">
        <AppBreadcrumb className="mb-4" />
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-500/20 rounded-xl">
            <Heart className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Responsible Gambling</h1>
            <p className="text-muted-foreground">Resources and support for healthy gambling habits</p>
          </div>
        </div>

        {/* Main Message */}
        <Card className="mb-8 border-green-500/30 bg-gradient-to-r from-green-500/10 to-transparent">
          <CardContent className="p-6">
            <p className="text-lg leading-relaxed">
              Gambling should be fun and entertaining. If it stops being enjoyable or starts affecting 
              your life negatively, it's time to take a step back. <strong>Help is always available</strong>, 
              and seeking support is a sign of strength, not weakness.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Crisis Hotline Banner */}
          <Card className="border-2 border-destructive/50 bg-gradient-to-r from-destructive/10 to-transparent">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="p-4 bg-destructive/20 rounded-full">
                  <Phone className="h-10 w-10 text-destructive" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold mb-2">Need Help Now?</h2>
                  <p className="text-muted-foreground mb-3">
                    If you or someone you know is struggling with problem gambling, help is available 24/7.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                    <Button size="lg" variant="destructive" asChild>
                      <a href="tel:1-800-522-4700" className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Call 1-800-522-4700
                      </a>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <a 
                        href="https://www.ncpgambling.org/help-treatment/chat/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <MessageCircle className="h-5 w-5" />
                        Chat Online
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning Signs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Warning Signs of Problem Gambling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you recognize any of these signs in yourself or someone you care about, consider 
                reaching out for support:
              </p>
              <ul className="grid md:grid-cols-2 gap-3">
                {warningSigns.map((sign, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span className="text-sm">{sign}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Responsible Gambling Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Tips for Responsible Gambling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {responsibleTips.map((tip, index) => {
                  const Icon = tip.icon;
                  return (
                    <div 
                      key={index} 
                      className="p-4 rounded-lg bg-muted/50 border border-border/50"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <h4 className="font-semibold">{tip.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{tip.description}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Helpline Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Support Resources & Hotlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {helplineResources.map((resource, index) => (
                  <div 
                    key={index}
                    className="p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-lg">{resource.name}</h4>
                        <p className="text-sm text-muted-foreground">{resource.description}</p>
                        <span className="text-xs text-primary">{resource.available}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {resource.phone && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={`tel:${resource.phone}`} className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {resource.phone}
                            </a>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" asChild>
                          <a 
                            href={resource.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Website
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Self-Exclusion Info */}
          <Card>
            <CardHeader>
              <CardTitle>Self-Exclusion Options</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                Many states and countries offer self-exclusion programs that allow you to voluntarily 
                ban yourself from gambling venues and online platforms. Contact your local gaming 
                commission or visit the resources above to learn about options in your area.
              </p>
              <p>
                Additionally, most online sportsbooks offer responsible gambling tools including:
              </p>
              <ul>
                <li>Deposit limits</li>
                <li>Loss limits</li>
                <li>Session time limits</li>
                <li>Cool-off periods</li>
                <li>Self-exclusion options</li>
              </ul>
            </CardContent>
          </Card>

          {/* Platform Commitment */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Our Commitment
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                BetSmart Playbook Pro is committed to promoting responsible gambling. While we provide 
                analytics and predictions for educational purposes, we strongly encourage all users to:
              </p>
              <ul>
                <li>View gambling as entertainment, not a way to make money</li>
                <li>Never chase losses or bet more than you can afford</li>
                <li>Use our bankroll management tools to set and stick to limits</li>
                <li>Take breaks and step away when gambling stops being fun</li>
                <li>Seek help immediately if gambling becomes a problem</li>
              </ul>
              <p className="font-medium text-primary">
                Remember: No prediction or system can guarantee wins. Always gamble responsibly.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <PageFooter />
    </div>
  );
}
