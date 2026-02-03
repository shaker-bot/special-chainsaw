/**
 * Sliding-window in-memory rate limiter.
 *
 * Suitable for single-process deployments (Vercel serverless, single
 * container). For multi-instance setups, swap for a Redis-backed store.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;
    for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key);
    }
}

export function rateLimit(
    key: string,
    config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetAt: number } {
    cleanup();

    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        const newEntry: RateLimitEntry = { count: 1, resetAt: now + config.windowMs };
        store.set(key, newEntry);
        return { allowed: true, remaining: config.maxRequests - 1, resetAt: newEntry.resetAt };
    }

    entry.count += 1;

    if (entry.count > config.maxRequests) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}
