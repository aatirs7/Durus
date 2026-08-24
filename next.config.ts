import type { NextConfig } from "next";

/*
  There is deliberately no redirect for /unlock here.

  An earlier version redirected /unlock to / for the sake of a stale
  bookmark from the removed password gate. Once /unlock became the PIN
  screen again, that turned into a redirect loop: the proxy sends an
  unauthenticated request to /unlock, and the redirect sent it straight
  back to /. Route level redirects and the proxy have to agree about
  which paths are terminal.
*/
const nextConfig: NextConfig = {};

export default nextConfig;
