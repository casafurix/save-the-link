import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import { useNavigate, useParams } from "react-router";
import { usePage, useUpdatePage } from "../../features/pages/pagesQueries";
import { useBlocks } from "../../features/blocks/blocksQueries";
import AddLinkForm from "../../features/blocks/AddLinkForm";
import SortableBlockGrid from "../../features/blocks/SortableBlockGrid";
import { blockGridSx } from "../../features/blocks/blockGridStyles";
import EditBlockDialog from "../../features/blocks/EditBlockDialog";
import ShareDialog from "../../features/pages/ShareDialog";
import type { Page } from "../../models/page";
import type { Block } from "../../models/block";
import BlockViewControls from "../../features/blocks/BlockViewControls";
import {
  canReorderBlockView,
  defaultBlockView,
  filterAndSortBlocks,
  hasBlockFilters,
  type BlockViewState,
} from "../../features/blocks/blockView";

const PageEditor = ({ page }: { page: Page }) => {
  const updatePage = useUpdatePage();
  const [title, setTitle] = useState(page.title);
  const isFocused = useRef(false);

  // Keep the field in sync with renames made elsewhere (e.g. the sidebar),
  // but never clobber text the user is actively typing.
  useEffect(() => {
    if (!isFocused.current) {
      setTitle(page.title);
    }
  }, [page.title]);

  const commitTitle = () => {
    const trimmed = title.trim();

    if (trimmed && trimmed !== page.title) {
      updatePage.mutate({ id: page.id, updates: { title: trimmed } });
    } else {
      setTitle(page.title);
    }
  };

  const { data: blocks, isLoading: blocksLoading } = useBlocks(page.id);
  const [createPending, setCreatePending] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [blockView, setBlockView] = useState<BlockViewState>(defaultBlockView);
  const visibleBlocks = filterAndSortBlocks(blocks ?? [], blockView);
  const canReorder = canReorderBlockView(true, blockView);

  const hasContent = (visibleBlocks && visibleBlocks.length > 0) || createPending;

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", px: 4, py: 6 }}>
      <Stack
        sx={{
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: 1.5,
        }}
      >
        <TextField
          variant="standard"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onFocus={() => {
            isFocused.current = true;
          }}
          onBlur={() => {
            isFocused.current = false;
            commitTitle();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              (event.target as HTMLInputElement).blur();
            }
          }}
          placeholder="Untitled"
          slotProps={{
            input: {
              disableUnderline: true,
              sx: { fontSize: "2rem", fontWeight: 700 },
            },
          }}
          fullWidth
          sx={{
            minWidth: 0,
            "& .MuiInputBase-input": {
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            },
          }}
        />
        <Stack
          direction="row"
          sx={{ alignItems: "center", gap: 1.5, flexShrink: 0 }}
        >
          {page.visibility === "public" && (
            <Chip
              icon={<PublicIcon />}
              label={
                page.collaboration === "edit"
                  ? "Public, anyone can edit"
                  : page.collaboration === "invite"
                    ? `Public, shared with ${page.collaboratorEmails?.length ?? 0}`
                    : "Public"
              }
              size="small"
              variant="outlined"
            />
          )}
          <Button
            variant="outlined"
            onClick={() => setShareOpen(true)}
            sx={{ flexShrink: 0 }}
          >
            Share
          </Button>
        </Stack>
      </Stack>

      <AddLinkForm pageId={page.id} onPendingChange={setCreatePending} />

      {(blocks && blocks.length > 0) && (
        <BlockViewControls
          blocks={blocks}
          value={blockView}
          onChange={setBlockView}
          resultCount={visibleBlocks.length}
          reorderDisabled={!canReorder}
        />
      )}

      {blocksLoading ? (
        <Box sx={blockGridSx}>
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} variant="rounded" height={180} />
          ))}
        </Box>
      ) : hasContent ? (
        <>
          <SortableBlockGrid
            blocks={visibleBlocks ?? []}
            pageId={page.id}
            onEdit={setEditingBlock}
            canReorder={canReorder}
            showPending={createPending}
          />
        </>
      ) : (
        <Box sx={{ mt: 6, textAlign: "center" }}>
          <Typography color="text.secondary">
            {hasBlockFilters(blockView)
              ? "No links match the current filters."
              : "No links here yet — paste one above to get started."}
          </Typography>
        </Box>
      )}

      <EditBlockDialog
        block={editingBlock}
        pageId={page.id}
        onClose={() => setEditingBlock(null)}
      />

      <ShareDialog page={page} open={shareOpen} onClose={() => setShareOpen(false)} />
    </Box>
  );
};

const PageScreen = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { data: page, isLoading, isError } = usePage(pageId);

  useEffect(() => {
    if (isError) {
      navigate("/home");
    }
  }, [isError, navigate]);

  if (isLoading || !page) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return <PageEditor key={page.id} page={page} />;
};

export default PageScreen;
