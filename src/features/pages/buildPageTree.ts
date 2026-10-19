import type { Page } from "../../models/page";
import { sortByOrder } from "../../lib/reorder";

export interface PageTreeNode extends Page {
  children: PageTreeNode[];
}

export const buildPageTree = (pages: Page[]): PageTreeNode[] => {
  const nodeById = new Map<string, PageTreeNode>();

  pages.forEach((page) => nodeById.set(page.id, { ...page, children: [] }));

  const roots: PageTreeNode[] = [];

  nodeById.forEach((node) => {
    const parent = node.parentPageId ? nodeById.get(node.parentPageId) : undefined;

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  nodeById.forEach((node) => node.children = sortByOrder(node.children));
  return sortByOrder(roots);
};
