import { describe, expect, it } from "vitest";
import { isWorkspaceExport, prepareWorkspaceImport } from "./workspace";

describe("workspace export schema", () => {
  it("accepts a versioned JSON object without imposing import semantics", () => {
    expect(isWorkspaceExport({ version: 1, pages: [] })).toBe(true);
    expect(isWorkspaceExport({ pages: [] })).toBe(false);
    expect(isWorkspaceExport({ version: "1" })).toBe(false);
    expect(isWorkspaceExport({ version: 2, pages: [] })).toBe(false);
    expect(isWorkspaceExport({ version: 1, pages: {} })).toBe(false);
  });

  it("sanitizes every block description while preserving the archive shape", () => {
    const prepared = prepareWorkspaceImport({
      version: 1,
      pages: [{
        sourceId: "page-1",
        title: "Page",
        blocks: [
          { url: "https://one.example", description: "<p>Safe</p><script>bad()</script>" },
          { url: "https://two.example", description: "<img src=x onerror=bad()>Notes" },
        ],
      }],
    });

    expect(prepared?.pages[0].blocks.map(({ description }) => description)).toEqual([
      "<p>Safe</p>",
      "Notes",
    ]);
  });
});
