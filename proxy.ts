import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/*
  In Next 16 the middleware convention was renamed to proxy and runs on
  the Node runtime, so node:crypto is available here.
*/
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (verifySessionToken(token)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/unlock";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!unlock|_next/static|_next/image|favicon.ico|icons|manifest.webmanifest).*)",
  ],
};
