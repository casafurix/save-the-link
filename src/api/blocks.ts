import { blocksEndpoint, pagesEndpoint } from "../constants/apis";
import { httpClient } from "../lib/httpClient";
import type { Block, UpdateBlockInput } from "../models/block";

export const listBlocks = (pageId: string) =>
  httpClient.get<Block[]>(`${pagesEndpoint}/${pageId}/blocks`);

export const createBlock = (
  pageId: string,
  input: { url: string; allowDuplicate: boolean },
) => httpClient.post<Block>(`${pagesEndpoint}/${pageId}/blocks`, input);

export const updateBlock = (blockId: string, updates: UpdateBlockInput) =>
  httpClient.patch<Block>(`${blocksEndpoint}/${blockId}`, updates);

export const deleteBlock = (blockId: string) =>
  httpClient.delete(`${blocksEndpoint}/${blockId}`);
