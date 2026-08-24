"use client";

import { useEffect, useState } from "react";

const DISMISSED = "durus.install-hint.dismissed";

/*
  Shown only when the app is running in a browser tab rather than from
  the home screen. One line, dismissible, nothing more aggressive.
*/
export function InstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS reports standalone on navigator, not through the media query,
      // on some versions.
      (window.navigator as { standalone?: boolean }).standalone === true;

    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(DISMISSED) === "1";
    } catch {
      // Private mode can throw on access. Treat it as not dismissed.
    }

    setShow(!standalone && !dismissed);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      onClick={() => {
        try {
          window.localStorage.setItem(DISMISSED, "1");
        } catch {
          // Nothing to do. The hint just comes back next launch.
        }
        setShow(false);
      }}
      className="border-rule text-ink-soft mx-auto rounded-[999px] border px-4 py-2 text-[13px]"
    >
      Add to home screen for offline review
    </button>
  );
}
