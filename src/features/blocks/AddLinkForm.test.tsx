import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import ToastProvider from "../../context/toastContext";
import * as blocksApi from "../../api/blocks";
import AddLinkForm from "./AddLinkForm";

vi.mock("../../api/blocks", () => ({
  createBlock: vi.fn(),
  importBlocks: vi.fn(),
}));

const createBlock = vi.mocked(blocksApi.createBlock);
const importBlocks = vi.mocked(blocksApi.importBlocks);

const duplicateError = new AxiosError(
  "Conflict",
  "ERR_BAD_REQUEST",
  undefined,
  undefined,
  {
    status: 409,
    statusText: "Conflict",
    headers: {},
    config: { headers: {} },
    data: { code: "duplicate_url", message: "That URL is already saved." },
  } as AxiosResponse,
);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderForm = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AddLinkForm pageId="page-1" />
      </ToastProvider>
    </QueryClientProvider>,
  );
};

describe("AddLinkForm", () => {
  it("warns on a duplicate conflict and cancel does not save again", async () => {
    createBlock.mockRejectedValueOnce(duplicateError);
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByPlaceholderText("Paste a link to save it…"), " https://example.com ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("dialog", { name: "Save duplicate link?" })).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(createBlock).toHaveBeenCalledWith("page-1", {
      url: "https://example.com",
      allowDuplicate: false,
    });

    const dialog = screen.getByRole("dialog");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitForElementToBeRemoved(dialog);
    expect(createBlock).toHaveBeenCalledTimes(1);
  });

  it("retries a duplicate only after the user chooses Save anyway", async () => {
    createBlock
      .mockRejectedValueOnce(duplicateError)
      .mockResolvedValueOnce({ data: { fetchStatus: "ok" } } as AxiosResponse);
    const user = userEvent.setup();
    renderForm();

    const input = screen.getByPlaceholderText("Paste a link to save it…");
    await user.type(input, "https://example.com");
    await user.click(screen.getByRole("button", { name: "Save" }));
    const saveAnyway = await screen.findByRole("button", { name: "Save anyway" });
    expect(saveAnyway).toHaveClass("MuiButton-colorPrimary");
    await user.click(saveAnyway);

    await waitFor(() => {
      expect(createBlock).toHaveBeenNthCalledWith(2, "page-1", {
        url: "https://example.com",
        allowDuplicate: true,
      });
      expect(input).toHaveValue("");
    });
  });

  it("retains the normal error toast for non-duplicate failures", async () => {
    createBlock.mockRejectedValueOnce(
      new AxiosError("Server error", "ERR_BAD_RESPONSE", undefined, undefined, {
        status: 500,
        statusText: "Server Error",
        headers: {},
        config: { headers: {} },
        data: { message: "The server could not save this link." },
      } as AxiosResponse),
    );
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByPlaceholderText("Paste a link to save it…"), "https://example.com");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The server could not save this link.",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("imports one URL per line with duplicate preference and reports the summary", async () => {
    importBlocks.mockResolvedValueOnce({
      data: {
        created: [{ id: "block-1" }],
        warnings: [{ index: 1, url: "https://two.example", code: "duplicate_url", message: "Duplicate" }],
        failed: [{ index: 2, url: "https://failed.example", code: "create_failed", message: "Failed" }],
      },
    } as AxiosResponse);
    createBlock.mockResolvedValueOnce({ data: { id: "block-2" } } as AxiosResponse);
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Import multiple links" }));
    await user.type(
      screen.getByLabelText("URLs"),
      " https://one.example \n\nhttps://two.example",
    );
    await user.click(screen.getByRole("checkbox", { name: /Allow links/ }));
    await user.click(screen.getByRole("button", { name: "Import links" }));

    await waitFor(() => {
      expect(importBlocks).toHaveBeenCalledWith("page-1", {
        urls: ["https://one.example", "https://two.example"],
      });
      expect(createBlock).toHaveBeenCalledWith("page-1", {
        url: "https://two.example",
        allowDuplicate: true,
      });
    });
    expect(await screen.findByText("Created 2, skipped 0, failed 1.")).toBeVisible();
  });
});
