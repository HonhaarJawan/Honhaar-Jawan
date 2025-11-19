  import { NextResponse } from "next/server";

  // Reusable authentication middleware creator
  export function createAuthMiddleware(options = {}) {
    const {
      protectedPaths = ["/dashboard", "/new-registration", "/login"], // Default protected paths
      cookieName = "userlogged",
      redirectPath = "/login",
      enableLogs = true,
      requireAuth = true, // Whether route requires authentication (true) or requires no auth (false)
    } = options;

    // Middleware function
    return function middleware(request) {
      // Get the cookie
      const userData = request.cookies.get(cookieName);

      // Check if current path is protected
      const isProtectedPath = protectedPaths.some((path) =>
        request.nextUrl.pathname.startsWith(path)
      );

      if (enableLogs) {
        console.log(
          `[Auth Middleware] Checking path: ${request.nextUrl.pathname}`
        );
        console.log(`[Auth Middleware] Is protected path: ${isProtectedPath}`);
        console.log(`[Auth Middleware] User data exists: ${!!userData}`);
      }

      // If accessing protected route and no user data found when auth required
      // OR if accessing protected route and user data found when no auth required
      if (
        (isProtectedPath && !userData && requireAuth) ||
        (isProtectedPath && userData && !requireAuth)
      ) {
        if (enableLogs) {
          console.log(
            `[Auth Middleware] ${
              requireAuth ? "Unauthorized" : "Already authenticated"
            } access - redirecting to ${redirectPath}`
          );
        }
        return NextResponse.redirect(new URL(redirectPath, request.url));
      }

      if (enableLogs) {
        console.log("[Auth Middleware] Access granted");
      }

      // User is authenticated or accessing other routes
      return NextResponse.next();
    };
  }

  // Combined middleware that handles both auth and non-auth routes
  export const middleware = (request) => {
    const authPages = ["/login", "/new-registration"];
    const protectedPages = ["/dashboard"];

    const isAuthPage = authPages.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    );

    if (isAuthPage) {
      // Use middleware for auth pages
      return createAuthMiddleware({
        protectedPaths: authPages,
        cookieName: "userlogged",
        redirectPath: "/dashboard",
        enableLogs: true,
        requireAuth: false,
      })(request);
    } else {
      // Use middleware for protected pages
      return createAuthMiddleware({
        protectedPaths: protectedPages,
        cookieName: "userlogged", // Fixed: was "use"
        redirectPath: "/login",
        enableLogs: true,
        requireAuth: true,
      })(request);
    }
  };

  // Configure which routes this middleware should run on
  export const config = {
    matcher: [
      "/dashboard/:path*",
      "/login/:path*",
      "/new-registration/:path*", // Added missing path
    ],
  };  