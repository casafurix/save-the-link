import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicPageSummary } from "../../models/publicPage";
import { ExplorePublicPagesView, SPOTLIGHT_INTERVAL_MS } from "./ExplorePublicPages";

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

const mockMediaQueries = ({ desktop = true, reducedMotion = false } = {}) => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("min-width") ? desktop : reducedMotion,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
};

const renderDiscovery = (collectionPages = pages) =>
  render(
    <MemoryRouter>
      <ExplorePublicPagesView pages={collectionPages} />
    </MemoryRouter>,
  );

beforeEach(() => mockMediaQueries());

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("public discovery", () => {
  it("shows attribution, selection controls, and a clear link for the spotlight", () => {
    renderDiscovery();

    expect(screen.getAllByText("by @maya").length).toBeGreaterThan(0);
    expect(screen.getAllByText("by @lin").length).toBeGreaterThan(0);
    expect(screen.getAllByText("by Unknown creator").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /open design systems collection/i })).toHaveAttribute(
      "href",
      "/p/design-systems",
    );
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("button", { name: /feature the quiet web by lin/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(
      screen.getByRole("button", { name: /show design systems in spotlight/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("group", { name: /choose a spotlight collection/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /pause spotlight auto-rotation/i })).toBeVisible();
    expect(screen.getByText(/open to explore before you log in/i)).toBeVisible();
  });

  it("rotates the spotlight on desktop", () => {
    vi.useFakeTimers();
    renderDiscovery();

    act(() => vi.advanceTimersByTime(SPOTLIGHT_INTERVAL_MS));

    expect(screen.getByRole("link", { name: /open the quiet web collection/i })).toHaveAttribute(
      "href",
      "/p/quiet-web",
    );
  });

  it("continues rotating while hovered", () => {
    vi.useFakeTimers();
    renderDiscovery();
    const section = screen.getByRole("region", { name: /useful corners of the internet/i });

    fireEvent.mouseEnter(section);
    act(() => vi.advanceTimersByTime(SPOTLIGHT_INTERVAL_MS));
    expect(screen.getByRole("link", { name: /open the quiet web collection/i })).toBeVisible();
  });

  it("pauses while focused and resets when focus leaves", () => {
    vi.useFakeTimers();
    renderDiscovery();

    const quietWebChoice = screen.getByRole("button", { name: /feature the quiet web by lin/i });
    fireEvent.focus(quietWebChoice);
    act(() => vi.advanceTimersByTime(SPOTLIGHT_INTERVAL_MS * 2));
    expect(screen.getByRole("link", { name: /open design systems collection/i })).toBeVisible();

    fireEvent.blur(quietWebChoice, { relatedTarget: null });
    act(() => vi.advanceTimersByTime(SPOTLIGHT_INTERVAL_MS - 1));
    expect(screen.getByRole("link", { name: /open design systems collection/i })).toBeVisible();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("link", { name: /open the quiet web collection/i })).toBeVisible();
  });

  it("stays persistently paused until rotation is played again", () => {
    vi.useFakeTimers();
    renderDiscovery();

    fireEvent.click(screen.getByRole("button", { name: /pause spotlight auto-rotation/i }));
    expect(screen.getByRole("button", { name: /play spotlight auto-rotation/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    act(() => vi.advanceTimersByTime(SPOTLIGHT_INTERVAL_MS * 2));
    expect(screen.getByRole("link", { name: /open design systems collection/i })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /play spotlight auto-rotation/i }));
    expect(screen.getByRole("button", { name: /pause spotlight auto-rotation/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    act(() => vi.advanceTimersByTime(SPOTLIGHT_INTERVAL_MS));
    expect(screen.getByRole("link", { name: /open the quiet web collection/i })).toBeVisible();
  });

  it("promotes a selected card immediately and restarts the timer", () => {
    vi.useFakeTimers();
    renderDiscovery();

    act(() => vi.advanceTimersByTime(SPOTLIGHT_INTERVAL_MS - 1_000));
    fireEvent.click(screen.getByRole("button", { name: /feature the quiet web by lin/i }));
    expect(screen.getByRole("link", { name: /open the quiet web collection/i })).toBeVisible();

    act(() => vi.advanceTimersByTime(SPOTLIGHT_INTERVAL_MS - 1));
    expect(screen.getByRole("link", { name: /open the quiet web collection/i })).toBeVisible();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("link", { name: /open unknown origin collection/i })).toHaveAttribute(
      "href",
      "/p/unknown-origin",
    );
  });

  it("does not rotate with one collection", () => {
    vi.useFakeTimers();
    renderDiscovery([pages[0]]);

    act(() => vi.advanceTimersByTime(SPOTLIGHT_INTERVAL_MS * 10));

    expect(screen.getByRole("link", { name: /open design systems collection/i })).toBeVisible();
    expect(screen.queryByLabelText("Choose a spotlight collection")).not.toBeInTheDocument();
  });

  it("does not auto-rotate when reduced motion is requested", () => {
    mockMediaQueries({ reducedMotion: true });
    vi.useFakeTimers();
    renderDiscovery();

    act(() => vi.advanceTimersByTime(SPOTLIGHT_INTERVAL_MS * 2));

    expect(screen.getByRole("link", { name: /open design systems collection/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /play spotlight auto-rotation/i })).toBeDisabled();
  });

  it("does not auto-rotate or show playback controls on mobile", () => {
    mockMediaQueries({ desktop: false });
    vi.useFakeTimers();
    renderDiscovery();

    act(() => vi.advanceTimersByTime(SPOTLIGHT_INTERVAL_MS * 2));

    expect(screen.getByRole("link", { name: /open design systems collection/i })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /spotlight auto-rotation/i }),
    ).not.toBeInTheDocument();
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
