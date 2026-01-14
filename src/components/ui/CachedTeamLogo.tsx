import React, { useState, useEffect, memo } from 'react';
import { useTeamLogo, getLogoDimensions } from '@/hooks/useTeamLogo';
import { LogoSize } from '@/services/logo-service';
import { League } from '@/types/sports';
import { cn } from '@/lib/utils';

export interface CachedTeamLogoProps {
  /** Team name for lookup */
  teamName: string;
  /** League/sport type */
  league: League;
  /** Logo size variant */
  size?: LogoSize;
  /** ESPN numeric team ID (helps with NCAA lookups) */
  espnTeamId?: string;
  /** Direct logo URL (bypasses cache) */
  logoUrl?: string;
  /** Additional CSS classes */
  className?: string;
  /** Alt text override */
  alt?: string;
  /** Whether to show loading skeleton */
  showSkeleton?: boolean;
  /** Whether to show fallback on error */
  showFallback?: boolean;
  /** Custom fallback content */
  fallback?: React.ReactNode;
}

// Size to CSS class mapping
const sizeClasses: Record<LogoSize, string> = {
  small: 'w-10 h-10',
  medium: 'w-20 h-20',
  large: 'w-[120px] h-[120px]',
};

// Fallback text sizes
const fallbackTextSizes: Record<LogoSize, string> = {
  small: 'text-xs',
  medium: 'text-base',
  large: 'text-xl',
};

/**
 * Get team initials for fallback display
 */
function getTeamInitials(teamName: string): string {
  const words = teamName.split(' ').filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/**
 * SVG Loading Skeleton Component
 */
const LogoSkeleton: React.FC<{ size: LogoSize; className?: string }> = ({ 
  size, 
  className 
}) => {
  const dimensions = getLogoDimensions(size);
  
  return (
    <div 
      className={cn(
        sizeClasses[size],
        'rounded-full bg-muted animate-pulse flex items-center justify-center',
        className
      )}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <svg 
        viewBox="0 0 24 24" 
        className="w-1/2 h-1/2 text-muted-foreground/30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    </div>
  );
};

/**
 * Fallback Component with Team Initials
 */
const LogoFallback: React.FC<{ 
  teamName: string; 
  size: LogoSize; 
  className?: string;
}> = ({ teamName, size, className }) => {
  const initials = getTeamInitials(teamName);
  
  return (
    <div 
      className={cn(
        sizeClasses[size],
        'rounded-full bg-gradient-to-br from-primary/20 to-accent/20',
        'flex items-center justify-center border border-border/50',
        className
      )}
      title={teamName}
    >
      <span className={cn(
        fallbackTextSizes[size],
        'font-bold text-foreground/70'
      )}>
        {initials}
      </span>
    </div>
  );
};

/**
 * Cached Team Logo Component
 * 
 * Uses the logo caching service for efficient loading with:
 * - Memory cache for instant access
 * - localStorage for cross-session persistence
 * - Retry logic for failed fetches
 * - Responsive loading with lazy loading
 * 
 * @example
 * ```tsx
 * <CachedTeamLogo
 *   teamName="Lakers"
 *   league="NBA"
 *   size="medium"
 * />
 * ```
 */
export const CachedTeamLogo: React.FC<CachedTeamLogoProps> = memo(({
  teamName,
  league,
  size = 'medium',
  espnTeamId,
  logoUrl,
  className,
  alt,
  showSkeleton = true,
  showFallback = true,
  fallback,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const {
    logoUrl: cachedLogoUrl,
    isLoading,
    hasError,
    cacheStatus,
  } = useTeamLogo({
    teamId: teamName,
    sport: league,
    size,
    espnTeamId,
    directUrl: logoUrl,
  });

  const dimensions = getLogoDimensions(size);
  const altText = alt || `${teamName} logo`;

  // Reset image states when URL changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [cachedLogoUrl]);

  // Show skeleton while loading
  if ((isLoading || !imageLoaded) && !imageError && showSkeleton) {
    return (
      <div className={cn('relative', className)}>
        <LogoSkeleton size={size} />
        {cachedLogoUrl && (
          <img
            src={cachedLogoUrl}
            alt={altText}
            className="absolute inset-0 opacity-0"
            width={dimensions.width}
            height={dimensions.height}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
      </div>
    );
  }

  // Show fallback on error
  if ((hasError || imageError) && showFallback) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <LogoFallback 
        teamName={teamName} 
        size={size} 
        className={className} 
      />
    );
  }

  // Render the cached logo
  return (
    <div 
      className={cn(sizeClasses[size], 'relative flex-shrink-0', className)}
      data-cache-status={cacheStatus}
    >
      <img
        src={cachedLogoUrl || undefined}
        alt={altText}
        title={teamName}
        width={dimensions.width}
        height={dimensions.height}
        className={cn(
          sizeClasses[size],
          'object-contain rounded-full transition-opacity duration-200',
          imageLoaded ? 'opacity-100' : 'opacity-0'
        )}
        loading="lazy"
        decoding="async"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </div>
  );
});

CachedTeamLogo.displayName = 'CachedTeamLogo';

export default CachedTeamLogo;
