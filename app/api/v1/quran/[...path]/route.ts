import { handle } from "@/lib/quran/handler";

/*
  Quran Foundation content for the Durus app: GET /api/v1/quran/resources and
  GET /api/v1/quran/chapter/:n?translation=&reciter=.

  Under /api/v1 so the proxy lets it through signed out; it checks its own app
  key (DURUS_APP_KEY, sent as x-durus-key). The Quran Foundation secret lives
  only in this server's environment (QF_CLIENT_ID, QF_CLIENT_SECRET, QF_ENV).
*/
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!process.env.QF_CLIENT_ID || !process.env.QF_CLIENT_SECRET) {
    return Response.json({ error: "quran_not_configured" }, { status: 503 });
  }
  return handle(request, process.env);
}
