import { describe, expect, it } from "vitest";
import { getMovedItemOrder, sortByOrder } from "./reorder";

describe("ordering helpers", () => {
  const items = [
    { id: "c", order: 2 },
    { id: "a", order: 0 },
    { id: "b", order: 1 },
  ];

  it("sorts deterministically by order then id", () => {
    expect(sortByOrder([...items, { id: "aa", order: 0 }]).map(({ id }) => id)).toEqual([
      "a",
      "aa",
      "b",
      "c",
    ]);
  });

  it("places a moved item before the first sibling", () => {
    expect(getMovedItemOrder(items, "c", "a")).toEqual({ id: "c", order: -1 });
  });

  it("places a moved item after the last sibling", () => {
    expect(getMovedItemOrder(items, "a", "c")).toEqual({ id: "a", order: 3 });
  });

  it("uses a representable gap for nanosecond-scale orders", () => {
    const largeItems = [
      { id: "a", order: 1_760_000_000_000_000_000 },
      { id: "b", order: 1_760_000_000_001_000_000 },
    ];

    expect(getMovedItemOrder(largeItems, "b", "a")?.order).toBeLessThan(
      largeItems[0].order,
    );
  });

  it("places a moved item at the midpoint between neighbors", () => {
    expect(getMovedItemOrder(items, "a", "b")).toEqual({ id: "a", order: 1.5 });
  });

  it("does nothing for missing or unchanged items", () => {
    expect(getMovedItemOrder(items, "a", "a")).toBeNull();
    expect(getMovedItemOrder(items, "missing", "a")).toBeNull();
  });
});
