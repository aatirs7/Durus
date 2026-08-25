/*
  Clerk's components, wearing the app's clothes.

  The variables are read from the SAME CSS custom properties the rest of the
  site uses, so the panel follows the theme switch without knowing the theme
  exists - which is the only way this stays right, because next-themes flips a
  class on <html> and never tells React.

  Only the values that would otherwise be visibly foreign are set. Clerk's
  defaults for spacing and behaviour are fine and overriding them wholesale is
  how a themed auth panel ends up subtly broken on a step nobody tested.
*/
/* Untyped on purpose: @clerk/types is not a direct dependency and the shape is
   checked structurally where it is passed to the component anyway. */
export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--lapis)",
    colorBackground: "var(--surface)",
    colorText: "var(--ink)",
    colorTextSecondary: "var(--ink-soft)",
    colorInputBackground: "var(--surface-sunk)",
    colorInputText: "var(--ink)",
    colorDanger: "var(--clay)",
    colorSuccess: "var(--verdigris)",
    borderRadius: "12px",
    fontFamily: "var(--font-satoshi), system-ui, sans-serif",
  },
  elements: {
    /* Clerk's own card border and shadow read as a dialog floating over a page.
       This one IS the page, so it sits flat on the paper like every other
       surface in the app. */
    cardBox: { boxShadow: "none" },
    card: {
      boxShadow: "none",
      border: "1px solid var(--rule)",
      backgroundColor: "var(--surface)",
    },
    /* "Secured by Clerk" is a badge about the plumbing. */
    footer: { display: "none" },
  },
};
