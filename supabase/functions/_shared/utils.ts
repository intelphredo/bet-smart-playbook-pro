// Shared utilities for edge functions

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Structured logging utility
export const log = {
  info: (msg: string, data?: Record<string, unknown>) => 
    console.log(JSON.stringify({ 
      level: "info", 
      msg, 
      ...data, 
      ts: new Date().toISOString() 
    })),
  warn: (msg: string, data?: Record<string, unknown>) => 
    console.warn(JSON.stringify({ 
      level: "warn", 
      msg, 
      ...data, 
      ts: new Date().toISOString() 
    })),
  error: (msg: string, error?: Error | unknown, data?: Record<string, unknown>) => 
    console.error(JSON.stringify({ 
      level: "error", 
      msg, 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...data, 
      ts: new Date().toISOString() 
    })),
  debug: (msg: string, data?: Record<string, unknown>) => 
    console.log(JSON.stringify({ 
      level: "debug", 
      msg, 
      ...data, 
      ts: new Date().toISOString() 
    })),
};

// Standardized error response interface
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
    timestamp: string;
  };
}

// Standardized success response interface
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
}

// Create error response
export function createErrorResponse(
  code: string, 
  message: string, 
  status = 500, 
  details?: string
): Response {
  const errorBody: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  };
  
  return new Response(JSON.stringify(errorBody), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Create success response
export function createSuccessResponse<T>(data: T, status = 200): Response {
  const body: SuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Handle CORS preflight
export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

// Retry with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { 
    maxRetries = 3, 
    baseDelay = 1000, 
    maxDelay = 10000,
    onRetry 
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      log.warn(`Retry attempt ${attempt + 1}/${maxRetries}`, { 
        error: lastError.message, 
        delay 
      });
      
      onRetry?.(attempt + 1, lastError);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Batch processor for large arrays
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    batchSize?: number;
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<R[]> {
  const { batchSize = 10, concurrency = 5, onProgress } = options;
  const results: R[] = [];
  let completed = 0;
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // Process batch with concurrency limit
    const chunks: T[][] = [];
    for (let j = 0; j < batch.length; j += concurrency) {
      chunks.push(batch.slice(j, j + concurrency));
    }
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(chunk.map(processor));
      results.push(...chunkResults);
      completed += chunk.length;
      onProgress?.(completed, items.length);
    }
  }
  
  return results;
}

// Rate limiter for external API calls
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second
  
  constructor(maxTokens: number, refillRate: number) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }
  
  async acquire(): Promise<void> {
    this.refill();
    
    if (this.tokens < 1) {
      const waitTime = (1 - this.tokens) / this.refillRate * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.refill();
    }
    
    this.tokens -= 1;
  }
  
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
}

// Validate required environment variables
export function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Parse JSON body safely
export async function parseJsonBody<T>(req: Request): Promise<T | null> {
  try {
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      const text = await req.text();
      if (text) {
        return JSON.parse(text) as T;
      }
    }
  } catch {
    // Ignore parse errors, return null
  }
  return null;
}

// Format American odds for display
export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

// Calculate profit from American odds
export function calculateProfit(stake: number, odds: number): number {
  const profit = odds > 0 
    ? stake * (odds / 100)
    : stake * (100 / Math.abs(odds));
  return Math.round(profit * 100) / 100;
}
