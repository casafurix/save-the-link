import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import * as publicApi from "../../api/publicPages";
import type { PublicPageSummary } from "../../models/publicPage";

export const PUBLIC_LIBRARY_PAGE_SIZE = 24;
export const PUBLIC_LIBRARY_MAX_OFFSET = 9984;

export const getPublicLibraryNextOffset = (
  lastPage: PublicPageSummary[],
  _allPages: PublicPageSummary[][],
  lastPageParam: number,
) => lastPage.length === PUBLIC_LIBRARY_PAGE_SIZE
  && lastPageParam <= PUBLIC_LIBRARY_MAX_OFFSET - PUBLIC_LIBRARY_PAGE_SIZE
  ? lastPageParam + PUBLIC_LIBRARY_PAGE_SIZE
  : undefined;

export const flattenPublicLibraryPages = (pages: PublicPageSummary[][] | undefined) => {
  const seen = new Set<string>();
  return (pages ?? []).flat().filter((page) => {
    if (seen.has(page.id)) return false;
    seen.add(page.id);
    return true;
  });
};

export const publicLibraryQueryOptions = (query: string) => ({
  queryKey: ["public-pages-explore", query] as const,
  queryFn: ({ pageParam }: { pageParam: number }) =>
    publicApi.listPublicPagesPage({
      limit: PUBLIC_LIBRARY_PAGE_SIZE,
      offset: pageParam,
      q: query,
    }).then((response) => response.data),
  initialPageParam: 0,
  getNextPageParam: getPublicLibraryNextOffset,
});

export const usePublicPage = (slug: string | undefined) =>
  useQuery({
    queryKey: ["public-page", slug],
    queryFn: () => publicApi.getPublicPage(slug!).then((response) => response.data),
    enabled: slug !== undefined,
    retry: false,
  });

export const usePublicBlocks = (slug: string | undefined) =>
  useQuery({
    queryKey: ["public-blocks", slug],
    queryFn: () => publicApi.getPublicBlocks(slug!).then((response) => response.data),
    enabled: slug !== undefined,
  });

export const usePublicPagesList = () =>
  useQuery({
    queryKey: ["public-pages-list"],
    queryFn: () => publicApi.listPublicPages().then((response) => response.data),
  });

export const usePublicLibrary = (query: string) =>
  useInfiniteQuery(publicLibraryQueryOptions(query));
