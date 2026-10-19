import { server_host } from "../constants/apis";
import { httpClient } from "../lib/httpClient";
import type { Block } from "../models/block";
import type { PublicPageDetail, PublicPageSummary } from "../models/publicPage";

const publicPagesEndpoint = server_host + "/public/pages";

export const getPublicPage = (slug: string) =>
  httpClient.get<PublicPageDetail>(`${publicPagesEndpoint}/${slug}`);

export const getPublicBlocks = (slug: string) =>
  httpClient.get<Block[]>(`${publicPagesEndpoint}/${slug}/blocks`);

export const listPublicPages = () =>
  httpClient.get<PublicPageSummary[]>(publicPagesEndpoint);

export interface PublicPagesListParams {
  limit: number;
  offset: number;
  q: string;
}

export const listPublicPagesPage = (params: PublicPagesListParams) =>
  httpClient.get<PublicPageSummary[]>(publicPagesEndpoint, { params });
