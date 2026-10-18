import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import * as blocksApi from "../../api/blocks";
import ToastProvider from "../../context/toastContext";
import type { Block } from "../../models/block";
import { blocksQueryKey, useReorderBlocks } from "./blocksQueries";

vi.mock("../../api/blocks", () => ({ updateBlock: vi.fn() }));

const block = (id: string, order: number): Block => ({
  id,
  pageId: "page-1",
  url: `https://${id}.example`,
  title: id,
  description: "",
  fetchStatus: "ok",
  tags: [],
  order,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
});

describe("useReorderBlocks", () => {
  it("optimistically updates the cache and rolls back a failed PATCH", async () => {
    let rejectPatch!: (error: Error) => void;
    vi.mocked(blocksApi.updateBlock).mockReturnValue(
      new Promise((_resolve, reject) => { rejectPatch = reject; }),
    );
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const original = [block("a", 0), block("b", 1)];
    const optimistic = [block("a", 0), block("b", -1)];
    queryClient.setQueryData(blocksQueryKey("page-1"), original);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    );
    const { result } = renderHook(() => useReorderBlocks("page-1"), { wrapper });

    act(() => result.current.mutate({ id: "b", order: -1 }));
    await waitFor(() => expect(queryClient.getQueryData(blocksQueryKey("page-1"))).toEqual(optimistic));
    expect(blocksApi.updateBlock).toHaveBeenCalledOnce();
    expect(blocksApi.updateBlock).toHaveBeenCalledWith("b", { order: -1 });

    act(() => rejectPatch(new Error("nope")));
    await waitFor(() => expect(queryClient.getQueryData(blocksQueryKey("page-1"))).toEqual(original));
  });
});
