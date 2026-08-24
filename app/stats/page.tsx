import Link from "next/link";
import { Arabic } from "@/components/arabic";
import { SpeedRing } from "@/components/speed-ring";
import { Eyebrow, PageTitle, Rule, Screen } from "@/components/ui";
import { fillDays, getStats } from "@/lib/stats";
import { SuspendButton } from "./suspend-button";

export const dynamic = "force-dynamic";

/* Four centered blocks, stacked. No table anywhere. */
export default async function StatsPage() {
  const stats = await getStats();
  const days = fillDays(stats.perDay);

  return (
    <Screen className="gap-12 py-10">
      <div className="flex flex-col gap-2">
        <Eyebrow>Where you are</Eyebrow>
        <PageTitle>Stats</PageTitle>
      </div>

      <section className="flex flex-col items-center gap-4">
        <Eyebrow>Recognition time</Eyebrow>
        <SpeedRing
          progress={ringFraction(stats.medianMs)}
          secondary={
            stats.bestMs === null ? undefined : ringFraction(stats.bestMs)
          }
        >
          <span className="tabular text-ink text-[32px] leading-none">
            {stats.medianMs === null
              ? "0.0s"
              : `${(stats.medianMs / 1000).toFixed(1)}s`}
          </span>
          <span className="eyebrow">median</span>
        </SpeedRing>
        <p className="text-ink-soft text-[15px]">
          {stats.bestMs === null
            ? "No 30 day best yet."
            : `30 day best ${(stats.bestMs / 1000).toFixed(1)}s`}
        </p>
      </section>

      <Rule />

      <section className="flex flex-col items-center gap-4">
        <Eyebrow>Reviews, 30 days</Eyebrow>
        <Sparkline values={days} />
      </section>

      <Rule />

      <section className="flex flex-col items-center gap-4">
        <Eyebrow>Maturity</Eyebrow>
        <MaturityBar {...stats.maturity} />
      </section>

      <Rule />

      <section className="flex flex-col items-center gap-4">
        <Eyebrow>Leeches</Eyebrow>
        {stats.leeches.length === 0 ? (
          <p className="text-ink-soft text-[16px]">
            Nothing has lapsed yet.
          </p>
        ) : (
          <ul className="flex w-full flex-col">
            {stats.leeches.map((leech) => (
              <li
                key={leech.cardId}
                className="border-rule flex items-center gap-3 border-b py-4"
              >
                <span className="tabular text-clay text-[15px]">
                  {leech.lapses}
                </span>
                <span className="text-ink-soft flex-1 text-left text-[15px]">
                  {leech.english}
                </span>
                <Arabic className="text-ink text-[22px] leading-[1.8]">
                  {leech.arabic}
                </Arabic>
                <SuspendButton
                  cardId={leech.cardId}
                  suspended={leech.suspended}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/" className="text-lapis text-[16px] underline-offset-4">
        Back to today
      </Link>
    </Screen>
  );
}

/*
  Maps a time to a fraction of the ring. Four seconds is a full circle,
  and faster is a shorter arc, so a shrinking ring reads as progress.
*/
function ringFraction(ms: number | null): number {
  if (ms === null) return 0;
  return Math.max(0, Math.min(1, ms / 4000));
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const w = 320;
  const h = 60;
  const step = values.length > 1 ? w / (values.length - 1) : w;

  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / max) * h}`)
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <path
        d={d}
        fill="none"
        stroke="var(--lapis)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MaturityBar({
  unseen,
  learning,
  mature,
}: {
  unseen: number;
  learning: number;
  mature: number;
}) {
  const total = Math.max(1, unseen + learning + mature);
  const segments = [
    { label: "unseen", value: unseen, color: "var(--rule)" },
    { label: "learning", value: learning, color: "var(--saffron)" },
    { label: "mature", value: mature, color: "var(--verdigris)" },
  ];

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="bg-surface-sunk flex h-3 w-full overflow-hidden rounded-[999px]">
        {segments.map((s) => (
          <span
            key={s.label}
            style={{
              width: `${(s.value / total) * 100}%`,
              backgroundColor: s.color,
            }}
          />
        ))}
      </div>
      <div className="flex justify-center gap-6">
        {segments.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1">
            <span className="tabular text-ink text-[16px]">{s.value}</span>
            <span className="text-ink-soft text-[12px]">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
