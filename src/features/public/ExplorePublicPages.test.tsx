import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import type { PublicPageSummary } from "../../models/publicPage";
import { ExplorePublicPagesView } from "./ExplorePublicPages";

const pages: PublicPageSummary[] = [
  {
    id: "featured",
    slug: "design-systems",
    title: "Design systems",
    creatorUsername: "maya",
    linkCount: 12,
  },
  {
    id: "second",
    slug: "quiet-web",
    title: "The quiet web",
    creatorUsername: "lin",
    linkCount: 4,
  },
  {
    id: "legacy",
    slug: "unknown-origin",
    title: "Unknown origin",
    creatorUsername: "Unknown creator",
    linkCount: 2,
  },
];

afterEach(cleanup);

describe("public discovery", () => {
  it("shows creator attribution and one accessible link per collection", () => {
    render(
      <MemoryRouter>
        <ExplorePublicPagesView pages={pages} />
      </MemoryRouter>,
    );

    expect(screen.getByText("by @maya")).toBeVisible();
    expect(screen.getByText("by @lin")).toBeVisible();
    expect(screen.getByText("by Unknown creator")).toBeVisible();
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(screen.getByRole("link", { name: /open design systems by maya/i })).toHaveAttribute(
      "href",
      "/p/design-systems",
    );
    expect(screen.getByText(/open to explore before you log in/i)).toBeVisible();
  });

  it("announces a stable loading presentation without collection links", () => {
    render(
      <MemoryRouter>
        <ExplorePublicPagesView isLoading />
      </MemoryRouter>,
    );

    const status = screen.getByRole("status", { name: "Loading public collections" });
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Loading public collections");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
