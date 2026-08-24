import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/*
  Cards, buttons, and drill UI are hand written. shadcn/ui is reserved
  for primitives that are genuinely fiddly.

  Max content width 560px, centered, generous vertical rhythm. Phone
  first, and it happens to work on desktop.
*/
export function Screen({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`mx-auto flex w-full max-w-[560px] flex-1 flex-col px-6 ${className}`}
      style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
    >
      {children}
    </main>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-ink text-[24px] font-medium tracking-tight">
      {children}
    </h1>
  );
}

/* Numeral display role. 40px, tabular, never jitters. */
export function Numeral({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`tabular text-ink text-[40px] leading-none ${className}`}>
      {children}
    </span>
  );
}

const BUTTON_BASE =
  "inline-flex items-center justify-center rounded-[12px] px-5 py-3.5 text-[16px] font-medium transition-colors disabled:cursor-not-allowed";

const VARIANTS = {
  primary: "bg-lapis text-paper hover:opacity-90 disabled:opacity-40",
  quiet:
    "border border-rule bg-surface text-ink hover:bg-surface-sunk disabled:opacity-40",
  text: "text-lapis hover:underline underline-offset-4 disabled:text-ink-faint disabled:no-underline",
} as const;

type Variant = keyof typeof VARIANTS;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`${BUTTON_BASE} ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return (
    <Link
      {...props}
      className={`${BUTTON_BASE} ${VARIANTS[variant]} ${className}`}
    />
  );
}

/* A disabled looking button for routes that do not exist yet. */
export function DeadLink({ children }: { children: ReactNode }) {
  return (
    <span className={`${BUTTON_BASE} text-ink-faint cursor-not-allowed`}>
      {children}
    </span>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="border-rule text-ink-soft inline-flex items-center rounded-[999px] border px-3 py-1 text-[13px]">
      {children}
    </span>
  );
}

export function Rule({ className = "" }: { className?: string }) {
  return <hr className={`border-rule border-t ${className}`} />;
}
