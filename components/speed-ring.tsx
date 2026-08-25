"use client";

import { useEffect, useRef } from "react";

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

  const drain = useRef<SVGCircleElement | null>(null);

  /*
    Driven through the Web Animations API rather than a CSS keyframe.
    This is why the file is a client component: stats renders the same
    ring as a still, and passes its own server rendered children in,
    which is allowed.

    The keyframe version parsed, resolved, and reported itself as
    running, while getAnimations() on the circle stayed empty and the
    offset never moved: Chrome would not build an animation for
    stroke-dashoffset out of a var(). This says exactly what to
    interpolate, and can be checked from the console.
  */
  useEffect(() => {
    const circle = drain.current;
    if (!circle || !animateMs) return;

    const animation = circle.animate(
      [{ strokeDashoffset: 0 }, { strokeDashoffset: CIRCUMFERENCE }],
      { duration: animateMs, easing: "linear", fill: "forwards" },
    );

    return () => animation.cancel();
  }, [animateMs, CIRCUMFERENCE]);

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
          ref={drain}
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
