import Link from "next/link";
import { Arabic } from "@/components/arabic";
import { SpeedRing } from "@/components/speed-ring";
import { Eyebrow, PageTitle, Rule, Screen } from "@/components/ui";
import { requireProfileId } from "@/lib/session";
import { fillDays, getStats } from "@/lib/stats";
import { SuspendButton } from "./suspend-button";

export const dynamic = "force-dynamic";

/*
  Four centered blocks, stacked. No table anywhere.

  On desktop the ring and the maturity bar sit side by side, since both
  are compact and both read fine at half the column. The sparkline and
  the leech list stay full width, because the spec asks for a 680px
  sparkline and a single centered leech column, and neither of those
  survives being squeezed into a quadrant.
*/
export default async function StatsPage() {
  const stats = await getStats(await requireProfileId());
  const days = fillDays(stats.perDay);

  return (
    <Screen className="gap-12 py-10">
      <div className="flex flex-col gap-2">
        <Eyebrow>Where you are</Eyebrow>
        <PageTitle>Stats</PageTitle>
      </div>

      <div className="flex flex-col gap-12 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-10">
        <section className="flex flex-col items-center gap-4">
          <Eyebrow>Recognition time</Eyebrow>
          <RingBlock median={stats.medianMs} best={stats.bestMs} />
          <p className="text-ink-soft text-[15px]">
            {stats.bestMs === null
              ? "No 30 day best yet."
              : `30 day best ${(stats.bestMs / 1000).toFixed(1)}s`}
          </p>
        </section>

        <Rule className="lg:hidden" />

        <section className="flex flex-col items-center gap-4 lg:self-center">
          <Eyebrow>Maturity</Eyebrow>
          <MaturityBar {...stats.maturity} />
        </section>
      </div>

      <Rule />

      <section className="flex flex-col items-center gap-4">
        <Eyebrow>Reviews, 30 days</Eyebrow>
        {/*
          Two fixed geometries rather than one stretched one. A single
          svg scaled to the column would drag the stroke width with it.
        */}
        <div className="lg:hidden">
          <Sparkline values={days} width={320} height={60} />
        </div>
        <div className="hidden lg:block">
          <Sparkline values={days} width={632} height={96} baseline />
        </div>
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

      <Link href="/today" className="text-lapis text-[16px] underline-offset-4">
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

function Sparkline({
  values,
  width,
  height,
  baseline = false,
}: {
  values: number[];
  width: number;
  height: number;
  /*
    Desktop only. At 632px across the line has enough room that a
    hairline to measure it against is worth having. Still no axes, no
    gridlines, no legend.
  */
  baseline?: boolean;
}) {
  const max = Math.max(1, ...values);
  const w = width;
  const h = height;
  const step = values.length > 1 ? w / (values.length - 1) : w;

  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / max) * h}`)
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      {baseline ? (
        <line
          x1={0}
          y1={h - 0.5}
          x2={w}
          y2={h - 0.5}
          stroke="var(--rule)"
          strokeWidth={1}
        />
      ) : null}
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

/*
  The ring is 220 on a phone and 280 on desktop. Its diameter is a
  number, not a class, so the two sizes are two elements.
*/
function RingBlock({
  median,
  best,
}: {
  median: number | null;
  best: number | null;
}) {
  const inner = (
    <>
      <span className="tabular text-ink text-[32px] leading-none">
        {median === null ? "0.0s" : `${(median / 1000).toFixed(1)}s`}
      </span>
      <span className="eyebrow">median</span>
    </>
  );
  const secondary = best === null ? undefined : ringFraction(best);

  return (
    <>
      <div className="lg:hidden">
        <SpeedRing progress={ringFraction(median)} secondary={secondary}>
          {inner}
        </SpeedRing>
      </div>
      <div className="hidden lg:block">
        <SpeedRing
          progress={ringFraction(median)}
          secondary={secondary}
          size={280}
        >
          {inner}
        </SpeedRing>
      </div>
    </>
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
