import { describe, expect, it } from "vitest";
import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  clampSidebarWidth,
  readSidebarWidth,
} from "./sidebarWidth";

describe("sidebar width persistence", () => {
  it("clamps drag and keyboard results to the supported range", () => {
    expect(clampSidebarWidth(100)).toBe(SIDEBAR_MIN_WIDTH);
    expect(clampSidebarWidth(320)).toBe(320);
    expect(clampSidebarWidth(900)).toBe(SIDEBAR_MAX_WIDTH);
  });

  it("loads valid persisted widths and safely defaults invalid values", () => {
    expect(readSidebarWidth({ getItem: () => "360" })).toBe(360);
    expect(readSidebarWidth({ getItem: () => "999" })).toBe(SIDEBAR_MAX_WIDTH);
    expect(readSidebarWidth({ getItem: () => "not-a-number" })).toBe(SIDEBAR_DEFAULT_WIDTH);
    expect(readSidebarWidth(undefined)).toBe(SIDEBAR_DEFAULT_WIDTH);
  });
});
