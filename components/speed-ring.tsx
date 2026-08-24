/*
  The signature element. A thin circular arc drawn in lapis on a sunk
  track. During the drill it is the timer. On stats it shows the current
  median recognition time against the 30 day best, as two arcs on the
  same circle.

  It is the one piece of visual expression in the app, so everything
  around it stays quiet.
*/

const SIZE = 220;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function SpeedRing({
  progress,
  secondary,
  children,
  animateMs,
}: {
  /* 0 to 1. */
  progress: number;
  /* Optional second arc, drawn inside the first. */
  secondary?: number;
  children?: React.ReactNode;
  /* When set, the arc drains over this many milliseconds via CSS. */
  animateMs?: number;
}) {
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const main = clamp(progress);

  return (
    <div
      className="relative mx-auto"
      style={{ width: SIZE, height: SIZE }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        /* Start the arc at twelve o'clock. */
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--surface-sunk)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--lapis)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - main)}
          style={
            animateMs
              ? {
                  transition: `stroke-dashoffset ${animateMs}ms linear`,
                }
              : undefined
          }
        />
        {secondary === undefined ? null : (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS - STROKE * 2}
            fill="none"
            stroke="var(--verdigris)"
            strokeWidth={STROKE / 2}
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * (RADIUS - STROKE * 2)}
            strokeDashoffset={
              2 * Math.PI * (RADIUS - STROKE * 2) * (1 - clamp(secondary))
            }
          />
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        {children}
      </div>
    </div>
  );
}
