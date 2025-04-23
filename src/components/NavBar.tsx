
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { useLocation } from "react-router-dom";
import { Home } from "lucide-react";

export default function NavBar() {
  const location = useLocation();
  const isActivePath = (path: string) => location.pathname === path;

  return (
    <header className="bg-background border-b shadow-sm">
      <div className="container flex justify-between items-center py-4">
        <div className="font-bold text-2xl flex items-center hero-gradient">
          <span className="mr-2 tracking-tighter font-playfair">Bet</span>
          <span>Smart</span>
        </div>
        <nav>
          <ul className="flex items-center space-x-1">
            <li>
              <Link to="/">
                <Button 
                  variant={isActivePath("/") ? "default" : "ghost"} 
                  size="sm" 
                  className="flex items-center gap-1"
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
                  className="flex items-center gap-1"
                >
                  {/* Use Home for demonstration—replace with BarChart2 if needed */}
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
