import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a mock rate limiter for development
const mockRateLimiter = {
  limit: async () => ({
    success: true,
    limit: 10,
    remaining: 10,
    reset: Date.now() + 10000,
  }),
};

// Initialize rate limiter based on environment
let ratelimit: typeof mockRateLimiter | Ratelimit;

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn("Upstash Redis credentials not found. Rate limiting disabled in development.");
  ratelimit = mockRateLimiter;
} else {
  // Create Redis client for production
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // Create rate limiter - 10 requests per 10 seconds sliding window
  ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
    prefix: "@upstash/ratelimit/crypto-volumetrica",
  });
}

export { ratelimit };

// Helper function to check rate limit with proper headers
export async function checkRateLimit(request: Request) {
  // Get identifier (IP address)
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'anonymous';
  
  // Check rate limit
  const { success, limit, remaining, reset } = await ratelimit.limit(ip);
  
  // Create rate limit headers
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', limit.toString());
  headers.set('X-RateLimit-Remaining', remaining.toString());
  headers.set('X-RateLimit-Reset', new Date(reset).toISOString());
  
  return { success, headers };
}