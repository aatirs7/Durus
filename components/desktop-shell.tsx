"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Arabic } from "@/components/arabic";

/*
  The desktop shell. Below 1024px this renders nothing at all and the
  children are the whole app, exactly as they were. At and above 1024px
  a 220px rail is pinned to the left and the main column is pushed off
  it, so the content centres in the space that is left rather than in
  the viewport. Centring across the rail reads as off balance.

  One breakpoint, Tailwind's lg, which is already 1024px. No tablet tier.
*/

const NAV = [
  { href: "/today", label: "Today", icon: TodayIcon },
  { href: "/review", label: "Review", icon: ReviewIcon },
  { href: "/speed", label: "Speed", icon: SpeedIcon },
  { href: "/cases", label: "Cases", icon: CasesIcon },
  { href: "/lessons", label: "Lessons", icon: LessonsIcon },
  { href: "/stats", label: "Stats", icon: StatsIcon },
] as const;

export function DesktopShell({
  children,
  due,
}: {
  children: ReactNode;
  /* Rendered on the server, so the rail can show a live count. */
  due: ReactNode;
}) {
  const pathname = usePathname();

  /*
    The rail is the app's own furniture. The public landing page and the
    lock screen are outside it, so they get the plain document.
  */
  if (pathname === "/" || pathname.startsWith("/unlock")) {
    return <>{children}</>;
  }

  return (
    <>
      <nav
        aria-label="Sections"
        className="border-rule bg-surface fixed top-0 left-0 z-10 hidden w-[220px] flex-col border-r px-4 py-6 text-left lg:flex"
        style={{ height: "100dvh" }}
      >
        {/*
          The wordmark is unvowelled here and on the landing page. The
          harakat belong on the icon, where the art is drawn tight
          around them. Set as running text they sit high above the
          letters and read as floating, which is fine on a card face
          you are meant to study and wrong on a mark you are meant to
          recognise at a glance.
        */}
        <Link href="/today" className="text-lapis px-3 pb-6">
          <Arabic showHarakat={false} className="text-[28px] leading-none">
            دُرُوس
          </Arabic>
        </Link>

        <ul className="flex flex-col gap-1">
          {NAV.map((entry) => {
            const active = pathname.startsWith(entry.href);
            const Icon = entry.icon;
            return (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-[12px] px-3 py-2 text-[15px] transition-colors ${
                    active
                      ? "text-ink bg-lapis-wash"
                      : "text-ink-soft hover:bg-surface-sunk"
                  }`}
                >
                  <Icon />
                  {entry.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="px-3 pt-4">{due}</div>

        <div className="mt-auto">
          <Link
            href="/settings"
            aria-current={pathname.startsWith("/settings") ? "page" : undefined}
            className={`flex items-center gap-3 rounded-[12px] px-3 py-2 text-[15px] transition-colors ${
              pathname.startsWith("/settings")
                ? "text-ink bg-lapis-wash"
                : "text-ink-soft hover:bg-surface-sunk"
            }`}
          >
            <SettingsIcon />
            Settings
          </Link>
        </div>
      </nav>

      {/*
        Below lg this div adds nothing but the flex column the body
        already had, so the mobile box model is unchanged. At lg it
        holds the main column clear of the rail.
      */}
      <div className="flex flex-1 flex-col lg:pl-[220px]">{children}</div>
    </>
  );
}

/*
  Line icons at 18px on the same 24 grid, stroked in the current text
  colour so they inherit the active and inactive states.
*/
function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function TodayIcon() {
  return (
    <Glyph>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    </Glyph>
  );
}

function ReviewIcon() {
  return (
    <Glyph>
      <rect x="3" y="6.5" width="14" height="11" rx="2" />
      <path d="M7 4.5h12a2 2 0 0 1 2 2v9" />
    </Glyph>
  );
}

function SpeedIcon() {
  return (
    <Glyph>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Glyph>
  );
}

function CasesIcon() {
  return (
    <Glyph>
      <path d="M5 18.5 12 5l7 13.5M8 14h8" />
    </Glyph>
  );
}

function LessonsIcon() {
  return (
    <Glyph>
      <path d="M12 6.5C10.5 5 8 4.5 4.5 4.5v13C8 17.5 10.5 18 12 19.5 13.5 18 16 17.5 19.5 17.5v-13C16 4.5 13.5 5 12 6.5zM12 6.5v13" />
    </Glyph>
  );
}

function StatsIcon() {
  return (
    <Glyph>
      <path d="M4.5 19.5h15M8 19.5v-6M12 19.5V7M16 19.5v-9" />
    </Glyph>
  );
}

function SettingsIcon() {
  return (
    <Glyph>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M18 6l-1.4 1.4M7.4 16.6 6 18M18 18l-1.4-1.4M7.4 7.4 6 6" />
    </Glyph>
  );
}
