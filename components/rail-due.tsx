import { countDue } from "@/lib/queue";

/*
  The due count under the rail nav. A server component so the number is
  live on every navigation, wrapped in Suspense by the layout so the
  query never holds up the page.

  Absent at zero. A pill reading "0 due" is a pill that has to be read
  before it can be ignored.
*/
export async function RailDue() {
  let due = 0;
  try {
    due = await countDue();
  } catch {
    // Not signed in, or no database. The rail simply shows no count.
    return null;
  }

  if (due === 0) return null;

  return (
    <span
      className="tabular inline-flex items-center rounded-[999px] px-3 py-1 text-[13px]"
      style={{ backgroundColor: "var(--lapis-wash)", color: "var(--saffron)" }}
    >
      {due} due
    </span>
  );
}
