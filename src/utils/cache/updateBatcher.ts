/**
 * Update Batcher
 * Batches multiple updates into single state changes to reduce re-renders
 * Especially useful for live game updates
 */

type UpdateCallback<T> = (updates: T[]) => void;

interface BatcherConfig {
  maxBatchSize?: number;
  maxWaitTime?: number;
  minWaitTime?: number;
}

class UpdateBatcher<T> {
  private pending: T[] = [];
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private lastFlush = 0;
  private callback: UpdateCallback<T>;
  private maxBatchSize: number;
  private maxWaitTime: number;
  private minWaitTime: number;

  constructor(callback: UpdateCallback<T>, config: BatcherConfig = {}) {
    this.callback = callback;
    this.maxBatchSize = config.maxBatchSize ?? 10;
    this.maxWaitTime = config.maxWaitTime ?? 1000; // 1 second max wait
    this.minWaitTime = config.minWaitTime ?? 100; // 100ms min debounce
  }

  add(update: T): void {
    this.pending.push(update);

    // Flush immediately if batch is full
    if (this.pending.length >= this.maxBatchSize) {
      this.flush();
      return;
    }

    // Clear existing timeout
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    // Calculate wait time based on time since last flush
    const timeSinceFlush = Date.now() - this.lastFlush;
    const waitTime = Math.max(
      this.minWaitTime,
      Math.min(this.maxWaitTime - timeSinceFlush, this.maxWaitTime)
    );

    // Schedule flush
    this.timeout = setTimeout(() => this.flush(), waitTime);
  }

  flush(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.pending.length === 0) return;

    const updates = [...this.pending];
    this.pending = [];
    this.lastFlush = Date.now();

    // Call with batched updates
    this.callback(updates);
  }

  clear(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.pending = [];
  }

  get pendingCount(): number {
    return this.pending.length;
  }
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    lastArgs = args;

    if (now - lastCall >= limit) {
      lastCall = now;
      return fn(...args);
    }

    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null;
        lastCall = Date.now();
        if (lastArgs) {
          fn(...lastArgs);
        }
      }, limit - (now - lastCall));
    }
  }) as T;
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = null;
      fn(...args);
    }, delay);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

/**
 * RAF-based throttle for smooth animations
 */
export function rafThrottle<T extends (...args: any[]) => any>(fn: T): T {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  return ((...args: Parameters<T>) => {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (lastArgs) {
          fn(...lastArgs);
        }
      });
    }
  }) as T;
}

export default UpdateBatcher;
