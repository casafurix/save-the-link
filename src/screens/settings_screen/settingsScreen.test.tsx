import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AxiosResponse } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as workspaceApi from "../../api/workspace";
import ToastProvider from "../../context/toastContext";
import { DataTab } from "./settingsScreen";

vi.mock("../../api/workspace", () => ({
  exportWorkspace: vi.fn(),
  importWorkspace: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("workspace data settings", () => {
  it("confirms a versioned upload and displays the server summary", async () => {
    vi.mocked(workspaceApi.importWorkspace).mockResolvedValueOnce({
      data: { pagesCreated: 2, blocksCreated: 5 },
    } as AxiosResponse);
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider><DataTab /></ToastProvider>
      </QueryClientProvider>,
    );

    const archive = {
      version: 1,
      pages: [{
        sourceId: "page-1",
        title: "Imported",
        blocks: [{ description: "<p>Notes</p><script>bad()</script>" }],
      }],
    };
    const file = new File([JSON.stringify(archive)], "workspace.json", {
      type: "application/json",
    });
    await user.upload(screen.getByLabelText("Workspace JSON file"), file);
    await user.click(await screen.findByRole("button", { name: "Import workspace" }));

    await waitFor(() => {
      expect(workspaceApi.importWorkspace).toHaveBeenCalledWith({
        ...archive,
        pages: [{
          ...archive.pages[0],
          blocks: [{ description: "<p>Notes</p>" }],
        }],
      });
    });
    expect(await screen.findByText(/Imported 2 pages and 5 links/)).toBeVisible();
  });
});
