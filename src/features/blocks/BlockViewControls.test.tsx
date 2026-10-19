import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Block } from "../../models/block";
import BlockViewControls from "./BlockViewControls";
import { defaultBlockView } from "./blockView";

const blocks = [
  {
    id: "one",
    pageId: "page",
    url: "https://example.com",
    title: "One",
    description: "",
    siteName: "Example",
    fetchStatus: "ok",
    tags: ["read"],
    order: 0,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "two",
    pageId: "page",
    url: "https://other.example",
    title: "Two",
    description: "",
    fetchStatus: "failed",
    tags: [],
    order: 1,
    createdAt: "2026-01-02T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  },
] satisfies Block[];

afterEach(cleanup);

describe("BlockViewControls", () => {
  it("shows an accurate result count and resets active filters", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <BlockViewControls
        blocks={blocks}
        value={{ ...defaultBlockView, search: "one", sort: "newest" }}
        onChange={onChange}
        resultCount={1}
        reorderDisabled
      />,
    );

    expect(screen.getByText("1 of 2 links")).toBeVisible();
    expect(screen.getByText("Choose Custom and clear filters to reorder.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onChange).toHaveBeenCalledWith({ ...defaultBlockView, sort: "newest" });
  });

  it("offers every sort and preview option", async () => {
    const user = userEvent.setup();
    render(
      <BlockViewControls
        blocks={blocks}
        value={defaultBlockView}
        onChange={() => {}}
        resultCount={2}
      />,
    );

    await user.click(screen.getByLabelText("Sort"));
    for (const option of ["Custom", "Newest", "Oldest", "Title A-Z", "Website"]) {
      expect(screen.getByRole("option", { name: option })).toBeVisible();
    }
    await user.keyboard("{Escape}");
    await user.click(screen.getByLabelText("Preview"));
    expect(screen.getByRole("option", { name: "Preview failed" })).toBeVisible();
  });
});
