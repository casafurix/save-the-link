import { useState, type KeyboardEvent, type MouseEvent } from "react";
import {
  Box,
  Collapse,
  IconButton,
  List,
  ListItemButton,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useNavigate, useParams } from "react-router";
import { useIsMutating } from "@tanstack/react-query";
import type { PageTreeNode } from "./buildPageTree";
import {
  reorderPagesMutationKey,
  useCreatePage,
  useDeletePage,
  useReorderPages,
  useUpdatePage,
} from "./pagesQueries";
import ConfirmDialog from "../../components/ConfirmDialog";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getMovedItemOrder } from "../../lib/reorder";

interface PageTreeItemProps {
  node: PageTreeNode;
  depth: number;
  reorderDisabled: boolean;
}

const PageTreeItem = ({ node, depth, reorderDisabled }: PageTreeItemProps) => {
  const navigate = useNavigate();
  const { pageId } = useParams();
  const [expanded, setExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(node.title);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    disabled: reorderDisabled,
  });

  const createPage = useCreatePage();
  const updatePage = useUpdatePage();
  const deletePage = useDeletePage();

  const hasChildren = node.children.length > 0;
  const isActive = pageId === node.id;
  const verticalTransform = transform ? { ...transform, x: 0 } : null;

  const commitRename = () => {
    const title = draftTitle.trim();
    setIsEditing(false);

    if (title && title !== node.title) {
      updatePage.mutate({ id: node.id, updates: { title } });
    } else {
      setDraftTitle(node.title);
    }
  };

  const handleAddSubpage = async (event: MouseEvent) => {
    event.stopPropagation();
    setExpanded(true);
    const created = await createPage.mutateAsync({
      title: "Untitled",
      parentPageId: node.id,
    });
    navigate(`/pages/${created.id}`);
  };

  const confirmDelete = () => {
    setConfirmOpen(false);
    deletePage.mutate(node.id);

    if (isActive) {
      navigate("/home");
    }
  };

  return (
    <>
      <ListItemButton
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(verticalTransform), transition }}
        data-page-id={node.id}
        selected={isActive}
        onClick={() => navigate(`/pages/${node.id}`)}
        sx={{
          pl: 0.5 + depth * 1.25,
          pr: 0.5,
          py: 0.5,
          borderRadius: 1,
          opacity: isDragging ? 0.65 : 1,
        }}
      >
        <IconButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((prev) => !prev);
          }}
          sx={{ visibility: hasChildren ? "visible" : "hidden", mr: 0.125, p: 0.5 }}
        >
          {expanded ? (
            <ExpandMoreIcon fontSize="small" />
          ) : (
            <ChevronRightIcon fontSize="small" />
          )}
        </IconButton>

        <Box sx={{ width: 19, textAlign: "center", mr: 0.5, flexShrink: 0 }}>
          {node.icon ?? <ArticleOutlinedIcon fontSize="small" />}
        </Box>

        {isEditing ? (
          <TextField
            autoFocus
            variant="standard"
            size="small"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onBlur={commitRename}
            onKeyDown={(event: KeyboardEvent) => {
              if (event.key === "Enter") commitRename();
              if (event.key === "Escape") {
                setDraftTitle(node.title);
                setIsEditing(false);
              }
            }}
            onClick={(event) => event.stopPropagation()}
            sx={{ flex: 1 }}
          />
        ) : (
          <Tooltip title={node.title || "Untitled"} placement="right" enterDelay={500}>
            <Typography
              variant="body2"
              noWrap
              sx={{
                flex: 1,
                minWidth: 0,
                color: node.title ? "text.primary" : "text.secondary",
              }}
            >
              {node.title || "Untitled"}
            </Typography>
          </Tooltip>
        )}

        <Box
          sx={{
            display: "flex",
            width: 30,
            flexShrink: 0,
            overflow: "hidden",
            transition: "width 120ms ease",
            ".MuiListItemButton-root:hover &, .MuiListItemButton-root:focus-within &": { width: 90 },
          }}
        >
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              setMenuAnchor(event.currentTarget);
            }}
            aria-label="Page options"
            sx={{ p: 0.5 }}
          >
            <MoreHorizIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleAddSubpage}
            aria-label="Add subpage"
            sx={{ p: 0.5 }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label={`Reorder ${node.title || "Untitled"}`}
            disabled={reorderDisabled}
            onClick={(event) => event.stopPropagation()}
            {...attributes}
            {...listeners}
            sx={{
              cursor: reorderDisabled ? "default" : isDragging ? "grabbing" : "grab",
              touchAction: "none",
              p: 0.5,
            }}
          >
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
        </Box>
      </ListItemButton>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        disableRestoreFocus
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            setIsEditing(true);
          }}
        >
          Rename
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            setConfirmOpen(true);
          }}
          sx={{ color: "error.main" }}
        >
          Delete
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete page?"
        description={`"${node.title || "Untitled"}" and all of its subpages will be deleted.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      {hasChildren && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <PageTreeList nodes={node.children} depth={depth + 1} />
        </Collapse>
      )}
    </>
  );
};

interface PageTreeListProps {
  nodes: PageTreeNode[];
  depth: number;
}

export const PageTreeList = ({ nodes, depth }: PageTreeListProps) => {
  const reorderPages = useReorderPages();
  const reorderPending = useIsMutating({ mutationKey: reorderPagesMutationKey }) > 0;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (reorderPending || reorderPages.isPending || !over || active.id === over.id) return;
    const update = getMovedItemOrder(nodes, String(active.id), String(over.id));
    if (update) reorderPages.mutate(update);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={nodes.map(({ id }) => id)} strategy={verticalListSortingStrategy}>
        <List disablePadding>
          {nodes.map((node) => (
            <PageTreeItem
              key={node.id}
              node={node}
              depth={depth}
              reorderDisabled={reorderPending}
            />
          ))}
        </List>
      </SortableContext>
    </DndContext>
  );
};

export default PageTreeItem;
