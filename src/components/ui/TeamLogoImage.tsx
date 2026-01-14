import React, { useState } from "react";
import { getTeamLogoUrl, getTeamInitials } from "@/utils/teamLogos";
import { League } from "@/types/sports";
import { cn } from "@/lib/utils";

export interface TeamLogoImageProps {
  /** The team name to display logo for */
  teamName: string;
  /** The league the team belongs to (used for ESPN CDN lookup) */
  league?: League;
  /** Optional team id (ESPN numeric id is especially useful for NCAA logos) */
  teamId?: string;
  /** Optional direct logo URL (takes precedence over CDN lookup) */
  logoUrl?: string;
  /** Size variant */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Additional CSS classes */
  className?: string;
  /** Whether to show fallback initials on error */
  showFallback?: boolean;
  /** Alt text override */
  alt?: string;
}

const sizeClasses = {
  xs: "w-5 h-5",
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const fallbackTextSizes = {
  xs: "text-[8px]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
  xl: "text-2xl",
};

/**
 * Unified team logo component that handles:
 * - ESPN CDN logos via league + team name lookup
 * - NCAA logos via ESPN numeric teamId when available
 * - Direct URL logos from API responses
 * - Fallback to team initials on error
 * - Loading states
 */
export const TeamLogoImage: React.FC<TeamLogoImageProps> = ({
  teamName,
  league = "NBA",
  teamId,
  logoUrl,
  size = "md",
  className,
  showFallback = true,
  alt,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const normalizedLogoUrl = logoUrl && logoUrl.trim().length > 0 ? logoUrl : undefined;

  // NCAA (NCAAB/NCAAF) team logos on ESPN CDN are keyed by numeric team id.
  const ncaaIdLogoUrl =
    !normalizedLogoUrl &&
    teamId &&
    /^\d+$/.test(teamId) &&
    (league === "NCAAB" || league === "NCAAF")
      ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${teamId}.png`
      : undefined;

  // Use provided logo URL if available, otherwise generate from ESPN CDN
  const effectiveLogoUrl = normalizedLogoUrl || ncaaIdLogoUrl || getTeamLogoUrl(teamName, league);
  const initials = getTeamInitials(teamName);
  const altText = alt || `${teamName} logo`;

  if (hasError && showFallback) {
    return (
      <div
        className={cn(
          sizeClasses[size],
          "rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-border/50",
          className
        )}
        title={teamName}
      >
        <span className={cn(fallbackTextSizes[size], "font-bold text-foreground/70")}>
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(sizeClasses[size], "relative flex-shrink-0", className)}>
      {isLoading && (
        <div
          className={cn(
            sizeClasses[size],
            "absolute inset-0 rounded-full bg-muted animate-pulse"
          )}
        />
      )}
      <img
        src={effectiveLogoUrl}
        alt={altText}
        title={teamName}
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
        loading="lazy"
      />
    </div>
  );
};

export default TeamLogoImage;
