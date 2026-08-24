/*
  Keyboard handling shared by every screen that binds at the document
  level. Desktop is a keyboard app, so the bindings live on the window
  rather than on a focused element, and that only works if they refuse
  to fire while something is being typed into.
*/

export function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

/*
  Set on the body while the help panel is open. Every document level
  handler bails while it is there, so a space bar meant to close the
  panel cannot also reveal the card underneath it.
*/
export const OVERLAY_ATTR = "data-overlay";

export function overlayOpen(): boolean {
  return typeof document !== "undefined" && document.body.hasAttribute(OVERLAY_ATTR);
}

/* A modified key belongs to the browser, never to us. */
export function isPlainKey(e: KeyboardEvent): boolean {
  return !e.metaKey && !e.ctrlKey && !e.altKey;
}

/*
  Set once the first review session ends. The Today screen shows the
  "press R" hint until then and never again, because a hint that stays
  forever is chrome.
*/
export const REVIEWED_KEY = "durus.reviewed";

export function markReviewed() {
  try {
    localStorage.setItem(REVIEWED_KEY, "1");
  } catch {
    // Private mode, or storage is full. The hint simply shows again.
  }
}

export function hasReviewed(): boolean {
  try {
    return localStorage.getItem(REVIEWED_KEY) === "1";
  } catch {
    return true;
  }
}
