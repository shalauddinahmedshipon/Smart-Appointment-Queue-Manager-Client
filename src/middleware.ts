// middleware.ts (at root or src/middleware.ts)
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/signup"] as const;
const PROTECTED_PREFIX = "/dashboard";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Get the httpOnly cookie set by your backend
  const accessToken = req.cookies.get("access_token")?.value;

  const isPublicPath = PUBLIC_PATHS.includes(pathname as any) || pathname === "/signup"; // exact match for safety
  const isProtectedPath = pathname === PROTECTED_PREFIX || pathname.startsWith(`${PROTECTED_PREFIX}/`);

  // Case 1: Trying to access protected route without token → redirect to login (/)
  if (isProtectedPath && !accessToken) {
    const loginUrl = new URL("/", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Case 2: Logged in (has token) + trying to access public auth pages → redirect to dashboard
  if (isPublicPath && accessToken) {
    const dashboardUrl = new URL("/dashboard", req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // All other cases → proceed normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",              // root login
    "/signup",        // signup
    "/dashboard",     // dashboard root
    "/dashboard/:path*", // all sub-routes
  ],
};
