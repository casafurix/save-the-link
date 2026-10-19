import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router";
import type { PublicPageSummary } from "../../models/publicPage";
import { ExplorePublicLibraryView } from "./ExplorePublicLibrary";

const pages: PublicPageSummary[] = [
  {
    id: "own",
    slug: "my-links",
    title: "My links",
    creatorUsername: "agnibha",
    linkCount: 3,
  },
  {
    id: "other",
    slug: "design-links",
    title: "Design links",
    creatorUsername: "maya",
    linkCount: 8,
  },
];

const CurrentLocation = () => <output aria-label="Current location">{useLocation().pathname}</output>;

const renderLibrary = (overrides = {}) => render(
  <MemoryRouter initialEntries={["/explore"]}>
    <ExplorePublicLibraryView
      pages={pages}
      search=""
      onSearchChange={() => {}}
      {...overrides}
    />
    <CurrentLocation />
  </MemoryRouter>,
);

afterEach(cleanup);

describe("ExplorePublicLibraryView", () => {
  it("makes each public collection card a uniquely named link", () => {
    renderLibrary();

    expect(screen.getByText("by @maya")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open My links public collection" })).toHaveAttribute("href", "/p/my-links");
    expect(screen.getByRole("link", { name: "Open Design links public collection" })).toHaveAttribute("href", "/p/design-links");
    expect(screen.queryByText(/Open in workspace|Open collection/)).not.toBeInTheDocument();
  });

  it("opens own pages in the workspace without offering a bookmark action", () => {
    renderLibrary({ ownPageIds: new Set(["own"]) });

    expect(screen.getByText("Own page")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open My links in your workspace" })).toHaveAttribute("href", "/pages/own");
    expect(screen.getAllByRole("button", { name: "Bookmark" })).toHaveLength(1);
  });

  it("invokes the bookmark action and labels existing bookmarks", () => {
    const onToggleBookmark = vi.fn();
    renderLibrary({
      bookmarkedPageIds: new Set(["own"]),
      onToggleBookmark,
    });

    fireEvent.click(screen.getByRole("button", { name: "Bookmark" }));
    expect(onToggleBookmark).toHaveBeenCalledWith(pages[1], false);
    expect(screen.getByRole("button", { name: "Bookmarked" })).toBeVisible();
    expect(screen.getByRole("status", { name: "Current location" })).toHaveTextContent("/explore");
  });

  it("keeps loaded cards visible and retries a failed next page", () => {
    const onRetryLoadMore = vi.fn();
    renderLibrary({
      isError: true,
      isNextPageError: true,
      hasNextPage: true,
      onRetryLoadMore,
    });

    expect(screen.getByText("Design links")).toBeVisible();
    expect(screen.getByText("More collections could not be loaded.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetryLoadMore).toHaveBeenCalledOnce();
  });
});
