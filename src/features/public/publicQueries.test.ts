import { describe, expect, it, vi } from "vitest";
import * as publicApi from "../../api/publicPages";
import type { PublicPageSummary } from "../../models/publicPage";
import {
  PUBLIC_LIBRARY_PAGE_SIZE,
  PUBLIC_LIBRARY_MAX_OFFSET,
  flattenPublicLibraryPages,
  getPublicLibraryNextOffset,
  publicLibraryQueryOptions,
} from "./publicQueries";

vi.mock("../../api/publicPages", () => ({
  listPublicPagesPage: vi.fn(),
}));

const page = (id: string): PublicPageSummary => ({
  id,
  slug: id,
  title: id,
  creatorUsername: "curator",
  linkCount: 1,
});

describe("public library pagination", () => {
  it("flattens pages and removes duplicate page IDs", () => {
    expect(flattenPublicLibraryPages([[page("a"), page("b")], [page("b"), page("c")]])).toEqual([
      page("a"),
      page("b"),
      page("c"),
    ]);
  });

  it("only returns a next offset after a full page", () => {
    const fullPage = Array.from({ length: PUBLIC_LIBRARY_PAGE_SIZE }, (_, index) => page(String(index)));

    expect(getPublicLibraryNextOffset(fullPage, [fullPage], 0)).toBe(PUBLIC_LIBRARY_PAGE_SIZE);
    expect(getPublicLibraryNextOffset([page("last")], [fullPage, [page("last")]], 24)).toBeUndefined();
  });

  it("does not request beyond the backend lookahead boundary", () => {
    const fullPage = Array.from({ length: PUBLIC_LIBRARY_PAGE_SIZE }, (_, index) => page(String(index)));

    expect(getPublicLibraryNextOffset(fullPage, [fullPage], PUBLIC_LIBRARY_MAX_OFFSET)).toBeUndefined();
  });

  it("keys and requests results by the backend search query", async () => {
    vi.mocked(publicApi.listPublicPagesPage).mockResolvedValue({ data: [page("result")] } as never);
    const options = publicLibraryQueryOptions("maya");

    expect(options.queryKey).toEqual(["public-pages-explore", "maya"]);
    await options.queryFn({ pageParam: 48 });
    expect(publicApi.listPublicPagesPage).toHaveBeenCalledWith({
      limit: 24,
      offset: 48,
      q: "maya",
    });
  });
});
