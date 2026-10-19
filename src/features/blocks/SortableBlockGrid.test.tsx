import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Block } from "../../models/block";
import ToastProvider from "../../context/toastContext";
import SortableBlockGrid from "./SortableBlockGrid";
import { isInteractiveDragTarget } from "./dragTarget";

const block: Block = {
  id: "block-1",
  pageId: "page-1",
  url: "https://example.com",
  title: "Example",
  description: "",
  fetchStatus: "ok",
  tags: [],
  order: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

afterEach(cleanup);

describe("SortableBlockGrid", () => {
  it("has no visible drag icon and retains keyboard reordering", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ToastProvider>
          <SortableBlockGrid
            blocks={[block]}
            pageId="page-1"
            onEdit={() => {}}
            canReorder
          />
        </ToastProvider>
      </QueryClientProvider>,
    );

    expect(screen.queryByTestId("DragIndicatorIcon")).not.toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Example/ });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("draggable", "false");
    expect(
      screen.getByRole("button", { name: "Reorder Example link with keyboard" }),
    ).toHaveTextContent("Reorder link");
  });

  it("allows anchor content to start dragging but excludes options controls", () => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <a href="#"><span>link</span></a>
      <button aria-label="Link options">options</button>
      <div data-no-dnd>custom control</div>
    `;
    expect(isInteractiveDragTarget(wrapper.querySelector("span"))).toBe(false);
    expect(isInteractiveDragTarget(wrapper.querySelector("button"))).toBe(true);
    expect(isInteractiveDragTarget(wrapper.querySelector("[data-no-dnd]"))).toBe(true);
  });
});
