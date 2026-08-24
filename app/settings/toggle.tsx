"use client";

/*
  Lives in its own module because settings-form renders PushSettings and
  PushSettings needs the Toggle. Keeping it here breaks what would
  otherwise be a circular import between two client components, which
  leaves Toggle undefined at render time and takes the page down.
*/

export function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="border-rule flex h-8 w-14 items-center rounded-[999px] border p-1 transition-colors"
      style={{ backgroundColor: on ? "var(--lapis)" : "var(--surface-sunk)" }}
    >
      <span
        className="size-6 rounded-[999px] transition-transform"
        style={{
          backgroundColor: on ? "var(--paper)" : "var(--ink-faint)",
          transform: on ? "translateX(24px)" : "translateX(0)",
        }}
      />
    </button>
  );
}
