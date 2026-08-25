"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, Eyebrow, PageTitle, Rule, Screen } from "@/components/ui";
import type { Settings } from "@/db/schema";
import { TOTAL_LESSONS } from "@/lib/constants";
import { exportAll, updateSettings } from "./actions";
import { PushSettings } from "./push-settings";
import { SignOutButton } from "./sign-out-button";
import { Toggle } from "./toggle";

export function SettingsForm({
  initial,
  vapidPublicKey,
  profileName,
}: {
  initial: Settings;
  vapidPublicKey: string | null;
  profileName: string;
}) {
  const [config, setConfig] = useState(initial);
  const [, start] = useTransition();

  function patch(next: Partial<Settings>) {
    setConfig((prev) => ({ ...prev, ...next }));
    start(async () => {
      await updateSettings(next as Parameters<typeof updateSettings>[0]);
    });
  }

  return (
    <Screen className="gap-10 py-10">
      <div className="flex flex-col gap-2">
        <Eyebrow>Preferences</Eyebrow>
        <PageTitle>Settings</PageTitle>
      </div>

      <Field label="Theme">
        <ThemeToggle />
      </Field>

      <Rule />

      <Field label="Current lesson">
        <Stepper
          value={config.currentLesson}
          min={1}
          max={TOTAL_LESSONS}
          onChange={(currentLesson) => patch({ currentLesson })}
        />
      </Field>

      <Field label="New cards per day">
        <Stepper
          value={config.newPerDay}
          min={0}
          max={60}
          step={2}
          onChange={(newPerDay) => patch({ newPerDay })}
        />
      </Field>

      <Field label="Max reviews per day">
        <Stepper
          value={config.maxReviews}
          min={10}
          max={400}
          step={10}
          onChange={(maxReviews) => patch({ maxReviews })}
        />
      </Field>

      <Field label="Speed window">
        <Stepper
          value={config.speedWindowMs}
          min={700}
          max={5000}
          step={100}
          format={(n) => `${(n / 1000).toFixed(1)}s`}
          onChange={(speedWindowMs) => patch({ speedWindowMs })}
        />
      </Field>

      <Field label="Show harakat">
        <Toggle
          on={config.showHarakat}
          onChange={(showHarakat) => patch({ showHarakat })}
        />
      </Field>

      <Rule />

      <PushSettings
        remindersOn={config.remindersOn}
        reminderHour={config.reminderHour}
        secondReminderOn={config.secondReminderOn}
        reminderHour2={config.reminderHour2}
        classDayReminder={config.classDayReminder}
        vapidPublicKey={vapidPublicKey}
        onPatch={patch}
      />

      <Rule />

      <Field label="Data">
        <Button
          variant="quiet"
          onClick={async () => {
            const data = await exportAll();
            const blob = new Blob([JSON.stringify(data, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `durus-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export all data as JSON
        </Button>
      </Field>

      {/*
        Desktop only, and the only place the full map lives - the drills
        themselves show no shortcuts, so this is where you look it up
        once.
      */}
      <div className="hidden lg:block">
        <Rule className="mb-10" />
        <Field label="Keyboard">
          <ul className="flex flex-col items-center gap-2">
            {KEYS.map((row) => (
              <li key={row.action} className="flex items-baseline gap-3">
                <span className="tabular text-ink-soft w-[92px] text-right text-[13px]">
                  {row.key}
                </span>
                <span className="text-ink w-[160px] text-left text-[15px]">
                  {row.action}
                </span>
              </li>
            ))}
          </ul>
        </Field>
      </div>

      <Rule />

      <Field label="Account">
        <p className="text-ink-soft text-[15px]">Signed in as {profileName}</p>
        <SignOutButton />
      </Field>

      <Link href="/today" className="text-lapis text-[16px] underline-offset-4">
        Back to today
      </Link>
    </Screen>
  );
}

/*
  Pairs, not a table. The key column is monospace so the glyphs line up
  against each other rather than against the words.
*/
/*
  Only keys that are actually bound.

  This list had drifted into fiction: it advertised four grade numerals
  for a row the review screen no longer has, plus an r and an h that
  nothing has ever listened for. A keyboard map that lies is worse than
  no keyboard map, because the one thing it is for is being trusted
  without checking.

  Bound in app/review/session.tsx, app/cards/deck.tsx,
  app/cases/case-run.tsx, app/speed/speed-run.tsx and components/help.tsx.
*/
const KEYS = [
  { key: "space", action: "Reveal, or turn a card" },
  { key: "u", action: "Undo the last answer" },
  { key: "esc", action: "End the session" },
  { key: "← →", action: "Missed it, knew it" },
  { key: "m", action: "Mark a word for more work" },
  { key: "?", action: "What this drill is for" },
] as const;

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Eyebrow>{label}</Eyebrow>
      {children}
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  step = 1,
  format,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (n: number) => string;
  onChange: (n: number) => void;
}) {
  return (
    <div className="border-rule bg-surface flex items-center gap-1 rounded-[999px] border px-2 py-1">
      <button
        type="button"
        aria-label="Less"
        onClick={() => onChange(Math.max(min, value - step))}
        className="text-ink-soft px-4 py-1 text-[18px]"
      >
        -
      </button>
      <span className="tabular text-ink w-16 text-[18px]">
        {format ? format(value) : value}
      </span>
      <button
        type="button"
        aria-label="More"
        onClick={() => onChange(Math.min(max, value + step))}
        className="text-ink-soft px-4 py-1 text-[18px]"
      >
        +
      </button>
    </div>
  );
}
