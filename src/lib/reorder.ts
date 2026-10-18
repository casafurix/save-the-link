export interface OrderedItem {
  id: string;
  order: number;
}

const edgeOrderGap = (order: number) =>
  Math.max(1, Math.abs(order) * Number.EPSILON * 4);

export const sortByOrder = <T extends OrderedItem>(items: T[]): T[] =>
  [...items].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));

export const getMovedItemOrder = <T extends OrderedItem>(
  items: T[],
  activeId: string,
  overId: string,
): { id: string; order: number } | null => {
  const sorted = sortByOrder(items);
  const oldIndex = sorted.findIndex((item) => item.id === activeId);
  const newIndex = sorted.findIndex((item) => item.id === overId);

  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
    return null;
  }

  const [moved] = sorted.splice(oldIndex, 1);
  sorted.splice(newIndex, 0, moved);
  const movedIndex = sorted.findIndex((item) => item.id === activeId);
  const previous = sorted[movedIndex - 1];
  const next = sorted[movedIndex + 1];

  if (!previous) return { id: activeId, order: next.order - edgeOrderGap(next.order) };
  if (!next) return { id: activeId, order: previous.order + edgeOrderGap(previous.order) };
  return { id: activeId, order: (previous.order + next.order) / 2 };
};
