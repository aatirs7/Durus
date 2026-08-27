/*
  Writes a semantic description of the Postgres schema for the iOS repo to
  check itself against.

  Two Drizzle schemas have to agree column for column: db/schema.ts here, and
  src/data/schema.ts in DurusIOS. They are hand written in two dialects, in two
  repositories, and the sync protocol assumes they describe the same rows. A
  drift is not a crash - it is a 400 from the API three weeks later, or worse, a
  column that silently never syncs.

  Hand written files plus a conformance test beats a shared DSL at seven
  tables: the DSL's cost is paid on every schema change forever, the test's is
  paid once.

  WHY THE GENERATOR LIVES HERE AND THE TEST LIVES THERE

  The snapshot is COMMITTED into the iOS repo and the test reads it as plain
  JSON, so the check runs on a clean clone with no access to this repository
  and no cross-repo TypeScript. Generating it here is what keeps the Postgres
  schema's own imports resolvable. Drift then shows up as either a failing test
  or a dirty snapshot after regeneration - both of which are loud.

  Run with: npx tsx scripts/emit-schema-snapshot.ts
*/

import { getTableConfig } from "drizzle-orm/pg-core";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import * as schema from "../db/schema";

/*
  The descriptor is SEMANTIC, not literal.

  A serial in Postgres and an integer primary key in SQLite are the same thing;
  a timestamp with time zone and an integer holding epoch milliseconds are the
  same thing. Comparing dialect column types would report those as differences
  every time, which is how a conformance test gets muted. So both sides
  normalise to one of six kinds and the mapping table in spec section 2.1
  becomes machine checked rather than a paragraph of prose.
*/
type Kind = "int" | "real" | "text" | "bool" | "instant" | "enum";

type ColumnDescriptor = {
  kind: Kind;
  notNull: boolean;
  primaryKey: boolean;
  hasDefault: boolean;
  /* Present only for enums, and compared as a set: the ORDER of enum values is
     a dialect detail, their membership is not. */
  values?: string[];
};

export type SchemaDescriptor = {
  tables: Record<string, Record<string, ColumnDescriptor>>;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function kindOf(column: any): Kind {
  const columnType: string = column.columnType ?? "";

  /* Checked before dataType, which reports both integers and reals as
     "number". ease and intervalDays are real on both sides and an int/real
     mixup is exactly the kind of thing the fold would carry silently. */
  if (/Real|Double/.test(columnType)) return "real";

  if (Array.isArray(column.enumValues) && column.enumValues.length > 0) return "enum";

  switch (column.dataType) {
    case "date":
      return "instant";
    case "boolean":
      return "bool";
    case "number":
      return "int";
    default:
      return "text";
  }
}

export function describeColumn(column: any): ColumnDescriptor {
  const descriptor: ColumnDescriptor = {
    kind: kindOf(column),
    notNull: Boolean(column.notNull),
    primaryKey: Boolean(column.primary),
    hasDefault: Boolean(column.hasDefault),
  };
  if (descriptor.kind === "enum") {
    descriptor.values = [...(column.enumValues as string[])].sort();
  }
  return descriptor;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const tables: SchemaDescriptor["tables"] = {};

for (const value of Object.values(schema)) {
  /* Every exported pgTable, and nothing else - the module also exports enums
     and relations. */
  let config;
  try {
    config = getTableConfig(value as never);
  } catch {
    continue;
  }
  if (!config?.name) continue;

  const columns: Record<string, ColumnDescriptor> = {};
  for (const column of config.columns) {
    columns[column.name] = describeColumn(column);
  }
  tables[config.name] = columns;
}

const descriptor: SchemaDescriptor = { tables };

const out = join(
  __dirname,
  "..",
  "..",
  "DurusIOS",
  "src",
  "data",
  "__tests__",
  "pg-schema.snapshot.json",
);

writeFileSync(out, `${JSON.stringify(descriptor, null, 2)}\n`, "utf8");

const columnCount = Object.values(tables).reduce((n, t) => n + Object.keys(t).length, 0);
console.log(`wrote ${out}`);
console.log(`${Object.keys(tables).length} tables, ${columnCount} columns`);
