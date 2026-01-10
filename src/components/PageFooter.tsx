import { Link } from "react-router-dom";
import { Home, Trophy, AlertTriangle, BarChart2, Wallet, BookOpen, History, Settings } from "lucide-react";

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
  <footer className="mt-12 py-8 border-t bg-card/50">
    <div className="container px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Brand */}
        <div>
          <Link 
            to="/" 
            className="font-bold text-xl flex items-center hero-gradient mb-3"
          >
            <span className="mr-1 tracking-tighter font-playfair">Bet</span>
            <span>Smart</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            AI-powered sports analytics and predictions to help you make smarter betting decisions.
          </p>
        </div>
        
        {/* Quick Links */}
        <div>
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider">Quick Links</h3>
          <nav role="navigation" aria-label="Footer navigation">
            <ul className="grid grid-cols-2 gap-2">
              {footerLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        
        {/* Legal */}
        <div>
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider">Legal</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Responsible Gaming
              </Link>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} BetSmart Playbook Pro. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground">
          Gambling involves risk. Please bet responsibly.
        </p>
      </div>
    </div>
  </footer>
);

export default PageFooter;
