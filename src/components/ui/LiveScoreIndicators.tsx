import React from 'react';
import { cn } from '@/lib/utils';

export interface LivePulseProps {
  /** Whether the game is live */
  isLive: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional classes */
  className?: string;
  /** Show text label */
  showLabel?: boolean;
}

/**
 * Live Pulse Animation Component
 * Shows a pulsing dot for active live games
 */
export const LivePulse: React.FC<LivePulseProps> = ({
  isLive,
  size = 'sm',
  className,
  showLabel = false,
}) => {
  if (!isLive) return null;

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const labelSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className="relative flex">
        <span
          className={cn(
            sizeClasses[size],
            'animate-ping absolute inline-flex rounded-full bg-red-400 opacity-75'
          )}
        />
        <span
          className={cn(
            sizeClasses[size],
            'relative inline-flex rounded-full bg-red-500'
          )}
        />
      </span>
      {showLabel && (
        <span className={cn(labelSizes[size], 'font-medium text-red-500 uppercase')}>
          Live
        </span>
      )}
    </div>
  );
};

export interface StaleDataWarningProps {
  /** Last update timestamp */
  lastUpdate: string | Date | null;
  /** Threshold in milliseconds for stale warning */
  threshold?: number;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional classes */
  className?: string;
}

/**
 * Stale Data Warning Component
 * Shows a warning when data hasn't been updated recently
 */
export const StaleDataWarning: React.FC<StaleDataWarningProps> = ({
  lastUpdate,
  threshold = 30000, // 30 seconds
  size = 'sm',
  className,
}) => {
  const [isStale, setIsStale] = React.useState(false);
  const [secondsAgo, setSecondsAgo] = React.useState(0);

  React.useEffect(() => {
    if (!lastUpdate) {
      setIsStale(true);
      return;
    }

    const checkStale = () => {
      const lastUpdateTime = new Date(lastUpdate).getTime();
      const timeSince = Date.now() - lastUpdateTime;
      setIsStale(timeSince > threshold);
      setSecondsAgo(Math.floor(timeSince / 1000));
    };

    checkStale();
    const interval = setInterval(checkStale, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate, threshold]);

  if (!isStale) return null;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
  };

  return (
    <div
      className={cn(
        sizeClasses[size],
        'inline-flex items-center gap-1 rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20',
        className
      )}
      title={`Last updated ${secondsAgo} seconds ago`}
    >
      <svg
        className="w-3 h-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <span>Stale</span>
    </div>
  );
};

export interface ConnectionStatusIndicatorProps {
  /** Connection status */
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  /** Connection type */
  type?: 'websocket' | 'polling';
  /** Size variant */
  size?: 'sm' | 'md';
  /** Show label */
  showLabel?: boolean;
  /** Additional classes */
  className?: string;
}

/**
 * Connection Status Indicator Component
 * Shows the current connection status with visual feedback
 */
export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  status,
  type = 'polling',
  size = 'sm',
  showLabel = false,
  className,
}) => {
  const colors = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500 animate-pulse',
    disconnected: 'bg-gray-400',
    error: 'bg-red-500',
  };

  const labels = {
    connected: type === 'websocket' ? 'Real-time' : 'Polling',
    connecting: 'Connecting...',
    disconnected: 'Offline',
    error: 'Error',
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
  };

  const labelSizes = {
    sm: 'text-xs',
    md: 'text-sm',
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span
        className={cn(
          sizeClasses[size],
          'rounded-full',
          colors[status]
        )}
      />
      {showLabel && (
        <span className={cn(labelSizes[size], 'text-muted-foreground')}>
          {labels[status]}
        </span>
      )}
    </div>
  );
};

export interface LiveScoreDisplayProps {
  /** Home team score */
  homeScore: number;
  /** Away team score */
  awayScore: number;
  /** Period display (e.g., "Q1 5:30") */
  period?: string;
  /** Whether the game is live */
  isLive?: boolean;
  /** Last update timestamp */
  lastUpdate?: string | Date | null;
  /** Whether data is stale */
  isStale?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional classes */
  className?: string;
}

/**
 * Live Score Display Component
 * Combines score, period, live indicator, and stale warning
 */
export const LiveScoreDisplay: React.FC<LiveScoreDisplayProps> = ({
  homeScore,
  awayScore,
  period,
  isLive = false,
  lastUpdate,
  isStale = false,
  size = 'md',
  className,
}) => {
  const scoreSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const periodSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {/* Live indicator */}
      {isLive && (
        <LivePulse isLive={isLive} size={size === 'lg' ? 'md' : 'sm'} showLabel />
      )}

      {/* Score */}
      <div className={cn('font-bold font-mono', scoreSizes[size])}>
        <span>{homeScore}</span>
        <span className="mx-2 text-muted-foreground">-</span>
        <span>{awayScore}</span>
      </div>

      {/* Period */}
      {period && (
        <div className={cn('text-muted-foreground', periodSizes[size])}>
          {period}
        </div>
      )}

      {/* Stale warning */}
      {isStale && (
        <StaleDataWarning
          lastUpdate={lastUpdate}
          size={size === 'lg' ? 'md' : 'sm'}
        />
      )}
    </div>
  );
};

export default LiveScoreDisplay;
