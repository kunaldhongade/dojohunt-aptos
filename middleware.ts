import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // If user is authenticated but profile is incomplete, redirect to complete profile
    // (except if they're already on the complete-profile page)
    if (token && !token.profileComplete && pathname !== "/auth/complete-profile") {
      // Don't redirect if they're on public routes
      const publicRoutes = [
        "/",
        "/auth/signin",
        "/challenges",
        "/leaderboard",
        "/docs",
        "/tutorials",
        "/faq",
        "/terms",
        "/privacy",
        "/cookies",
      ];
      
      const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
      
      if (!isPublicRoute && !pathname.startsWith("/api/")) {
        return NextResponse.redirect(new URL("/auth/complete-profile", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Public routes that don't require authentication
        const publicRoutes = [
          "/",
          "/auth/signin",
          "/auth/complete-profile",
          "/challenges",
          "/leaderboard",
          "/docs",
          "/tutorials",
          "/faq",
          "/terms",
          "/privacy",
          "/cookies",
        ];

        // Allow public routes
        if (publicRoutes.some((route) => pathname.startsWith(route))) {
          return true;
        }

        // Allow API routes (they handle auth internally)
        if (pathname.startsWith("/api/")) {
          return true;
        }

        // Require authentication for other routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

