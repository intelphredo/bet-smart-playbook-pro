// Rate limiting utility for edge functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface RateLimitConfig {
  maxRequests: number;      // Maximum requests per window
  windowMinutes: number;    // Time window in minutes
  endpoint: string;         // Endpoint identifier
}

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  retryAfter?: number;  // Seconds until limit resets
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 60,
  windowMinutes: 1,
  endpoint: "default",
};

/**
 * Check if a request is allowed based on rate limiting rules.
 * Uses database-backed tracking for persistence across edge function instances.
 */
export async function checkRateLimit(
  req: Request,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
  const { maxRequests, windowMinutes, endpoint } = { ...DEFAULT_CONFIG, ...config };
  
  // Get client identifier (IP address or forwarded IP)
  const identifier = getClientIdentifier(req);
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      // If no database connection, allow request (fail open)
      console.warn("Rate limiter: No database connection, allowing request");
      return { allowed: true };
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Call the rate limit check function
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_minutes: windowMinutes,
    });
    
    if (error) {
      console.error("Rate limiter error:", error);
      // Fail open on database errors
      return { allowed: true };
    }
    
    const allowed = data === true;
    
    return {
      allowed,
      remaining: allowed ? undefined : 0,
      retryAfter: allowed ? undefined : windowMinutes * 60,
    };
  } catch (error) {
    console.error("Rate limiter exception:", error);
    // Fail open on unexpected errors
    return { allowed: true };
  }
}

/**
 * Get client identifier from request headers
 */
function getClientIdentifier(req: Request): string {
  // Try various headers for client IP
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // Take the first IP in the chain
    return forwarded.split(",")[0].trim();
  }
  
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  
  const cfConnecting = req.headers.get("cf-connecting-ip");
  if (cfConnecting) {
    return cfConnecting.trim();
  }
  
  // Fallback to a hash of user agent + timestamp bucket (not ideal but better than nothing)
  const userAgent = req.headers.get("user-agent") || "unknown";
  return `ua-${hashCode(userAgent)}`;
}

/**
 * Simple hash function for fallback identification
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string> = {}
): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfter || 60),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Public read endpoints - higher limits
  PUBLIC_READ: {
    maxRequests: 100,
    windowMinutes: 1,
  },
  // Write endpoints - stricter limits
  WRITE: {
    maxRequests: 20,
    windowMinutes: 1,
  },
  // Auth endpoints - very strict for brute force protection
  AUTH: {
    maxRequests: 5,
    windowMinutes: 1,
  },
  // Scheduled jobs - minimal limits
  SCHEDULED: {
    maxRequests: 10,
    windowMinutes: 5,
  },
} as const;
