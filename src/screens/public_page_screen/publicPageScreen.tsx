import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { Link, useParams } from "react-router";
import { usePublicBlocks, usePublicPage } from "../../features/public/publicQueries";
import { useBlocks } from "../../features/blocks/blocksQueries";
import AddLinkForm from "../../features/blocks/AddLinkForm";
import {
  useBookmarkPage,
  useBookmarks,
  usePages,
  useUnbookmarkPage,
} from "../../features/pages/pagesQueries";
import SortableBlockGrid from "../../features/blocks/SortableBlockGrid";
import { blockGridSx } from "../../features/blocks/blockGridStyles";
import EditBlockDialog from "../../features/blocks/EditBlockDialog";
import { useAuth } from "../../context/useAuth";
import { dotGridSx } from "../../theme/texture";
import type { Block } from "../../models/block";
import { formatCreatorUsername } from "../../models/publicPage";
import BlockViewControls from "../../features/blocks/BlockViewControls";
import {
  canReorderBlockView,
  defaultBlockView,
  filterAndSortBlocks,
  hasBlockFilters,
  type BlockViewState,
} from "../../features/blocks/blockView";

// Anonymous visitors land on a shared page with no app chrome at all — this is
// their only way to discover that "Save The Link" is a real product they can
// sign up for, rather than a dead end.
const GuestBanner = () => (
  <Stack
    direction="row"
    sx={{
      position: "sticky",
      top: 0,
      zIndex: 1,
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: 1.5,
      px: 3,
      py: 1.25,
      bgcolor: "background.paper",
      borderBottom: 1,
      borderColor: "divider",
    }}
  >
    <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
      <Box component="img" src="/favicon.svg" alt="" sx={{ width: 24, height: 24 }} />
      <Typography variant="body2" color="text.secondary">
        <Box component="span" sx={{ color: "text.primary", fontWeight: 700 }}>
          Save The Link
        </Box>{" "}
        — create a free account to organize and save your own links.
      </Typography>
    </Stack>
    <Stack direction="row" sx={{ gap: 1 }}>
      <Button component={Link} to="/login" size="small">
        Sign in
      </Button>
      <Button component={Link} to="/register" variant="contained" size="small">
        Create account
      </Button>
    </Stack>
  </Stack>
);

// A public page has no sidebar or app chrome of its own — logged-in visitors
// need a way back to their own workspace, and (for a page they don't own) a
// way to bookmark it for next time.
const AuthedVisitorBar = ({
  canBookmark,
  isBookmarked,
  onToggleBookmark,
  toggling,
}: {
  canBookmark: boolean;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  toggling: boolean;
}) => (
  <Stack
    direction="row"
    sx={{
      position: "sticky",
      top: 0,
      zIndex: 1,
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 1.5,
      px: 3,
      py: 1.25,
      bgcolor: "background.paper",
      borderBottom: 1,
      borderColor: "divider",
    }}
  >
    <Button
      component={Link}
      to="/home"
      size="small"
      startIcon={<ArrowBackIcon fontSize="small" />}
    >
      Back to my pages
    </Button>
    {canBookmark && (
      <Button
        size="small"
        variant={isBookmarked ? "contained" : "outlined"}
        startIcon={
          isBookmarked ? (
            <BookmarkIcon fontSize="small" />
          ) : (
            <BookmarkBorderIcon fontSize="small" />
          )
        }
        onClick={onToggleBookmark}
        disabled={toggling}
      >
        {isBookmarked ? "Bookmarked" : "Bookmark"}
      </Button>
    )}
  </Stack>
);

const PublicPageScreen = () => {
  const { slug } = useParams();
  const { isLoggedIn } = useAuth();
  const { data: page, isLoading: pageLoading, isError } = usePublicPage(slug);

  // "edit" = anyone with the link may be a collaborator; "invite" = only
  // specific people are — and the frontend isn't told who (that list is
  // private to the owner), so it can't precompute the answer. It has to
  // actually attempt the authenticated path and let the backend's real
  // authorization check decide, falling back to read-only if that's rejected.
  const mightEdit = Boolean(
    isLoggedIn && (page?.collaboration === "edit" || page?.collaboration === "invite"),
  );
  const authedBlocksQuery = useBlocks(mightEdit ? page?.id : undefined);
  const canEdit = mightEdit && authedBlocksQuery.isSuccess;

  // Anonymous / view-only / not-actually-invited visitors read through the
  // public, unauthenticated endpoint — including during the brief window
  // before we know whether the authenticated attempt above will succeed.
  const publicBlocksQuery = usePublicBlocks(canEdit ? undefined : slug);

  const blocks = canEdit ? authedBlocksQuery.data : publicBlocksQuery.data;
  const blocksLoading = canEdit
    ? authedBlocksQuery.isLoading
    : mightEdit && !authedBlocksQuery.isError
      ? true
      : publicBlocksQuery.isLoading;

  const [createPending, setCreatePending] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [blockView, setBlockView] = useState<BlockViewState>(defaultBlockView);

  // A page you own already lives in your own sidebar — bookmarking is only
  // offered once we're sure this page isn't one of yours, so it never even
  // flashes on your own pages while that's being determined.
  const ownPagesQuery = usePages(isLoggedIn);
  const isOwnPage = ownPagesQuery.data?.some((owned) => owned.id === page?.id) ?? false;
  const knowsOwnership = !isLoggedIn || ownPagesQuery.isSuccess;
  const canBookmark = Boolean(isLoggedIn && knowsOwnership && !isOwnPage && page);

  const bookmarksQuery = useBookmarks(isLoggedIn);
  const isBookmarked = bookmarksQuery.data?.some((b) => b.id === page?.id) ?? false;
  const bookmarkPage = useBookmarkPage();
  const unbookmarkPage = useUnbookmarkPage();

  const handleToggleBookmark = () => {
    if (!page) {
      return;
    }

    if (isBookmarked) {
      unbookmarkPage.mutate(page.id);
    } else {
      bookmarkPage.mutate(page.id);
    }
  };

  if (pageLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (isError || !page) {
    return (
      <Box>
        {isLoggedIn ? (
          <AuthedVisitorBar
            canBookmark={false}
            isBookmarked={false}
            onToggleBookmark={() => {}}
            toggling={false}
          />
        ) : (
          <GuestBanner />
        )}
        <Box sx={{ maxWidth: 480, mx: "auto", px: 4, py: 10, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            This page isn't available
          </Typography>
          <Typography color="text.secondary">
            The link may have been unpublished, or it never existed.
          </Typography>
        </Box>
      </Box>
    );
  }

  const visibleBlocks = filterAndSortBlocks(blocks ?? [], blockView);
  const canReorder = canReorderBlockView(canEdit, blockView);
  const hasContent = visibleBlocks.length > 0 || createPending;

  return (
    <Box sx={(theme) => ({ minHeight: "100dvh", ...dotGridSx(theme) })}>
      {isLoggedIn ? (
        <AuthedVisitorBar
          canBookmark={canBookmark}
          isBookmarked={isBookmarked}
          onToggleBookmark={handleToggleBookmark}
          toggling={bookmarkPage.isPending || unbookmarkPage.isPending}
        />
      ) : (
        <GuestBanner />
      )}
      <Box sx={{ maxWidth: 960, mx: "auto", px: 4, py: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {page.title || "Untitled"}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          Curated by {formatCreatorUsername(page.creatorUsername)}
        </Typography>

        {canEdit && (
          <AddLinkForm pageId={page.id} onPendingChange={setCreatePending} />
        )}

        <Box sx={{ mt: canEdit ? 0 : 4 }}>
          {blocksLoading ? (
            <Box sx={blockGridSx}>
              {[1, 2, 3].map((key) => (
                <Skeleton key={key} variant="rounded" height={180} />
              ))}
            </Box>
          ) : (
            <>
              {(blocks?.length ?? 0) > 0 && (
                <BlockViewControls
                  blocks={blocks ?? []}
                  value={blockView}
                  onChange={setBlockView}
                  resultCount={visibleBlocks.length}
                  reorderDisabled={canEdit && !canReorder}
                />
              )}
              {hasContent ? (
                <SortableBlockGrid
                  blocks={visibleBlocks}
                  pageId={page.id}
                  onEdit={setEditingBlock}
                  canReorder={canReorder}
                  readOnly={!canEdit}
                  showPending={createPending}
                />
              ) : (
                <Stack sx={{ alignItems: "center", mt: 6 }}>
                  <Typography color="text.secondary">
                    {hasBlockFilters(blockView)
                      ? "No links match the current filters."
                      : "No links here yet."}
                  </Typography>
                </Stack>
              )}
            </>
          )}
        </Box>

        {canEdit && (
          <EditBlockDialog
            block={editingBlock}
            pageId={page.id}
            onClose={() => setEditingBlock(null)}
          />
        )}
      </Box>
    </Box>
  );
};

export default PublicPageScreen;
