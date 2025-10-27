/**
 * Rate Limiting Utilities
 * Based on OWASP Top 10 2021 - A05:2021 Security Misconfiguration
 * Prevents brute force attacks and DoS
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;
  
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  
  /**
   * Identifier for the rate limit (e.g., IP address, user ID)
   */
  identifier: string;
}

/**
 * Check if request should be rate limited
 * Returns true if rate limit exceeded
 */
export function isRateLimited(config: RateLimitConfig): boolean {
  const { identifier, maxRequests, windowMs } = config;
  const now = Date.now();
  
  const entry = rateLimitStore.get(identifier);
  
  // No existing entry, create new one
  if (!entry) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return false;
  }
  
  // Reset window has passed
  if (now > entry.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return false;
  }
  
  // Increment count
  entry.count++;
  
  // Check if limit exceeded
  return entry.count > maxRequests;
}

/**
 * Get rate limit info for identifier
 */
export function getRateLimitInfo(identifier: string): {
  remaining: number;
  resetAt: number;
  limit: number;
} | null {
  const entry = rateLimitStore.get(identifier);
  
  if (!entry) {
    return null;
  }
  
  const now = Date.now();
  
  if (now > entry.resetAt) {
    return null;
  }
  
  return {
    remaining: Math.max(0, 100 - entry.count), // Assuming default limit of 100
    resetAt: entry.resetAt,
    limit: 100,
  };
}

/**
 * Clean up expired entries from rate limit store
 * Should be called periodically
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Preset rate limit configurations
 */
export const rateLimitPresets = {
  // Strict rate limit for file uploads
  upload: {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  
  // Standard rate limit for API calls
  api: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  
  // Lenient rate limit for general requests
  general: {
    maxRequests: 1000,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
};

// Cleanup expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
