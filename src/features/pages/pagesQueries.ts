import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as pagesApi from "../../api/pages";
import type { Page, UpdatePageInput } from "../../models/page";
import { useToast } from "../../context/useToast";
import { getErrorMessage } from "../../lib/getErrorMessage";

export const pagesQueryKey = ["pages"] as const;
export const reorderPagesMutationKey = ["reorder-pages"] as const;

export const usePages = (enabled = true) =>
  useQuery({
    queryKey: pagesQueryKey,
    queryFn: () => pagesApi.listPages().then((response) => response.data),
    enabled,
  });

export const usePage = (id: string | undefined) =>
  useQuery({
    queryKey: [...pagesQueryKey, id],
    queryFn: () => pagesApi.getPage(id!).then((response) => response.data),
    enabled: id !== undefined,
  });

export const useCreatePage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      title,
      parentPageId,
    }: {
      title: string;
      parentPageId?: string;
    }) => pagesApi.createPage(title, parentPageId).then((response) => response.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pagesQueryKey }),
    onError: (error) =>
      showToast(getErrorMessage(error, "Couldn't create the page."), "error"),
  });
};

export const useUpdatePage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdatePageInput }) =>
      pagesApi.updatePage(id, updates).then((response) => response.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pagesQueryKey }),
    onError: (error) =>
      showToast(getErrorMessage(error, "Couldn't save that change."), "error"),
  });
};

export const useReorderPages = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationKey: reorderPagesMutationKey,
    mutationFn: ({ id, order }: { id: string; order: number }) =>
      pagesApi.updatePage(id, { order }),
    onMutate: async ({ id, order }) => {
      await queryClient.cancelQueries({ queryKey: pagesQueryKey });
      const previous = queryClient.getQueryData<Page[]>(pagesQueryKey);
      queryClient.setQueryData<Page[]>(pagesQueryKey, (current) =>
        current?.map((page) => page.id === id ? { ...page, order } : page),
      );
      return { previous };
    },
    onError: (error, _update, context) => {
      queryClient.setQueryData(pagesQueryKey, context?.previous);
      showToast(getErrorMessage(error, "Couldn't reorder those pages."), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: pagesQueryKey }),
  });
};

export const useDeletePage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => pagesApi.deletePage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pagesQueryKey });
      queryClient.invalidateQueries({ queryKey: trashQueryKey });
      showToast("Page deleted");
    },
    onError: (error) =>
      showToast(getErrorMessage(error, "Couldn't delete the page."), "error"),
  });
};

export const trashQueryKey = ["trash"] as const;

export const useTrash = (enabled = true) =>
  useQuery({
    queryKey: trashQueryKey,
    queryFn: () => pagesApi.getTrash().then((response) => response.data),
    enabled,
  });

export const useRestorePage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => pagesApi.restorePage(id).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pagesQueryKey });
      queryClient.invalidateQueries({ queryKey: trashQueryKey });
      showToast("Page restored");
    },
    onError: (error) =>
      showToast(getErrorMessage(error, "Couldn't restore the page."), "error"),
  });
};

export const usePermanentlyDeletePage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => pagesApi.permanentlyDeletePage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trashQueryKey });
      showToast("Page permanently deleted");
    },
    onError: (error) =>
      showToast(getErrorMessage(error, "Couldn't delete the page."), "error"),
  });
};

export const usePublishPage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      collaboration,
    }: {
      id: string;
      collaboration: "view" | "edit" | "invite";
    }) => pagesApi.publishPage(id, collaboration).then((response) => response.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pagesQueryKey }),
    onError: (error) =>
      showToast(getErrorMessage(error, "Couldn't publish the page."), "error"),
  });
};

export const useSetCollaborators = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, emails }: { id: string; emails: string[] }) =>
      pagesApi.setCollaborators(id, emails).then((response) => response.data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: pagesQueryKey });
      if (result.notFoundEmails && result.notFoundEmails.length > 0) {
        showToast(
          `No account found for: ${result.notFoundEmails.join(", ")}`,
          "info",
        );
      }
    },
    onError: (error) =>
      showToast(getErrorMessage(error, "Couldn't update collaborators."), "error"),
  });
};

export const bookmarksQueryKey = ["bookmarks"] as const;

export const useBookmarks = (enabled = true) =>
  useQuery({
    queryKey: bookmarksQueryKey,
    queryFn: () => pagesApi.getBookmarks().then((response) => response.data),
    enabled,
  });

export const useBookmarkPage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => pagesApi.bookmarkPage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarksQueryKey });
      showToast("Bookmarked");
    },
    onError: (error) =>
      showToast(getErrorMessage(error, "Couldn't bookmark this page."), "error"),
  });
};

export const useUnbookmarkPage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => pagesApi.unbookmarkPage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarksQueryKey });
      showToast("Bookmark removed");
    },
    onError: (error) =>
      showToast(getErrorMessage(error, "Couldn't remove that bookmark."), "error"),
  });
};

export const useUnpublishPage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => pagesApi.unpublishPage(id).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pagesQueryKey });
      showToast("Page is private again");
    },
    onError: (error) =>
      showToast(getErrorMessage(error, "Couldn't unpublish the page."), "error"),
  });
};
