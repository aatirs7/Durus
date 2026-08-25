import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/*
  In Next 16 the middleware convention was renamed to proxy and runs on the Node
  runtime. clerkMiddleware returns an ordinary handler, so it exports from here
  under the new name unchanged.
*/

/*
  Everything that is reachable signed out.

  /privacy MUST be here. It is the URL given to App Store Connect and Apple
  fetches it signed out; behind the gate it answers with a redirect to a sign-in
  screen, which reads as an app whose privacy policy cannot be read.

  api/v1 MUST be here too, though for the opposite reason: those routes
  authenticate themselves with a Clerk bearer token from the phone. Left inside
  the gate, an unauthenticated call would come back as a redirect to an HTML
  page, which the sync client reads as a malformed response rather than as an
  auth failure.

  The cron carries its own bearer secret, and the push routes are keyed by an
  endpoint only the browser knows.
*/
const isPublic = createRouteMatcher([
  "/",
  "/privacy",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/unlock(.*)",
  "/api/v1(.*)",
  "/api/push(.*)",
  "/api/cron(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  /*
    The landing page is only ever for someone who is not signed in. Anyone with
    a session goes straight to Today, which is also what the installed app
    wants, since a shortcut saved before the split still points at the root.
  */
  if (request.nextUrl.pathname === "/" && userId) {
    const home = request.nextUrl.clone();
    home.pathname = "/today";
    return NextResponse.redirect(home);
  }

  /*
    An explicit redirect rather than auth.protect().

    protect() answers 404 when it cannot work out where the sign-in page is,
    which is what a signed-out visit to /today did: not "sign in", but "this
    does not exist". Naming the destination here means it cannot depend on
    environment variables being set somewhere else.
  */
  if (!isPublic(request) && !userId) {
    const signIn = request.nextUrl.clone();
    signIn.pathname = "/sign-in";
    signIn.search = "";
    return NextResponse.redirect(signIn);
  }
});

export const config = {
  matcher: [
    /*
      Clerk's recommended matcher: everything except Next's own static output
      and any file with an extension, plus the API routes, which must run
      through this so `auth()` is available inside them.
    */
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
