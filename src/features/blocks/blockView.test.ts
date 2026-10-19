import { describe, expect, it } from "vitest";
import type { Block } from "../../models/block";
import {
  canReorderBlockView,
  defaultBlockView,
  filterAndSortBlocks,
  getBlockSource,
  type BlockViewState,
} from "./blockView";

const block = ({ id, ...updates }: Partial<Block> & Pick<Block, "id">): Block => ({
  id,
  pageId: "page-1",
  url: `https://${id}.example/path`,
  title: id,
  description: "",
  fetchStatus: "ok",
  tags: [],
  order: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...updates,
});

const view = (updates: Partial<BlockViewState>): BlockViewState => ({
  ...defaultBlockView,
  ...updates,
});

describe("block view helpers", () => {
  const blocks = [
    block({
      id: "gamma",
      title: "Gamma",
      order: 30,
      createdAt: "invalid",
      siteName: "Zed",
      tags: ["work"],
      fetchStatus: "failed",
    }),
    block({
      id: "alpha",
      title: "Alpha",
      order: 20,
      createdAt: "2026-02-01T00:00:00Z",
      url: "https://www.example.com/a",
      tags: ["work", "read"],
    }),
    block({
      id: "beta",
      title: "beta",
      order: 10,
      createdAt: "2025-12-01T00:00:00Z",
      url: "not a url",
      tags: ["read"],
    }),
  ];

  it("derives the displayed source from site name, hostname, or an invalid URL fallback", () => {
    expect(getBlockSource(blocks[0])).toBe("Zed");
    expect(getBlockSource(blocks[1])).toBe("example.com");
    expect(getBlockSource(blocks[2])).toBe("not a url");
  });

  it.each([
    ["custom", ["beta", "alpha", "gamma"]],
    ["newest", ["alpha", "beta", "gamma"]],
    ["oldest", ["beta", "alpha", "gamma"]],
    ["title", ["alpha", "beta", "gamma"]],
    ["website", ["alpha", "beta", "gamma"]],
  ] as const)("sorts by %s deterministically", (sort, expected) => {
    expect(filterAndSortBlocks(blocks, view({ sort })).map(({ id }) => id)).toEqual(expected);
  });

  it("uses custom order and places a newly inserted lower order first", () => {
    const newestCustom = block({ id: "new", order: 5 });
    expect(filterAndSortBlocks([...blocks, newestCustom], defaultBlockView)[0].id).toBe("new");
  });

  it("breaks equal sort values by custom order then id", () => {
    const tied = [
      block({ id: "c", title: "Same", order: 2 }),
      block({ id: "b", title: "same", order: 1 }),
      block({ id: "a", title: "SAME", order: 1 }),
    ];
    expect(filterAndSortBlocks(tied, view({ sort: "title" })).map(({ id }) => id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("combines search, tag, source, and preview filters", () => {
    expect(
      filterAndSortBlocks(
        blocks,
        view({ search: "gamma", tag: "work", source: "Zed", preview: "failed" }),
      ).map(({ id }) => id),
    ).toEqual(["gamma"]);
    expect(filterAndSortBlocks(blocks, view({ preview: "ready" })).map(({ id }) => id)).toEqual([
      "beta",
      "alpha",
    ]);
  });

  it("only enables reorder for editable, unfiltered custom views", () => {
    expect(canReorderBlockView(true, defaultBlockView)).toBe(true);
    expect(canReorderBlockView(false, defaultBlockView)).toBe(false);
    expect(canReorderBlockView(true, view({ sort: "newest" }))).toBe(false);
    expect(canReorderBlockView(true, view({ search: "alpha" }))).toBe(false);
    expect(canReorderBlockView(true, view({ tag: "work" }))).toBe(false);
    expect(canReorderBlockView(true, view({ source: "Zed" }))).toBe(false);
    expect(canReorderBlockView(true, view({ preview: "ready" }))).toBe(false);
  });
});
