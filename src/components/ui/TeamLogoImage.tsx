import React, { useEffect, useState, memo } from "react";
import { getTeamLogoUrl, getTeamInitials } from "@/utils/teamLogos";
import { getNCAABTeamId } from "@/utils/ncaabTeamIds";
import { League } from "@/types/sports";
import { cn } from "@/lib/utils";
import { useTeamLogo, getLogoDimensions } from "@/hooks/useTeamLogo";
import { LogoSize } from "@/services/logo-service";

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
  /** Use legacy loading (bypass cache) */
  legacy?: boolean;
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

// Map component sizes to cache service sizes
const sizeToCacheSize: Record<string, LogoSize> = {
  xs: 'small',
  sm: 'small',
  md: 'medium',
  lg: 'medium',
  xl: 'large',
};

/**
 * Unified team logo component that handles:
 * - ESPN CDN logos via league + team name lookup
 * - NCAA logos via ESPN numeric teamId when available
 * - Direct URL logos from API responses
 * - Fallback to team initials on error
 * - Loading states with caching
 * 
 * Now uses logo-service for multi-tier caching:
 * 1. Memory cache (instant)
 * 2. localStorage (persistent, 7-day expiration)
 * 3. Network fetch with retry
 */
export const TeamLogoImage: React.FC<TeamLogoImageProps> = memo(({
  teamName,
  league = "NBA",
  teamId,
  logoUrl,
  size = "md",
  className,
  showFallback = true,
  alt,
  legacy = false,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const normalizedLogoUrl = logoUrl && logoUrl.trim().length > 0 ? logoUrl : undefined;
  const cacheSize = sizeToCacheSize[size] || 'medium';

  // Use the caching hook for logo URL resolution
  const {
    logoUrl: cachedLogoUrl,
    isLoading: cacheLoading,
    hasError: cacheError,
    cacheStatus,
  } = useTeamLogo({
    teamId: teamName,
    sport: league,
    size: cacheSize,
    espnTeamId: teamId,
    directUrl: normalizedLogoUrl,
    enabled: !legacy,
  });

  // For legacy mode, compute URL directly (old behavior)
  const legacyLogoUrl = React.useMemo(() => {
    if (!legacy) return null;
    
    const isNCAA = league === "NCAAB" || league === "NCAAF";
    
    if (normalizedLogoUrl) return normalizedLogoUrl;
    
    if (isNCAA) {
      if (teamId && /^\d+$/.test(teamId)) {
        return `https://a.espncdn.com/i/teamlogos/ncaa/500/${teamId}.png`;
      }
      const mappedId = getNCAABTeamId(teamName);
      if (mappedId) {
        return `https://a.espncdn.com/i/teamlogos/ncaa/500/${mappedId}.png`;
      }
    }
    
    return getTeamLogoUrl(teamName, league);
  }, [legacy, normalizedLogoUrl, teamName, league, teamId]);

  const effectiveLogoUrl = legacy ? legacyLogoUrl : cachedLogoUrl;
  const initials = getTeamInitials(teamName);
  const altText = alt || `${teamName} logo`;

  // Reset states when URL changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [effectiveLogoUrl]);

  const isLoading = legacy ? !imageLoaded && !imageError : (cacheLoading || (!imageLoaded && !imageError));
  const hasError = legacy ? imageError : (cacheError || imageError);

  if (hasError && showFallback) {
    return (
      <div
        className={cn(
          sizeClasses[size],
          "rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-border/50",
          className
        )}
        title={teamName}
        role="img"
        aria-label={altText}
      >
        <span className={cn(fallbackTextSizes[size], "font-bold text-foreground/70")}>
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={cn(sizeClasses[size], "relative flex-shrink-0", className)}
      data-cache-status={!legacy ? cacheStatus : undefined}
    >
      {isLoading && (
        <div
          className={cn(
            sizeClasses[size],
            "absolute inset-0 rounded-full bg-muted animate-pulse"
          )}
          aria-hidden="true"
        />
      )}
      <img
        src={effectiveLogoUrl || undefined}
        alt={altText}
        title={teamName}
        className={cn(
          sizeClasses[size],
          "object-contain rounded-full transition-opacity duration-200",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageLoaded(false);
          setImageError(true);
        }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
});

TeamLogoImage.displayName = 'TeamLogoImage';

export default TeamLogoImage;
