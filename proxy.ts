import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/*
  In Next 16 the middleware convention was renamed to proxy and runs on
  the Node runtime, so node:crypto is available here.
*/
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const signedIn = verifySessionToken(token);

  /*
    The landing page is the one public page, and it is only ever for
    someone who is not signed in. Anyone with a session goes straight
    to Today, which is also what the installed app wants, since a
    shortcut saved before the split still points at the root.
  */
  if (request.nextUrl.pathname === "/") {
    if (!signedIn) return NextResponse.next();
    const home = request.nextUrl.clone();
    home.pathname = "/today";
    return NextResponse.redirect(home);
  }

  if (signedIn) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/unlock";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
      Everything except the unlock screen itself, the push endpoints the
      service worker talks to, the cron, the mobile API, and static assets.
      The cron carries its own bearer secret, the push routes are keyed by an
      endpoint only the browser knows, and api/v1 authenticates every request
      with a Clerk bearer token.

      api/v1 MUST be excluded. This gate redirects anything unauthenticated to
      /unlock, so without the exclusion every request from the phone would come
      back as a 307 to an HTML sign-in page - which the sync client would read
      as a malformed response rather than as an auth failure.

      /privacy MUST be excluded for the same shape of reason. It is the URL
      given to App Store Connect, and Apple fetches it signed out: behind the
      gate it answers with a redirect to a sign-in screen, which reads as an app
      whose privacy policy cannot be read. It is also the one page someone
      deciding whether to sign up is entitled to read before they do.
    */
    "/((?!unlock|privacy|api/push|api/cron|api/v1|api/webhooks|_next/static|_next/image|favicon.ico|icon-|apple-touch-icon|splash-|sw.js|manifest.webmanifest).*)",
  ],
};
