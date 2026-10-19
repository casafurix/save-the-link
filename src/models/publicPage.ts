import type { Page } from "./page";

export interface PublicPageSummary {
  id: string;
  title: string;
  icon?: string;
  slug: string;
  linkCount: number;
  creatorUsername: string;
}

export interface PublicPageDetail extends Page {
  creatorUsername: string;
}

export const formatCreatorUsername = (creatorUsername: string) =>
  creatorUsername === "Unknown creator" ? creatorUsername : `@${creatorUsername}`;
