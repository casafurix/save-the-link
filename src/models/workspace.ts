import { normalizeNbsp, sanitizeHtml } from "../lib/sanitizeHtml";

export interface WorkspaceBlock {
  description: string;
  [key: string]: unknown;
}

export interface WorkspacePage {
  sourceId: string;
  title: string;
  blocks: WorkspaceBlock[];
  [key: string]: unknown;
}

export interface WorkspaceExport {
  version: 1;
  exportedAt?: string;
  pages: WorkspacePage[];
  [key: string]: unknown;
}

export interface WorkspaceImportResult {
  pagesCreated: number;
  blocksCreated: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const isWorkspaceExport = (value: unknown): value is WorkspaceExport => {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.pages)) return false;

  return value.pages.every((page) =>
    isRecord(page) &&
    typeof page.sourceId === "string" &&
    typeof page.title === "string" &&
    Array.isArray(page.blocks) &&
    page.blocks.every((block) => isRecord(block) && typeof block.description === "string"),
  );
};

export const prepareWorkspaceImport = (value: unknown): WorkspaceExport | null => {
  if (!isWorkspaceExport(value)) return null;

  return {
    ...value,
    pages: value.pages.map((page) => ({
      ...page,
      blocks: page.blocks.map((block) => ({
        ...block,
        description: sanitizeHtml(normalizeNbsp(block.description)),
      })),
    })),
  };
};
