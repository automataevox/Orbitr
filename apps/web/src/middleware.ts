import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  try {
    // Add security headers
    const headers = new Headers(request.headers);
    headers.set("X-DNS-Prefetch-Control", "on");
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-XSS-Protection", "1; mode=block");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return NextResponse.next({ headers });
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/ws (websocket)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/ws|_next/static|_next/image|favicon.ico).*)",
  ],
};
