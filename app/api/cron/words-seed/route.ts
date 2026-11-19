import { NextResponse } from "next/server";

import { seedQuranicWords } from "@/lib/seed-quranic-words";

/*
  TEMPORARY. Runs the Quranic Words seed once from inside production, where the
  database credentials live. Guarded by WORDS_SEED_TOKEN, a one-off env var.
  Remove this route and the env var once it has run.
*/
export async function POST(req: Request) {
  const token = process.env.WORDS_SEED_TOKEN;
  if (!token || req.headers.get("x-seed-token") !== token) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const result = await seedQuranicWords();
  return NextResponse.json(result);
}
