/*
  Constants and types for the speed drill. Separate from the server
  actions file because a "use server" module may only export async
  functions, and a stray constant there silently strips every export.
*/

export type SpeedWord = {
  cardId: number;
  arabic: string;
  english: string;
  transliteration: string | null;
};

export const SPEED_RUN_LENGTH = 20;
export const SPEED_FLOOR_MS = 700;
export const SPEED_STEP_MS = 100;
export const SPEED_RAMP_THRESHOLD = 0.85;

/* Same reasoning, for the case drill. */
export const CASE_RUN_LENGTH = 15;
