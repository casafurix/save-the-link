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
import SearchIcon from "@mui/icons-material/Search";
import PublicIcon from "@mui/icons-material/Public";
import { useNavigate, useParams } from "react-router";
import { usePage, useUpdatePage } from "../../features/pages/pagesQueries";
import { useBlocks } from "../../features/blocks/blocksQueries";
import AddLinkForm from "../../features/blocks/AddLinkForm";
import LinkCard from "../../features/blocks/LinkCard";
import EditBlockDialog from "../../features/blocks/EditBlockDialog";
import ShareDialog from "../../features/pages/ShareDialog";
import type { Page } from "../../models/page";
import type { Block } from "../../models/block";

const gridSx = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: 2,
};

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
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const allTags = Array.from(new Set(blocks?.flatMap((block) => block.tags) ?? [])).sort();

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchesSearch = (block: Block) => {
    if (!normalizedQuery) {
      return true;
    }

    const haystack = [block.title, block.description.replace(/<[^>]*>/g, " "), block.url, ...block.tags]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  };

  const visibleBlocks = blocks
    ?.filter((block) => !activeTag || block.tags.includes(activeTag))
    .filter(matchesSearch);

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
        <TextField
          placeholder="Search links on this page…"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          size="small"
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <SearchIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
              ),
            },
          }}
          sx={{ mb: 3 }}
        />
      )}

      {allTags.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
          {allTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              color={activeTag === tag ? "primary" : undefined}
              variant={activeTag === tag ? "filled" : "outlined"}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            />
          ))}
        </Box>
      )}

      {blocksLoading ? (
        <Box sx={gridSx}>
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} variant="rounded" height={180} />
          ))}
        </Box>
      ) : hasContent ? (
        <Box sx={gridSx}>
          {createPending && <Skeleton variant="rounded" height={180} />}
          {visibleBlocks?.map((block) => (
            <LinkCard
              key={block.id}
              block={block}
              pageId={page.id}
              onEdit={setEditingBlock}
            />
          ))}
        </Box>
      ) : (
        <Box sx={{ mt: 6, textAlign: "center" }}>
          <Typography color="text.secondary">
            {normalizedQuery
              ? `No links match "${searchQuery.trim()}".`
              : activeTag
                ? `No links tagged "${activeTag}".`
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
