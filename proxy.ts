import { verifyToken } from "@/lib/auth/session";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Validate the session cookie before issuing a redirect from `/` ->
// `/dashboard/memories`. Previously this middleware only checked cookie
// presence which could cause a redirect loop when a stale/invalid cookie
// existed: the dashboard's auth guard would clear/redirect and the middleware
// would immediately send the user back. To prevent that, validate the
// token; if invalid, clear the cookie and allow the request through.
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Only act on the root path. Avoid interfering with other routes.
  if (pathname === "/") {
    const sessionCookie = req.cookies.get("session")?.value;
    if (sessionCookie) {
      try {
        // verifyToken will throw on invalid/expired tokens
        await verifyToken(sessionCookie);
      } catch (e) {
        // Invalid token: clear the cookie so presence-only checks won't
        // redirect the user, then continue with request handling.
        console.warn("Invalid session token:", e);
        const res = NextResponse.next();
        // Set the cookie to an empty value with maxAge=0 to instruct the
        // browser to delete it.
        res.cookies.set("session", "", { maxAge: 0, path: "/" });
        return res;
      }

      // Token is valid -> redirect to dashboard
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard/memories";
      url.search = search;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Only run middleware for the site root. This keeps the redirect logic
  // narrowly scoped and avoids unexpected redirects on other pages.
  matcher: ["/"],
};
