export type BlockFetchStatus = "ok" | "failed";

export interface Block {
  id: string;
  pageId: string;
  url: string;
  title: string;
  description: string;
  coverImage?: string;
  favicon?: string;
  siteName?: string;
  fetchStatus: BlockFetchStatus;
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBlockInput {
  title?: string;
  description?: string;
  tags?: string[];
  order?: number;
}

export interface BulkImportInput {
  urls: string[];
  allowDuplicates: boolean;
}

export interface BulkImportIssue {
  index: number;
  url: string;
  code: string;
  message: string;
}

export interface BulkImportResult {
  created: Block[];
  warnings: BulkImportIssue[];
  failed: BulkImportIssue[];
}
