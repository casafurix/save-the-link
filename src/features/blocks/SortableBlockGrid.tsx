import { Box, Skeleton } from "@mui/material";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type PointerSensorOptions,
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
import { isInteractiveDragTarget } from "./dragTarget";

class CardPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: (
        { nativeEvent }: React.PointerEvent,
        { onActivation }: PointerSensorOptions,
      ) => {
        if (
          !nativeEvent.isPrimary ||
          nativeEvent.button !== 0 ||
          isInteractiveDragTarget(nativeEvent.target)
        ) {
          return false;
        }

        onActivation?.({ event: nativeEvent });
        return true;
      },
    },
  ];
}

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
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled });
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!disabled) listeners?.onPointerDown?.(event);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!disabled) listeners?.onKeyDown?.(event);
  };

  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onPointerDown={handlePointerDown}
      sx={{
        position: "relative",
        minWidth: 0,
        opacity: isDragging ? 0.72 : 1,
        zIndex: isDragging ? 2 : "auto",
        borderRadius: 1,
        boxShadow: isDragging ? 8 : 0,
        cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
        // Touch vertical reordering intentionally yields to page scrolling; mouse and keyboard
        // retain full-grid reordering without making the entire card a scroll blocker.
        touchAction: disabled ? "auto" : "pan-y",
        "& a": { cursor: disabled ? "pointer" : isDragging ? "grabbing" : "grab" },
        "& button": { cursor: "pointer" },
      }}
    >
      <LinkCard block={block} pageId={pageId} onEdit={onEdit} />
      <Box
        component="button"
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Reorder ${block.title} link with keyboard`}
        data-no-dnd
        {...attributes}
        onKeyDown={handleKeyDown}
        sx={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 3,
          width: 1,
          height: 1,
          p: 0,
          m: -1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
          border: 0,
          bgcolor: "background.paper",
          color: "text.primary",
          font: "inherit",
          fontSize: "0.75rem",
          fontWeight: 600,
          borderRadius: 10,
          "&:focus-visible": {
            width: "auto",
            height: "auto",
            p: 0.75,
            m: 0,
            overflow: "visible",
            clip: "auto",
            clipPath: "none",
            border: 1,
            borderColor: "primary.main",
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: 2,
            boxShadow: 3,
          },
        }}
      >
        Reorder link
      </Box>
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
    useSensor(CardPointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const sorted = canReorder ? sortByOrder(blocks) : blocks;

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
