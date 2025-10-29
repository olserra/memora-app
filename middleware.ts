import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Server middleware that performs a fast presence-check for our session cookie
// and does a server-side redirect from `/` -> `/dashboard/memories` when the
// cookie is present. We only check cookie presence here (not token
// verification) to keep this code edge-safe and very fast; the app's server
// routes will still validate the token when necessary.
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Only act on the root path. Avoid interfering with other routes.
  if (pathname === "/") {
    const sessionCookie = req.cookies.get("session")?.value;
    if (sessionCookie) {
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
