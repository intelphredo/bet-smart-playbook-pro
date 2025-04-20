
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { ModeToggle } from "./ModeToggle";

const NavBar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="border-b flex items-center justify-between px-4 h-16">
      <div className="flex items-center space-x-2">
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
        
        {isLoggedIn ? (
          <div className="flex items-center space-x-4">
            <span className="hidden md:block text-sm font-medium">My Account</span>
            <Button variant="outline" size="sm" onClick={() => setIsLoggedIn(false)}>Log Out</Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsLoggedIn(true)}>Log In</Button>
            <Button size="sm" onClick={() => setIsLoggedIn(true)}>Sign Up</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavBar;
