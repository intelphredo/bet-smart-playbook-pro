
import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
  const [theme, setThemeState] = React.useState<"dark" | "light" | "system">("light");

  // Load theme preference from localStorage on component mount
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | "system" | null;
    
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      // Check if system prefers dark mode
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setThemeState(systemPrefersDark ? "dark" : "light");
    }
  }, []);

  // Apply theme changes and save to localStorage
  React.useEffect(() => {
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", theme);
    
    // Add smooth transition for theme changes
    document.documentElement.style.setProperty("--theme-transition", "0.3s ease-in-out");
    document.documentElement.style.setProperty("color-scheme", isDark ? "dark" : "light");
    
    // Announce theme change for screen readers
    const themeAnnouncement = document.createElement("div");
    themeAnnouncement.style.position = "absolute";
    themeAnnouncement.style.width = "1px";
    themeAnnouncement.style.height = "1px";
    themeAnnouncement.style.padding = "0";
    themeAnnouncement.style.margin = "-1px";
    themeAnnouncement.style.overflow = "hidden";
    themeAnnouncement.style.clip = "rect(0, 0, 0, 0)";
    themeAnnouncement.style.whiteSpace = "nowrap";
    themeAnnouncement.style.border = "0";
    themeAnnouncement.setAttribute("aria-live", "polite");
    themeAnnouncement.textContent = `Theme changed to ${theme} mode`;
    document.body.appendChild(themeAnnouncement);
    
    setTimeout(() => {
      document.body.removeChild(themeAnnouncement);
    }, 3000);
  }, [theme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="transition-all dark:border-slate-700 dark:bg-slate-800">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setThemeState("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setThemeState("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setThemeState("system")}>
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
