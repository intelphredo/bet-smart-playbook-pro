import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Search, LogIn, UserPlus, Home } from "lucide-react";
import { ModeToggle } from "./ModeToggle";

const NavBar = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  return (
    <div className="border-b flex items-center justify-between px-4 h-16">
      {/* Home Button at the left */}
      <div className="flex items-center space-x-2">
        <Link to="/" className="mr-2 flex items-center hover:bg-accent rounded-md p-2 transition">
          <Home className="h-6 w-6 text-navy-500 dark:text-navy-200" aria-label="Home" />
          <span className="sr-only">Go to main screen</span>
        </Link>
        <div className="font-bold text-2xl text-navy-500 flex items-center">
          <span className="mr-1 text-gold-500">Bet</span>Smart
        </div>
        <span className="text-xs bg-navy-500 text-white px-2 py-1 rounded-md hidden md:block">
          PLAYBOOK PRO
        </span>
      </div>
      
      <div className="flex items-center space-x-4 ml-auto">
        <div className="relative hidden md:block">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search teams, games..." 
            className="w-64 pl-8 rounded-md border h-9 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
          />
        </div>
        
        <ModeToggle />
        
        {user ? (
          <div className="flex items-center space-x-4">
            {profile?.subscription_status === "premium" && (
              <span className="hidden md:block text-sm font-medium text-gold-500">Premium Member</span>
            )}
            <span className="hidden md:block text-sm font-medium">Hello, {user.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>Log Out</Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/auth")}
              className="flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Log In</span>
            </Button>
            <Button 
              size="sm" 
              onClick={() => navigate("/auth")}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Up</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavBar;
