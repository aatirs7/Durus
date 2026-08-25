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

export function SpeedRing({
  progress,
  secondary,
  children,
  animateMs,
  size = SIZE,
}: {
  /* 0 to 1. */
  progress: number;
  /* Optional second arc, drawn inside the first. */
  secondary?: number;
  children?: React.ReactNode;
  /*
    When set, the arc drains from full to empty over this many
    milliseconds. Driven by a keyframe rather than a transition on
    progress, so it restarts cleanly for each card. Give the ring a
    React key that changes per card to make it restart.
  */
  animateMs?: number;
  /*
    Diameter in pixels. 220 everywhere on a phone. Desktop passes a
    larger one, and the stroke deliberately does not scale with it, so
    the ring stays a hairline rather than becoming a band.
  */
  size?: number;
}) {
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const main = clamp(progress);
  const RADIUS = (size - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        /* Start the arc at twelve o'clock. */
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--surface-sunk)"
          strokeWidth={STROKE}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
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
                  /*
                    The keyframe reads the circumference from here, so
                    the animation does not need to know the radius.
                  */
                  ["--ring-circumference" as string]: `${CIRCUMFERENCE}`,
                  strokeDashoffset: 0,
                  animation: `durus-ring-drain ${animateMs}ms linear forwards`,
                }
              : undefined
          }
        />
        {secondary === undefined ? null : (
          <circle
            cx={size / 2}
            cy={size / 2}
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
