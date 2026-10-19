import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as blocksApi from "../../api/blocks";
import type { Block, BulkImportInput, UpdateBlockInput } from "../../models/block";
import { useToast } from "../../context/useToast";
import { getErrorMessage } from "../../lib/getErrorMessage";

export const blocksQueryKey = (pageId: string) => ["blocks", pageId] as const;

export interface CreateBlockInput {
  url: string;
  allowDuplicate: boolean;
}

export const isDuplicateUrlConflict = (error: unknown) =>
  axios.isAxiosError<{ code?: string }>(error) &&
  error.response?.status === 409 &&
  error.response.data?.code === "duplicate_url";

export const useBlocks = (pageId: string | undefined) =>
  useQuery({
    queryKey: blocksQueryKey(pageId ?? ""),
    queryFn: () => blocksApi.listBlocks(pageId!).then((response) => response.data),
    enabled: pageId !== undefined,
  });

export const useCreateBlock = (pageId: string) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (input: CreateBlockInput) =>
      blocksApi.createBlock(pageId, input).then((response) => response.data),
    onSuccess: (block) => {
      queryClient.invalidateQueries({ queryKey: blocksQueryKey(pageId) });
      if (block.fetchStatus === "failed") {
        showToast("Link saved, but we couldn't fetch a preview for it.", "info");
      } else {
        showToast("Link saved");
      }
    },
    onError: (error) => {
      if (!isDuplicateUrlConflict(error)) {
        showToast(getErrorMessage(error, "Couldn't save that link."), "error");
      }
    },
  });
};

export const useImportBlocks = (pageId: string) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ urls, allowDuplicates }: BulkImportInput) => {
      const result = await blocksApi.importBlocks(pageId, { urls }).then((response) => response.data);
      if (!allowDuplicates) return result;

      const duplicates = result.warnings.filter(({ code }) => code === "duplicate_url");
      const retries = await Promise.allSettled(
        duplicates.map(({ url }) =>
          blocksApi.createBlock(pageId, { url, allowDuplicate: true }).then(({ data }) => data),
        ),
      );

      return {
        created: [
          ...result.created,
          ...retries.flatMap((retry) => retry.status === "fulfilled" ? [retry.value] : []),
        ],
        warnings: result.warnings.filter(({ code }) => code !== "duplicate_url"),
        failed: [
          ...result.failed,
          ...retries.flatMap((retry, index) => retry.status === "rejected" ? [duplicates[index]] : []),
        ],
      };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: blocksQueryKey(pageId) }),
    onError: (error) =>
      showToast(getErrorMessage(error, "Couldn't import those links."), "error"),
  });
};

export const useReorderBlocks = (pageId: string) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, order }: { id: string; order: number }) =>
      blocksApi.updateBlock(id, { order }),
    onMutate: async ({ id, order }) => {
      await queryClient.cancelQueries({ queryKey: blocksQueryKey(pageId) });
      const previous = queryClient.getQueryData<Block[]>(blocksQueryKey(pageId));
      queryClient.setQueryData<Block[]>(blocksQueryKey(pageId), (current) =>
        current?.map((block) => block.id === id ? { ...block, order } : block),
      );
      return { previous };
    },
    onError: (error, _update, context) => {
      queryClient.setQueryData(blocksQueryKey(pageId), context?.previous);
      showToast(getErrorMessage(error, "Couldn't reorder those links."), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: blocksQueryKey(pageId) }),
  });
};

export const useUpdateBlock = (pageId: string) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateBlockInput }) =>
      blocksApi.updateBlock(id, updates).then((response) => response.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: blocksQueryKey(pageId) }),
    onError: (error) =>
      showToast(getErrorMessage(error, "Couldn't save that change."), "error"),
  });
};

export const useDeleteBlock = (pageId: string) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => blocksApi.deleteBlock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blocksQueryKey(pageId) });
      showToast("Link removed");
    },
    onError: (error) =>
      showToast(getErrorMessage(error, "Couldn't remove that link."), "error"),
  });
};
