import { Link } from "react-router-dom";
import { Home, Trophy, AlertTriangle, BarChart2, Wallet, BookOpen, History, Settings, Sparkles, ChevronRight } from "lucide-react";

const footerLinks = [
  { path: "/", label: "Home", icon: Home },
  { path: "/standings", label: "Standings", icon: Trophy },
  { path: "/injuries", label: "Injuries", icon: AlertTriangle },
  { path: "/algorithms", label: "Algorithms", icon: BarChart2 },
  { path: "/bankroll", label: "Bankroll", icon: Wallet },
  { path: "/scenarios", label: "Scenarios", icon: BookOpen },
  { path: "/bet-history", label: "Bet History", icon: History },
  { path: "/settings", label: "Settings", icon: Settings },
];

const PageFooter = () => (
  <footer className="relative mt-12 py-12 border-t border-border/30 bg-gradient-to-b from-card/80 to-background overflow-hidden">
    {/* Gold accent line at top */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    
    {/* Subtle glow orbs */}
    <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-primary/3 blur-3xl pointer-events-none" />
    
    <div className="container px-4 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
        {/* Brand */}
        <div>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 mb-4 group"
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 group-hover:border-primary/40 transition-colors">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold">
              <span className="bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent">
                Bet
              </span>
              <span className="text-foreground">Smart</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            AI-powered sports analytics and predictions to help you make smarter betting decisions.
          </p>
          
          {/* Premium badge */}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">Premium Sports Intelligence</span>
          </div>
        </div>
        
        {/* Quick Links */}
        <div>
          <h3 className="font-semibold mb-4 text-xs uppercase tracking-widest text-primary/80 flex items-center gap-2">
            <div className="w-8 h-px bg-gradient-to-r from-primary/50 to-transparent" />
            Quick Links
          </h3>
          <nav role="navigation" aria-label="Footer navigation">
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {footerLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="group text-sm text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center gap-2"
                    >
                      <span className="p-1 rounded bg-muted/50 group-hover:bg-primary/10 transition-colors">
                        <Icon className="h-3 w-3 group-hover:text-primary transition-colors" aria-hidden="true" />
                      </span>
                      <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        
        {/* Legal */}
        <div>
          <h3 className="font-semibold mb-4 text-xs uppercase tracking-widest text-primary/80 flex items-center gap-2">
            <div className="w-8 h-px bg-gradient-to-r from-primary/50 to-transparent" />
            Legal
          </h3>
          <ul className="space-y-2.5">
            {["Terms of Service", "Privacy Policy", "Responsible Gaming"].map((item) => (
              <li key={item}>
                <Link 
                  to="/" 
                  className="group text-sm text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center gap-2"
                >
                  <ChevronRight className="h-3 w-3 text-primary/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  <span>{item}</span>
                </Link>
              </li>
            ))}
          </ul>
          
          {/* Responsible gaming note */}
          <div className="mt-6 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <p className="text-xs text-amber-500/80 leading-relaxed">
              ⚠️ Gambling involves risk. Please bet responsibly and within your means.
            </p>
          </div>
        </div>
      </div>
      
      {/* Bottom bar */}
      <div className="pt-8 border-t border-border/20 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-amber-400" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} <span className="text-foreground/80">BetSmart Playbook Pro</span>. All rights reserved.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground/60">Powered by</span>
          <span className="text-xs font-medium bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
            Advanced AI Analytics
          </span>
        </div>
      </div>
    </div>
  </footer>
);

export default PageFooter;
