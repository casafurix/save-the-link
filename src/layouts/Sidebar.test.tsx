import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router";
import Sidebar from "./Sidebar";

const mocks = vi.hoisted(() => ({
  bookmarks: [] as Array<{ id: string; slug: string; title: string; icon?: string }>,
  createPage: vi.fn().mockResolvedValue({ id: "new-page" }),
}));

vi.mock("../context/useAuth", () => ({
  useAuth: () => ({ user: { username: "tester" }, logout: vi.fn() }),
}));
vi.mock("../context/useThemeMode", () => ({
  useThemeMode: () => ({ mode: "light", toggleMode: vi.fn() }),
}));
vi.mock("../features/pages/pagesQueries", () => ({
  usePages: () => ({ data: [], isLoading: false }),
  useCreatePage: () => ({ mutateAsync: mocks.createPage }),
  useBookmarks: () => ({ data: mocks.bookmarks }),
  useUnbookmarkPage: () => ({ mutate: vi.fn() }),
}));
vi.mock("../features/pages/TrashDialog", () => ({ default: () => null }));
vi.mock("../features/search/GlobalSearchDialog", () => ({ default: () => null }));

const Location = () => <span data-testid="location">{useLocation().pathname}</span>;

beforeEach(() => {
  localStorage.setItem("sidebar-collapsed", "false");
  mocks.bookmarks = [];
  mocks.createPage.mockClear();
});
afterEach(cleanup);

describe("Sidebar explore navigation", () => {
  it("marks Explore active and navigates to the public library", () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={["/home"]}>
        <Sidebar mobileOpen={false} onCloseMobile={() => {}} />
        <Location />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Explore" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/explore");

    rerender(
      <MemoryRouter initialEntries={["/explore"]}>
        <Sidebar mobileOpen={false} onCloseMobile={() => {}} />
        <Location />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: "Explore" })).toHaveClass("Mui-selected");
  });

  it("orders labeled sections and keeps page creation with Your Pages", async () => {
    render(
      <MemoryRouter initialEntries={["/home"]}>
        <Sidebar mobileOpen={false} onCloseMobile={() => {}} />
        <Location />
      </MemoryRouter>,
    );

    const discover = screen.getByRole("heading", { name: "DISCOVER" });
    const yourPages = screen.getByRole("heading", { name: "YOUR PAGES" });
    expect(discover.compareDocumentPosition(yourPages) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const newPage = screen.getByRole("button", { name: "New page" });
    expect(newPage.closest("div")).toContainElement(yourPages);
    fireEvent.click(newPage);

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/pages/new-page"));
    expect(mocks.createPage).toHaveBeenCalledWith({ title: "Untitled" });
    expect(screen.queryByRole("heading", { name: "BOOKMARKED" })).not.toBeInTheDocument();
  });

  it("shows Bookmarked only when bookmarks are present and after Your Pages", () => {
    mocks.bookmarks = [{ id: "bookmark", slug: "reference", title: "Reference" }];
    render(
      <MemoryRouter>
        <Sidebar mobileOpen={false} onCloseMobile={() => {}} />
      </MemoryRouter>,
    );

    const yourPages = screen.getByRole("heading", { name: "YOUR PAGES" });
    const bookmarked = screen.getByRole("heading", { name: "BOOKMARKED" });
    expect(yourPages.compareDocumentPosition(bookmarked) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("button", { name: /reference/i })).toBeVisible();
  });
});
