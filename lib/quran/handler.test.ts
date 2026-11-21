import { describe, expect, it } from "vitest";

import { overLimit } from "./handler";

describe("overLimit", () => {
  it("allows 20 asks a minute per address, then refuses until the next minute", () => {
    const t = Date.UTC(2026, 10, 21, 10, 0, 5);
    for (let i = 0; i < 20; i++) expect(overLimit("1.1.1.1", "ask", t)).toBe(false);
    expect(overLimit("1.1.1.1", "ask", t)).toBe(true);
    expect(overLimit("2.2.2.2", "ask", t)).toBe(false);
    expect(overLimit("1.1.1.1", "ask", t + 60_000)).toBe(false);
  });

  it("caps asks at 300 a day per address", () => {
    const start = Date.UTC(2026, 10, 21, 0, 0, 0);
    let refused = 0;
    for (let i = 0; i < 400; i++) if (overLimit("3.3.3.3", "ask", start + i * 4 * 60_000 / 20)) refused++;
    expect(refused).toBe(100);
  });
});
