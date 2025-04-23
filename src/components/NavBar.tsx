
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { useLocation } from "react-router-dom";
import { LineChart, BarChart2, Home } from "lucide-react";

export default function NavBar() {
  const location = useLocation();
  const isActivePath = (path: string) => location.pathname === path;

  return (
    <header className="bg-background border-b dark:border-navy-800 transition-colors dark-mode-transition">
      <div className="container flex justify-between items-center py-4">
        <div className="font-bold text-2xl flex items-center">
          <span className="text-primary mr-2 dark:text-gold-400">Bet</span>
          <span className="dark:text-white">Smart</span>
        </div>

        <nav>
          <ul className="flex items-center space-x-1">
            <li>
              <Link to="/">
                <Button 
                  variant={isActivePath("/") ? "default" : "ghost"} 
                  size="sm" 
                  className={`flex items-center gap-1 nav-button ${
                    isActivePath("/") 
                      ? "dark:bg-navy-600 dark:text-white dark:hover:bg-navy-500" 
                      : "dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  <Home size={16} />
                  <span>Home</span>
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/algorithms">
                <Button 
                  variant={isActivePath("/algorithms") ? "default" : "ghost"} 
                  size="sm" 
                  className={`flex items-center gap-1 nav-button ${
                    isActivePath("/algorithms") 
                      ? "dark:bg-navy-600 dark:text-white dark:hover:bg-navy-500" 
                      : "dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  <BarChart2 size={16} />
                  <span>Algorithms</span>
                </Button>
              </Link>
            </li>
            <li className="ml-2">
              <ModeToggle />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
