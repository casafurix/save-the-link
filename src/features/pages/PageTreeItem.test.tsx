import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import type { PageTreeNode } from "./buildPageTree";
import { PageTreeList } from "./PageTreeItem";

vi.mock("./pagesQueries", () => ({
  reorderPagesMutationKey: ["pages", "reorder"],
  useCreatePage: () => ({ mutateAsync: vi.fn() }),
  useDeletePage: () => ({ mutate: vi.fn() }),
  useReorderPages: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdatePage: () => ({ mutate: vi.fn() }),
}));

const page = (overrides: Partial<PageTreeNode>): PageTreeNode => ({
  id: "page",
  title: "Page",
  layout: "grid",
  visibility: "private",
  collaboration: "none",
  order: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  children: [],
  ...overrides,
});

afterEach(cleanup);

describe("PageTreeList visibility", () => {
  it("labels private and public owned pages without replacing their custom icons", () => {
    const queryClient = new QueryClient();
    const nodes = [
      page({ id: "private", title: "Private notes", icon: "P" }),
      page({ id: "public", title: "Public links", icon: "W", visibility: "public" }),
    ];

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PageTreeList nodes={nodes} depth={0} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole("img", { name: "Private page" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Public page" })).toBeVisible();
    expect(screen.getByText("P")).toBeVisible();
    expect(screen.getByText("W")).toBeVisible();
  });
});
