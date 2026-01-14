import React, { useState, useEffect, memo } from 'react';
import { useTeamLogo, getLogoDimensions, getLogoSrcSet } from '@/hooks/useTeamLogo';
import { LogoSize, LOGO_SIZES } from '@/services/logo-service';
import { League } from '@/types/sports';
import { cn } from '@/lib/utils';

export interface ResponsiveTeamLogoProps {
  /** Team name for lookup */
  teamName: string;
  /** League/sport type */
  league: League;
  /** Primary size variant */
  size?: LogoSize;
  /** ESPN numeric team ID */
  espnTeamId?: string;
  /** Direct logo URL */
  logoUrl?: string;
  /** Additional CSS classes */
  className?: string;
  /** Alt text override */
  alt?: string;
  /** Priority loading (above the fold) */
  priority?: boolean;
}

// CSS size classes for each variant
const sizeClasses: Record<LogoSize, string> = {
  small: 'w-10 h-10',
  medium: 'w-20 h-20',
  large: 'w-[120px] h-[120px]',
};

/**
 * Get team initials for fallback
 */
function getTeamInitials(teamName: string): string {
  const words = teamName.split(' ').filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/**
 * Responsive Team Logo with srcset support
 * 
 * Features:
 * - Responsive images with srcset for different pixel densities
 * - Lazy loading with IntersectionObserver
 * - Cached logo URLs via logo-service
 * - Graceful fallback to initials
 */
export const ResponsiveTeamLogo: React.FC<ResponsiveTeamLogoProps> = memo(({
  teamName,
  league,
  size = 'medium',
  espnTeamId,
  logoUrl,
  className,
  alt,
  priority = false,
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');

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
  const initials = getTeamInitials(teamName);

  // Reset state when URL changes
  useEffect(() => {
    setImageState('loading');
  }, [cachedLogoUrl]);

  // Generate srcset for responsive loading
  const srcSet = cachedLogoUrl ? getLogoSrcSet(cachedLogoUrl) : undefined;

  // Show skeleton while loading
  if (isLoading || imageState === 'loading') {
    return (
      <div className={cn('relative', sizeClasses[size], className)}>
        {/* Skeleton placeholder */}
        <div 
          className={cn(
            sizeClasses[size],
            'rounded-full bg-muted animate-pulse'
          )}
          aria-hidden="true"
        />
        
        {/* Hidden image for preloading */}
        {cachedLogoUrl && (
          <img
            src={cachedLogoUrl}
            srcSet={srcSet}
            alt=""
            className="absolute inset-0 opacity-0 pointer-events-none"
            width={dimensions.width}
            height={dimensions.height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={() => setImageState('loaded')}
            onError={() => setImageState('error')}
          />
        )}
      </div>
    );
  }

  // Show fallback on error
  if (hasError || imageState === 'error') {
    return (
      <div 
        className={cn(
          sizeClasses[size],
          'rounded-full bg-gradient-to-br from-primary/20 to-accent/20',
          'flex items-center justify-center border border-border/50',
          className
        )}
        title={teamName}
        role="img"
        aria-label={altText}
      >
        <span 
          className={cn(
            'font-bold text-foreground/70',
            size === 'small' && 'text-xs',
            size === 'medium' && 'text-base',
            size === 'large' && 'text-xl',
          )}
        >
          {initials}
        </span>
      </div>
    );
  }

  // Render responsive image
  return (
    <picture 
      className={cn('relative flex-shrink-0', className)}
      data-cache-status={cacheStatus}
    >
      {/* WebP source if available */}
      {cachedLogoUrl?.endsWith('.png') && (
        <source
          type="image/webp"
          srcSet={cachedLogoUrl.replace('.png', '.webp')}
        />
      )}
      
      <img
        src={cachedLogoUrl || undefined}
        srcSet={srcSet}
        sizes={`${dimensions.width}px`}
        alt={altText}
        title={teamName}
        width={dimensions.width}
        height={dimensions.height}
        className={cn(
          sizeClasses[size],
          'object-contain rounded-full',
          'transition-opacity duration-200',
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
        )}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setImageState('loaded')}
        onError={() => setImageState('error')}
      />
    </picture>
  );
});

ResponsiveTeamLogo.displayName = 'ResponsiveTeamLogo';

export default ResponsiveTeamLogo;
