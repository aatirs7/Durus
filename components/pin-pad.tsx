"use client";

import { useCallback, useEffect } from "react";
import { PIN_LENGTH } from "@/lib/auth";

/*
  Four dots and a keypad. Submits itself on the fourth digit, because
  making someone reach for a separate confirm button after typing a PIN
  is the sort of friction you notice every single day.
*/

/* Clear sits bottom left so the row is not lopsided, and so the two
   destructive keys bracket the zero rather than crowding one side. */
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "del"];

export function PinPad({
  value,
  onChange,
  onComplete,
  disabled = false,
  shake = false,
}: {
  value: string;
  onChange: (next: string) => void;
  onComplete: (pin: string) => void;
  disabled?: boolean;
  shake?: boolean;
}) {
  const press = useCallback(
    (key: string) => {
      if (disabled) return;

      if (key === "del") {
        onChange(value.slice(0, -1));
        return;
      }
      if (key === "clear") {
        onChange("");
        return;
      }
      if (!/^\d$/.test(key) || value.length >= PIN_LENGTH) return;

      const next = value + key;
      onChange(next);
      if (next.length === PIN_LENGTH) onComplete(next);
    },
    [value, onChange, onComplete, disabled],
  );

  // A hardware keyboard should work too, for the desktop case.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        press(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        press("del");
      } else if (e.key === "Escape") {
        e.preventDefault();
        press("clear");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  return (
    <div className="flex flex-col items-center gap-10">
      <div
        className={`flex gap-4 ${shake ? "pin-shake" : ""}`}
        aria-label={`${value.length} of ${PIN_LENGTH} digits entered`}
      >
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span
            key={i}
            className="size-3.5 rounded-[999px] transition-colors duration-150"
            style={{
              backgroundColor:
                i < value.length ? "var(--lapis)" : "var(--surface-sunk)",
              border:
                i < value.length ? "none" : "1px solid var(--rule)",
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {KEYS.map((key, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled || (key === "clear" && value.length === 0)}
            onClick={() => press(key)}
            aria-label={
              key === "del" ? "Delete" : key === "clear" ? "Clear" : key
            }
            className="border-rule bg-surface active:bg-surface-sunk flex size-[72px] items-center justify-center rounded-[999px] border transition-colors disabled:opacity-30"
          >
            {key === "del" ? (
              <span className="text-ink-soft text-[20px]">&#9003;</span>
            ) : key === "clear" ? (
              <span className="text-ink-soft text-[13px] tracking-wide uppercase">
                Clear
              </span>
            ) : (
              <span className="tabular text-ink text-[26px]">{key}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
