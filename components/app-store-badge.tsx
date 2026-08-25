/*
  Apple's "Download on the App Store" badge, drawn as SVG.

  Drawn rather than shipped as a PNG for the same reason the phone mocks are:
  it has to sit crisply at any size and on both grounds, and Apple's own asset
  is a raster on a page that is otherwise text and borders.

  The proportions are Apple's: a 120x40 pill, the mark on the left, "Download
  on the" over "App Store" set in the system face. Apple's guidelines fix the
  wording, the layout and the minimum size, so none of that is ours to adjust -
  only whether it is shown live or, as now, as a disabled placeholder.

  There is no listing yet, so it renders unlinked and dimmed with a line under
  it saying so. A badge that looks tappable and is not is worse than one that
  admits where it is.
*/

const APPLE_MARK =
  "M16.36 12.78c.02-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3-.79-1.54.02-2.96.9-3.75 2.28-1.6 2.77-.41 6.87 1.15 9.12.76 1.1 1.67 2.34 2.86 2.29 1.15-.05 1.58-.74 2.97-.74 1.39 0 1.78.74 3 .72 1.24-.02 2.02-1.12 2.78-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.65zM14.1 5.98c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.67 1.37-.58.68-1.09 1.77-.95 2.81 1.02.08 2.05-.52 2.68-1.28z";

/* Apple sets the badge in the system UI face. Falling back to the site's own
   font here would make it read as an imitation rather than the badge. */
const SYSTEM =
  "-apple-system, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif";

function Badge({ width = 150 }: { width?: number }) {
  return (
    <svg
      width={width}
      height={(width * 40) / 120}
      viewBox="0 0 120 40"
      role="img"
      aria-label="Download on the App Store"
    >
      <rect
        x="0.5"
        y="0.5"
        width="119"
        height="39"
        rx="6.5"
        fill="#000000"
        stroke="#A6A6A6"
      />
      <g transform="translate(9.5 8.5) scale(0.96)" fill="#FFFFFF">
        <path d={APPLE_MARK} />
      </g>
      <text x="38" y="17" fill="#FFFFFF" fontSize="7.4" fontFamily={SYSTEM}>
        Download on the
      </text>
      <text
        x="37.5"
        y="31"
        fill="#FFFFFF"
        fontSize="15"
        fontFamily={SYSTEM}
        fontWeight="500"
      >
        App Store
      </text>
    </svg>
  );
}

/* The link goes live when the listing does. One constant, so there is exactly
   one thing to change. */
const APP_STORE_URL: string | null = null;

export function AppStoreBadge() {
  if (APP_STORE_URL) {
    return (
      <a href={APP_STORE_URL} aria-label="Download Durus on the App Store">
        <Badge />
      </a>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Dimmed and not a link, because it does not go anywhere yet. */}
      <span className="opacity-45" aria-hidden>
        <Badge />
      </span>
      <span className="text-ink-soft text-[14px]">Coming to the App Store</span>
    </div>
  );
}
