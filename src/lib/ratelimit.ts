import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "./env";
import { apiError } from "./api-error";

let redisClient: Redis | null = null;
function redis(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redisClient;
}

const limiters = new Map<string, Ratelimit>();
function limiter(key: string, tokens: number, window: `${number} ${"s" | "m" | "h" | "d"}`): Ratelimit {
  let l = limiters.get(key);
  if (!l) {
    l = new Ratelimit({
      redis: redis(),
      limiter: Ratelimit.slidingWindow(tokens, window),
      prefix: `rl:${key}`,
      analytics: false,
    });
    limiters.set(key, l);
  }
  return l;
}

export const rateLimits = {
  sendOtp: () => limiter("sendOtp", 3, "10 m"),
  verifyOtp: () => limiter("verifyOtp", 5, "5 m"),
  adminLogin: () => limiter("adminLogin", 10, "10 m"),
  enquirySubmit: () => limiter("enquirySubmit", 5, "1 h"),
  couponValidate: () => limiter("couponValidate", 30, "1 m"),
};

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function enforceRateLimit(
  req: Request,
  l: Ratelimit,
  identifier?: string,
  responseHeaders?: HeadersInit
): Promise<Response | null> {
  const id = identifier ? `${clientIp(req)}:${identifier}` : clientIp(req);
  const { success, limit, remaining, reset } = await l.limit(id);
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(reset),
    ...(responseHeaders ? Object.fromEntries(new Headers(responseHeaders).entries()) : {}),
  };
  if (!success) {
    headers["Retry-After"] = String(Math.max(1, Math.ceil((reset - Date.now()) / 1000)));
    return apiError("RATE_LIMITED", "Too many requests, please slow down", headers);
  }
  return null;
}
