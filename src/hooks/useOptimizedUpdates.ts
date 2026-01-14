/**
 * Optimized hook for real-time updates with batching and throttling
 * Reduces re-renders during rapid live game updates
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import UpdateBatcher, { throttle } from "@/utils/cache/updateBatcher";

interface LiveUpdate {
  gameId: string;
  type: 'score' | 'status' | 'odds';
  data: any;
  timestamp: number;
}

interface UseOptimizedUpdatesOptions {
  batchSize?: number;
  maxWaitTime?: number;
  throttleInterval?: number;
  onBatchUpdate?: (updates: LiveUpdate[]) => void;
}

export function useOptimizedUpdates(options: UseOptimizedUpdatesOptions = {}) {
  const {
    batchSize = 5,
    maxWaitTime = 500,
    throttleInterval = 1000,
    onBatchUpdate,
  } = options;

  const queryClient = useQueryClient();
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [pendingUpdates, setPendingUpdates] = useState<number>(0);
  const batcherRef = useRef<UpdateBatcher<LiveUpdate> | null>(null);

  // Process batched updates
  const processBatch = useCallback((updates: LiveUpdate[]) => {
    if (updates.length === 0) return;

    // Group updates by game
    const groupedUpdates = new Map<string, LiveUpdate[]>();
    updates.forEach((update) => {
      const existing = groupedUpdates.get(update.gameId) || [];
      existing.push(update);
      groupedUpdates.set(update.gameId, existing);
    });

    // Apply updates efficiently
    groupedUpdates.forEach((gameUpdates, gameId) => {
      // Get the latest update for each type
      const latestByType = new Map<string, LiveUpdate>();
      gameUpdates.forEach((update) => {
        const existing = latestByType.get(update.type);
        if (!existing || update.timestamp > existing.timestamp) {
          latestByType.set(update.type, update);
        }
      });

      // Update query cache with merged data
      queryClient.setQueryData(['cached-games'], (oldData: any[]) => {
        if (!oldData) return oldData;
        
        return oldData.map((game) => {
          if (game.id !== gameId) return game;
          
          let updated = { ...game };
          latestByType.forEach((update) => {
            switch (update.type) {
              case 'score':
                updated.score = { ...updated.score, ...update.data };
                break;
              case 'status':
                updated.status = update.data.status;
                break;
              case 'odds':
                updated.odds = { ...updated.odds, ...update.data };
                break;
            }
          });
          updated.lastUpdated = new Date().toISOString();
          return updated;
        });
      });
    });

    setLastUpdateTime(Date.now());
    setPendingUpdates(0);
    onBatchUpdate?.(updates);
  }, [queryClient, onBatchUpdate]);

  // Initialize batcher
  useEffect(() => {
    batcherRef.current = new UpdateBatcher<LiveUpdate>(processBatch, {
      maxBatchSize: batchSize,
      maxWaitTime: maxWaitTime,
      minWaitTime: 50,
    });

    return () => {
      batcherRef.current?.flush();
      batcherRef.current?.clear();
    };
  }, [processBatch, batchSize, maxWaitTime]);

  // Throttled update function
  const queueUpdate = useCallback(
    throttle((update: Omit<LiveUpdate, 'timestamp'>) => {
      const fullUpdate: LiveUpdate = {
        ...update,
        timestamp: Date.now(),
      };
      batcherRef.current?.add(fullUpdate);
      setPendingUpdates((prev) => prev + 1);
    }, throttleInterval),
    [throttleInterval]
  );

  // Force flush pending updates
  const flushUpdates = useCallback(() => {
    batcherRef.current?.flush();
  }, []);

  // Clear pending updates
  const clearUpdates = useCallback(() => {
    batcherRef.current?.clear();
    setPendingUpdates(0);
  }, []);

  return {
    queueUpdate,
    flushUpdates,
    clearUpdates,
    pendingUpdates,
    lastUpdateTime,
  };
}

/**
 * Hook for subscribing to real-time game updates with optimization
 */
export function useRealTimeSubscription(gameIds: string[]) {
  const { queueUpdate, flushUpdates, pendingUpdates } = useOptimizedUpdates();
  const subscribedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Update subscriptions
    const newIds = new Set(gameIds);
    const toUnsubscribe = [...subscribedRef.current].filter((id) => !newIds.has(id));
    const toSubscribe = gameIds.filter((id) => !subscribedRef.current.has(id));

    // Clean up old subscriptions
    toUnsubscribe.forEach((id) => {
      subscribedRef.current.delete(id);
    });

    // Add new subscriptions
    toSubscribe.forEach((id) => {
      subscribedRef.current.add(id);
    });

    return () => {
      flushUpdates();
    };
  }, [gameIds, flushUpdates]);

  return {
    queueUpdate,
    pendingUpdates,
    subscribedCount: subscribedRef.current.size,
  };
}
