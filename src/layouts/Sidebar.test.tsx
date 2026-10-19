import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router";
import Sidebar from "./Sidebar";

vi.mock("../context/useAuth", () => ({
  useAuth: () => ({ user: { username: "tester" }, logout: vi.fn() }),
}));
vi.mock("../context/useThemeMode", () => ({
  useThemeMode: () => ({ mode: "light", toggleMode: vi.fn() }),
}));
vi.mock("../features/pages/pagesQueries", () => ({
  usePages: () => ({ data: [], isLoading: false }),
  useCreatePage: () => ({ mutateAsync: vi.fn() }),
  useBookmarks: () => ({ data: [] }),
  useUnbookmarkPage: () => ({ mutate: vi.fn() }),
}));
vi.mock("../features/pages/TrashDialog", () => ({ default: () => null }));
vi.mock("../features/search/GlobalSearchDialog", () => ({ default: () => null }));

const Location = () => <span data-testid="location">{useLocation().pathname}</span>;

beforeEach(() => localStorage.setItem("sidebar-collapsed", "false"));
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
});
