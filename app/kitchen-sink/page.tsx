import { Arabic } from "@/components/arabic";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Button,
  Eyebrow,
  Numeral,
  PageTitle,
  Pill,
  Rule,
  Screen,
} from "@/components/ui";

/*
  Every token and every type role, in one place, so a regression in the
  palette is visible rather than discovered three screens later.
*/

const TOKENS = [
  "paper",
  "surface",
  "surface-sunk",
  "ink",
  "ink-soft",
  "ink-faint",
  "rule",
  "lapis",
  "lapis-wash",
  "verdigris",
  "clay",
  "saffron",
];

export default function KitchenSinkPage() {
  return (
    <Screen className="gap-10 py-10">
      <div className="flex flex-col gap-3">
        <Eyebrow>Kitchen sink</Eyebrow>
        <PageTitle>Tokens and type</PageTitle>
        <ThemeToggle />
      </div>

      <section className="flex flex-col gap-4">
        <Eyebrow>Color</Eyebrow>
        <div className="grid grid-cols-3 gap-3">
          {TOKENS.map((token) => (
            <div key={token} className="flex flex-col items-center gap-2">
              <div
                className="border-rule h-14 w-full rounded-[12px] border"
                style={{ backgroundColor: `var(--${token})` }}
              />
              <span className="text-ink-soft text-[12px]">{token}</span>
            </div>
          ))}
        </div>
      </section>

      <Rule />

      <section className="flex flex-col gap-6">
        <Eyebrow>Type</Eyebrow>

        <div className="flex flex-col gap-2">
          <Eyebrow>Arabic card face</Eyebrow>
          <Arabic
            as="p"
            className="text-ink text-[64px] leading-[1.8] md:text-[88px]"
          >
            مِفْتَاحٌ
          </Arabic>
        </div>

        <div className="flex flex-col gap-2">
          <Eyebrow>Arabic inline</Eyebrow>
          <Arabic as="p" className="text-ink text-[32px] leading-[2]">
            أَيْنَ الكِتَابُ؟ هُوَ عَلَى المَكْتَبِ
          </Arabic>
        </div>

        <div className="flex flex-col gap-2">
          <Eyebrow>Harakat stripped</Eyebrow>
          <Arabic
            as="p"
            showHarakat={false}
            className="text-ink text-[32px] leading-[2]"
          >
            أَيْنَ الكِتَابُ؟ هُوَ عَلَى المَكْتَبِ
          </Arabic>
        </div>

        <div className="flex flex-col gap-2">
          <Eyebrow>Page title</Eyebrow>
          <PageTitle>Start review</PageTitle>
        </div>

        <div className="flex flex-col gap-2">
          <Eyebrow>Card English meaning</Eyebrow>
          <p className="text-ink text-[22px]">where is the book? it is on the table</p>
        </div>

        <div className="flex flex-col gap-2">
          <Eyebrow>Body</Eyebrow>
          <p className="text-ink text-[16px]">
            Recognition speed is the bottleneck, not decoding.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Eyebrow>Numeral display</Eyebrow>
          <Numeral>0123456789</Numeral>
        </div>
      </section>

      <Rule />

      <section className="flex flex-col gap-4">
        <Eyebrow>Controls</Eyebrow>
        <Button>Start review</Button>
        <Button variant="quiet">Add 14 cards</Button>
        <Button variant="text">Speed drill</Button>
        <div className="flex justify-center gap-2">
          <Pill>masculine</Pill>
          <Pill>
            <Arabic>مَسَاجِدُ</Arabic>
          </Pill>
        </div>
      </section>

      <Rule />

      <section className="flex flex-col gap-4">
        <Eyebrow>Grade row</Eyebrow>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Again", interval: "10m", color: "var(--clay)" },
            { label: "Hard", interval: "1d", color: "var(--saffron)" },
            { label: "Good", interval: "4d", color: "var(--verdigris)" },
            { label: "Easy", interval: "6d", color: "var(--lapis)" },
          ].map((g) => (
            <div
              key={g.label}
              className="border-rule bg-surface flex flex-col items-center gap-1 rounded-[12px] border py-3"
            >
              <span className="tabular text-ink-soft text-[13px]">
                {g.interval}
              </span>
              <span className="text-[15px] font-medium" style={{ color: g.color }}>
                {g.label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </Screen>
  );
}
