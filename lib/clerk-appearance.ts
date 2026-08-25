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
  /*
    Stacked, full-width social buttons - the shape the iOS app uses.

    Clerk's default is a row of small pills with just the provider's name on
    them, which reads as a footnote under the email field. blockButton gives
    "Continue with Apple" and "Continue with Google" as full-width rows, which
    is both the app's design and the one Apple's guidelines are written about:
    Sign in with Apple has to appear at least as prominently as any other
    option, and a row of equal pills is a weaker claim than a stack.

    Order comes from the Clerk dashboard's provider list, so Apple has to be
    first THERE for it to be first here.
  */
  layout: {
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
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
    /* The same bordered surface the app draws these on. */
    socialButtonsBlockButton: {
      border: "1px solid var(--rule)",
      backgroundColor: "var(--surface)",
      minHeight: "52px",
    },
  },
};
