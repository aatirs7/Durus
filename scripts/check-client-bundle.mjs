/*
  Fails if a "use client" file can reach the Neon client.

  db/index.ts throws at module scope when DATABASE_URL is missing, which
  it always is in a browser, so one value imported from a db backed
  module takes the whole page down at hydration. The thrown error names
  DATABASE_URL, which points at the database rather than at the import
  that actually caused it, so this is worth catching mechanically.

  Run with: npm run check:client
*/

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = ["app", "components", "lib", "db"];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(full)) out.push(full);
  }
  return out;
}

const files = SRC.flatMap((d) => walk(join(ROOT, d)));
const source = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));

/* Only value imports matter. `import type` is erased by the compiler. */
function imports(text) {
  const out = [];
  const re = /^import\s+(?!type\s)([\s\S]*?)from\s+["']([^"']+)["']/gm;
  let m;
  while ((m = re.exec(text))) {
    // A named clause that is entirely `type X` is erased too.
    const clause = m[1].trim();
    const onlyTypes =
      clause.startsWith("{") &&
      clause
        .replace(/[{}]/g, "")
        .split(",")
        .filter((s) => s.trim())
        .every((s) => s.trim().startsWith("type "));
    if (!onlyTypes) out.push(m[2]);
  }
  return out;
}

function resolve(spec, from) {
  if (!spec.startsWith("@/") && !spec.startsWith(".")) return null;
  const base = spec.startsWith("@/")
    ? join(ROOT, spec.slice(2))
    : join(from, "..", spec);
  // join, not string concatenation, or the index candidates get a
  // forward slash glued onto a backslash path on Windows and never
  // match anything in the map.
  const candidates = [
    base + ".ts",
    base + ".tsx",
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ];
  for (const candidate of candidates) {
    if (source.has(candidate)) return candidate;
  }
  return null;
}

const TAINTED = new Set([join(ROOT, "db", "index.ts")]);

/* Walk the import graph from a client entry looking for the db module. */
function reachesDb(file, seen = new Set()) {
  if (seen.has(file)) return null;
  seen.add(file);
  for (const spec of imports(source.get(file) ?? "")) {
    /*
      A "use server" module is a boundary, not a dependency. Its exports
      become RPC stubs on the client, so its own imports never reach the
      browser and traversing into it produces only false positives.
    */
    const target = resolve(spec, file);
    if (!target) continue;
    if (/^["']use server["']/m.test(source.get(target) ?? "")) continue;
    if (TAINTED.has(target)) return [file, target];
    const deeper = reachesDb(target, seen);
    if (deeper) return [file, ...deeper.slice(1)];
  }
  return null;
}

const bad = [];
for (const [file, text] of source) {
  if (!/^["']use client["']/m.test(text)) continue;
  const path = reachesDb(file);
  if (path) bad.push([file, path[path.length - 1]]);
}

if (bad.length > 0) {
  console.error("Client components that reach the database client:\n");
  for (const [file, db] of bad) {
    console.error(`  ${relative(ROOT, file)}  ->  ${relative(ROOT, db)}`);
  }
  console.error(
    "\nMove the value into lib/constants.ts, or make the import `import type`.",
  );
  process.exit(1);
}

console.log("No client component reaches the database client.");
