// src/components/match/TeamLogo.tsx

import React, { useState } from "react";
import { getTeamLogoUrl, getTeamInitials } from "@/utils/teamLogos";
import { League } from "@/types/sports";
import { cn } from "@/lib/utils";

interface Props {
  teamName: string;
  league?: League;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showFallback?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const fallbackTextSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
  xl: "text-2xl",
};

export const TeamLogo: React.FC<Props> = ({ 
  teamName, 
  league = "NBA",
  size = "md",
  className,
  showFallback = true
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const logoUrl = getTeamLogoUrl(teamName, league);
  const initials = getTeamInitials(teamName);

  if (hasError && showFallback) {
    return (
      <div 
        className={cn(
          sizeClasses[size],
          "rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-border/50",
          className
        )}
      >
        <span className={cn(fallbackTextSizes[size], "font-bold text-foreground/70")}>
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(sizeClasses[size], "relative", className)}>
      {isLoading && (
        <div className={cn(
          sizeClasses[size],
          "absolute inset-0 rounded-full bg-muted animate-pulse"
        )} />
      )}
      <img
        src={logoUrl}
        alt={`${teamName} logo`}
        className={cn(
          sizeClasses[size],
          "object-contain rounded-full transition-opacity",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
};

export default TeamLogo;
