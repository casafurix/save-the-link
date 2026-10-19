import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { MainRoutes } from "./mainRoutes";

vi.mock("./protectedRoutes", () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("../layouts/AppLayout", () => ({ default: () => <Outlet /> }));
vi.mock("../screens/explore_public_library/ExplorePublicLibrary", () => ({
  default: () => <div>Explore route content</div>,
}));

describe("MainRoutes", () => {
  it("wires the protected explore route under the app layout", async () => {
    render(<MemoryRouter initialEntries={["/explore"]}><MainRoutes /></MemoryRouter>);

    expect(await screen.findByText("Explore route content")).toBeVisible();
  });
});
