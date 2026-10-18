import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Box, IconButton, Skeleton } from "@mui/material";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Block } from "../../models/block";
import { getMovedItemOrder, sortByOrder } from "../../lib/reorder";
import { useReorderBlocks } from "./blocksQueries";
import LinkCard from "./LinkCard";
import { blockGridSx } from "./blockGridStyles";

const SortableCard = ({
  block,
  pageId,
  onEdit,
  disabled,
}: {
  block: Block;
  pageId: string;
  onEdit: (block: Block) => void;
  disabled: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    disabled,
  });

  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{ position: "relative", minWidth: 0, opacity: isDragging ? 0.65 : 1 }}
    >
      <LinkCard block={block} pageId={pageId} onEdit={onEdit} />
      <IconButton
        size="small"
        aria-label={`Reorder ${block.title}`}
        disabled={disabled}
        {...attributes}
        {...listeners}
        sx={{
          position: "absolute",
          top: 4,
          left: 4,
          zIndex: 1,
          cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          touchAction: "none",
        }}
      >
        <DragIndicatorIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

interface SortableBlockGridProps {
  blocks: Block[];
  pageId: string;
  onEdit: (block: Block) => void;
  canReorder: boolean;
  readOnly?: boolean;
  showPending?: boolean;
}

const SortableBlockGrid = ({
  blocks,
  pageId,
  onEdit,
  canReorder,
  readOnly = false,
  showPending = false,
}: SortableBlockGridProps) => {
  const reorderBlocks = useReorderBlocks(pageId);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const sorted = sortByOrder(blocks);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (reorderBlocks.isPending || !over || active.id === over.id) return;
    const update = getMovedItemOrder(sorted, String(active.id), String(over.id));
    if (update) reorderBlocks.mutate(update);
  };

  if (!canReorder) {
    return (
      <Box sx={blockGridSx}>
        {showPending && <Skeleton variant="rounded" height={180} />}
        {sorted.map((block) => (
          <LinkCard
            key={block.id}
            block={block}
            pageId={pageId}
            onEdit={onEdit}
            readOnly={readOnly}
          />
        ))}
      </Box>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sorted.map(({ id }) => id)} strategy={rectSortingStrategy}>
        <Box sx={blockGridSx}>
          {showPending && <Skeleton variant="rounded" height={180} />}
          {sorted.map((block) => (
            <SortableCard
              key={block.id}
              block={block}
              pageId={pageId}
              onEdit={onEdit}
              disabled={reorderBlocks.isPending}
            />
          ))}
        </Box>
      </SortableContext>
    </DndContext>
  );
};

export default SortableBlockGrid;
