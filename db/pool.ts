import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "./schema";

/*
  A second database client, for the mobile sync API only.

  db/index.ts uses drizzle-orm/neon-http, which cannot do interactive
  transactions - it sends one statement per request. That is fine for the web
  pages, which never need more than a single statement to be atomic.

  Ingest does. It takes a row lock on profile.sync_seq, allocates sequence
  numbers under it, inserts, and commits. Sequence numbers handed out outside a
  held lock produce gaps in the cursor, and a gap means a row that a client
  never sees - the quietest possible sync bug.

  So: the HTTP client stays exactly as it was for the web app, and lib/sync/
  uses this one. Two clients rather than migrating the whole app to a pool,
  because the pages do not need it and changing them would be risk for nothing.
*/
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

/* The pooled driver talks over a websocket, which Node needs told about. */
neonConfig.webSocketConstructor = ws;

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const poolDb = drizzle(pool, { schema });
