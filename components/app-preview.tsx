import { Arabic } from "@/components/arabic";
import { TOTAL_LESSONS } from "@/lib/constants";

/*
  Durus for iPhone, shown rather than described.

  The screens are DRAWN in the site's own tokens rather than screenshotted.
  Three reasons, in order of how much they cost when ignored: a screenshot is
  wrong in the other theme, it is wrong the first time the app's layout moves,
  and it is a raster image on a page that is otherwise text and borders.

  These are the same two screens the App Store listing leads with, so a visitor
  who taps through recognises what they land on. Kept deliberately simple - the
  point is the shape of the thing, not a pixel copy.
*/

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-rule bg-paper relative w-[220px] shrink-0 overflow-hidden rounded-[34px] border-[6px] shadow-sm sm:w-[240px]">
      {/* The pill, because without it a rounded rectangle is just a card. */}
      <div className="bg-ink/85 absolute top-2.5 left-1/2 z-10 h-[18px] w-[64px] -translate-x-1/2 rounded-[999px]" />
      <div className="flex h-[440px] flex-col gap-3 px-4 pt-10 pb-5 sm:h-[470px]">
        {children}
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-ink-faint text-center text-[8px] tracking-[0.09em] uppercase">
      {children}
    </p>
  );
}

/* Today: the due count, the one button, and the ways in underneath it. */
function TodayScreen() {
  return (
    <>
      <Eyebrow>12 Rabi&apos; I 1448 AH</Eyebrow>

      <div className="flex flex-col items-center gap-1 pt-6">
        <Arabic className="text-ink text-[19px] leading-[1.7]">الدَّرْسُ الرَّابِعُ</Arabic>
        <Eyebrow>Lesson 4</Eyebrow>
      </div>

      <div className="flex flex-col items-center gap-0.5 pt-5">
        <span className="tabular text-ink text-[40px] leading-none">18</span>
        <Eyebrow>due</Eyebrow>
        <span className="text-ink-soft text-[10px]">6 new to learn</span>
      </div>

      <div className="bg-lapis text-paper mt-5 rounded-[10px] py-2.5 text-center text-[11px] font-medium">
        Start review
      </div>

      <div className="text-lapis grid grid-cols-2 gap-x-2 gap-y-1 pt-3 text-center text-[10px]">
        <span>Speed drill</span>
        <span>Flashcards</span>
        <span>Case drill</span>
        <span>Lesson 4</span>
      </div>

      {/* The tick strip: a progress bar that is honest about how far the book
          goes. Same marks the app draws. */}
      <div className="mt-auto flex justify-center gap-[3px]">
        {Array.from({ length: TOTAL_LESSONS }, (_, i) => (
          <span
            key={i}
            className="h-2 w-[1.5px] rounded-[999px]"
            style={{
              backgroundColor: i < 4 ? "var(--lapis)" : "var(--rule)",
            }}
          />
        ))}
      </div>
    </>
  );
}

/* Review, one beat after an answer: the right option marked, the
   transliteration and the gender chip revealed. */
function ReviewScreen() {
  return (
    <>
      <Eyebrow>Pick the meaning</Eyebrow>

      <div className="flex flex-col items-center gap-1.5 pt-7">
        <Arabic className="text-ink text-[34px] leading-[1.6]">مِفْتَاحٌ</Arabic>
        <span className="text-ink-faint text-[10px] italic">miftahun</span>
        <span className="border-rule text-ink-soft rounded-[999px] border px-2 py-[1px] text-[8px]">
          masculine
        </span>
      </div>

      <div className="flex flex-col gap-1.5 pt-5">
        {[
          { label: "door", right: false },
          { label: "key", right: true },
          { label: "star", right: false },
          { label: "pen", right: false },
        ].map((option) => (
          <div
            key={option.label}
            className="rounded-[9px] border py-2 text-center text-[10px]"
            style={{
              borderColor: option.right ? "var(--verdigris)" : "var(--rule)",
              backgroundColor: option.right ? "var(--lapis-wash)" : "var(--surface)",
              color: "var(--ink)",
            }}
          >
            {option.label}
          </div>
        ))}
      </div>

      <div className="mt-auto flex flex-col items-center gap-1.5">
        <span
          className="rounded-[999px] border px-3 py-[3px] text-[10px]"
          style={{ borderColor: "var(--verdigris)", color: "var(--verdigris)" }}
        >
          Right
        </span>
        <span className="text-ink-faint text-[8px]">Tap anywhere to continue</span>
      </div>
    </>
  );
}

/*
  The two screens, side by side.

  The review screen is the one worth seeing and the first to go when there
  is no room for both, so it is the one that hides on a narrow phone.
*/
export function AppPhones() {
  return (
    <div className="flex shrink-0 justify-center gap-4 sm:gap-6">
      <Phone>
        <TodayScreen />
      </Phone>
      <div className="hidden sm:block">
        <Phone>
          <ReviewScreen />
        </Phone>
      </div>
    </div>
  );
}
