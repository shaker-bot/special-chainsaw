import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { rateLimit, type RateLimitConfig } from "@/lib/rate-limit";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

const UPLOAD_LIMIT: RateLimitConfig = { windowMs: 60_000, maxRequests: 10 };
const API_LIMIT: RateLimitConfig = { windowMs: 60_000, maxRequests: 30 };
const AUTH_PAGE_LIMIT: RateLimitConfig = { windowMs: 60_000, maxRequests: 20 };

function getRateLimitConfig(pathname: string): RateLimitConfig | null {
  if (pathname.startsWith("/api/profile/avatar")) return UPLOAD_LIMIT;
  if (pathname.startsWith("/api/")) return API_LIMIT;
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))
    return AUTH_PAGE_LIMIT;
  return null;
}

export default clerkMiddleware(async (auth, request) => {
  // --- Rate limiting ---
  const pathname = request.nextUrl.pathname;
  const config = getRateLimitConfig(pathname);

  if (config) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const bucket = pathname.startsWith("/api/profile/avatar")
      ? "upload"
      : pathname.startsWith("/api/")
        ? "api"
        : "auth";

    const result = rateLimit(`${ip}:${bucket}`, config);

    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((result.resetAt - Date.now()) / 1000),
            ),
          },
        },
      );
    }
  }

  // --- Auth protection ---
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
