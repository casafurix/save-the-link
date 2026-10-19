import type { Block } from "../../models/block";
import { sortByOrder } from "../../lib/reorder";

export type BlockSort = "custom" | "newest" | "oldest" | "title" | "website";
export type PreviewFilter = "all" | "ready" | "failed";

export interface BlockViewState {
  search: string;
  tag: string | null;
  source: string;
  preview: PreviewFilter;
  sort: BlockSort;
}

export const defaultBlockView: BlockViewState = {
  search: "",
  tag: null,
  source: "",
  preview: "all",
  sort: "custom",
};

export const getBlockSource = (block: Pick<Block, "siteName" | "url">): string => {
  if (block.siteName) return block.siteName;

  try {
    return new URL(block.url).hostname.replace(/^www\./, "");
  } catch {
    return block.url;
  }
};

export const getBlockTags = (blocks: Block[]): string[] =>
  Array.from(new Set(blocks.flatMap((block) => block.tags))).sort((left, right) =>
    left.localeCompare(right),
  );

export const getBlockSources = (blocks: Block[]): string[] =>
  Array.from(new Set(blocks.map(getBlockSource))).sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: "base" }),
  );

export const hasBlockFilters = (view: BlockViewState): boolean =>
  Boolean(view.search.trim() || view.tag || view.source || view.preview !== "all");

export const canReorderBlockView = (editable: boolean, view: BlockViewState): boolean =>
  editable && view.sort === "custom" && !hasBlockFilters(view);

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, " ");

const compareText = (left: string, right: string) =>
  left.localeCompare(right, undefined, { sensitivity: "base", numeric: true });

const validTimestamp = (value: string): number | null => {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const filterAndSortBlocks = (blocks: Block[], view: BlockViewState): Block[] => {
  const query = view.search.trim().toLowerCase();
  const filtered = blocks.filter((block) => {
    if (view.tag && !block.tags.includes(view.tag)) return false;
    if (view.source && getBlockSource(block) !== view.source) return false;
    if (view.preview === "ready" && block.fetchStatus !== "ok") return false;
    if (view.preview === "failed" && block.fetchStatus !== "failed") return false;
    if (!query) return true;

    return [
      block.title,
      stripHtml(block.description),
      block.url,
      getBlockSource(block),
      ...block.tags,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  if (view.sort === "custom") return sortByOrder(filtered);

  return [...filtered].sort((left, right) => {
    let comparison = 0;

    if (view.sort === "title") comparison = compareText(left.title, right.title);
    if (view.sort === "website") {
      comparison = compareText(getBlockSource(left), getBlockSource(right));
    }
    if (view.sort === "newest" || view.sort === "oldest") {
      const leftDate = validTimestamp(left.createdAt);
      const rightDate = validTimestamp(right.createdAt);
      if (leftDate === null || rightDate === null) {
        comparison = leftDate === null ? (rightDate === null ? 0 : 1) : -1;
      } else {
        comparison = view.sort === "newest" ? rightDate - leftDate : leftDate - rightDate;
      }
    }

    return comparison || left.order - right.order || left.id.localeCompare(right.id);
  });
};
