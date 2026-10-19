import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import PublicIcon from "@mui/icons-material/Public";
import SearchIcon from "@mui/icons-material/Search";
import { Link } from "react-router";
import type { PublicPageSummary } from "../../models/publicPage";
import { formatCreatorUsername } from "../../models/publicPage";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import {
  flattenPublicLibraryPages,
  usePublicLibrary,
} from "../../features/public/publicQueries";
import {
  useBookmarkPage,
  useBookmarks,
  usePages,
  useUnbookmarkPage,
} from "../../features/pages/pagesQueries";

interface ExplorePublicLibraryViewProps {
  pages: PublicPageSummary[];
  ownPageIds?: Set<string>;
  bookmarkedPageIds?: Set<string>;
  isLoading?: boolean;
  isError?: boolean;
  isFetchingNextPage?: boolean;
  isNextPageError?: boolean;
  hasNextPage?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onToggleBookmark?: (page: PublicPageSummary, isBookmarked: boolean) => void;
  onLoadMore?: () => void;
  onRetryLoadMore?: () => void;
  bookmarkPending?: boolean;
  ownershipKnown?: boolean;
  bookmarksKnown?: boolean;
}

const LoadingGrid = () => (
  <Box
    role="status"
    aria-label="Loading public library"
    sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: 2.5 }}
  >
    {Array.from({ length: 8 }, (_, index) => (
      <Card key={index} variant="outlined" sx={{ minHeight: 210 }}>
        <CardContent>
          <Skeleton variant="rounded" width={40} height={40} />
          <Skeleton width="75%" sx={{ mt: 2 }} />
          <Skeleton width="50%" />
          <Skeleton width="35%" sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    ))}
  </Box>
);

export const ExplorePublicLibraryView = ({
  pages,
  ownPageIds = new Set(),
  bookmarkedPageIds = new Set(),
  isLoading = false,
  isError = false,
  isFetchingNextPage = false,
  isNextPageError = false,
  hasNextPage = false,
  search,
  onSearchChange,
  onToggleBookmark,
  onLoadMore,
  onRetryLoadMore,
  bookmarkPending = false,
  ownershipKnown = true,
  bookmarksKnown = true,
}: ExplorePublicLibraryViewProps) => (
  <Box sx={{ width: "100%", maxWidth: 1240, mx: "auto", px: { xs: 2, sm: 4, lg: 6 }, py: { xs: 8, sm: 6 } }}>
    <Box component="header" sx={{ maxWidth: 720, mb: { xs: 4, sm: 5 } }}>
      <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: "0.12em" }}>
        Public library
      </Typography>
      <Typography component="h1" variant="h3" sx={{ fontWeight: 750, letterSpacing: "-0.035em", mt: 0.5 }}>
        Explore collections worth keeping
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: { sm: "1.05rem" } }}>
        Find useful links curated by the community, then bookmark a collection for later.
      </Typography>
    </Box>

    <TextField
      fullWidth
      value={search}
      onChange={(event) => onSearchChange(event.target.value)}
      label="Search collections or creators"
      placeholder="Try design systems or @maya"
      slotProps={{
        input: {
          startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
        },
      }}
      sx={{ maxWidth: 640, mb: 4, bgcolor: "background.paper" }}
    />

    {isLoading ? (
      <LoadingGrid />
    ) : isError && pages.length === 0 ? (
      <Alert severity="error">The public library could not be loaded. Please try again.</Alert>
    ) : pages.length === 0 ? (
      <Box sx={{ py: 8, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
        <PublicIcon color="disabled" sx={{ fontSize: 42 }} />
        <Typography variant="h6" sx={{ mt: 1 }}>No collections found</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {search.trim() ? "Try a different collection or creator." : "Public collections will appear here."}
        </Typography>
      </Box>
    ) : (
      <>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: 2.5 }}>
          {pages.map((page) => {
            const isOwnPage = ownPageIds.has(page.id);
            const isBookmarked = bookmarkedPageIds.has(page.id);
            const title = page.title || "Untitled";
            return (
              <Card
                key={page.id}
                variant="outlined"
                sx={{
                  position: "relative",
                  minWidth: 0,
                  minHeight: 220,
                  display: "flex",
                  flexDirection: "column",
                  bgcolor: "background.paper",
                  cursor: "pointer",
                  transition: "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: "0 10px 26px rgba(36, 82, 224, 0.14)",
                    transform: "translateY(-2px)",
                  },
                  "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                    "&:hover": { transform: "none" },
                  },
                }}
              >
                <CardContent sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 1.5, bgcolor: "action.hover", fontSize: "1.35rem" }}>
                    {page.icon || <PublicIcon color="action" />}
                  </Box>
                  <Typography
                    component={Link}
                    to={isOwnPage ? `/pages/${page.id}` : `/p/${page.slug}`}
                    aria-label={isOwnPage
                      ? `Open ${title} in your workspace`
                      : `Open ${title} public collection`}
                    variant="h6"
                    title={title}
                    sx={{
                      display: "block",
                      mt: 2,
                      color: "text.primary",
                      fontWeight: 650,
                      overflowWrap: "anywhere",
                      textDecoration: "none",
                      "&::after": {
                        position: "absolute",
                        zIndex: 1,
                        inset: 0,
                        borderRadius: "inherit",
                        content: '""',
                      },
                      "&:focus-visible": { outline: "none" },
                      "&:focus-visible::after": {
                        outline: "3px solid",
                        outlineColor: "primary.main",
                        outlineOffset: 3,
                      },
                    }}
                  >
                    {title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    by {formatCreatorUsername(page.creatorUsername)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                    {page.linkCount} {page.linkCount === 1 ? "link" : "links"}
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 0.5, flexWrap: "wrap", pointerEvents: "none" }}>
                  {!ownershipKnown ? null : isOwnPage ? (
                    <Typography variant="caption" color="text.secondary" sx={{ px: 1, py: 0.75, fontWeight: 600 }}>
                      Own page
                    </Typography>
                  ) : bookmarksKnown ? (
                    <Button
                      size="small"
                      color={isBookmarked ? "primary" : "inherit"}
                      startIcon={isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                      disabled={bookmarkPending}
                      onClick={() => onToggleBookmark?.(page, isBookmarked)}
                      sx={{ position: "relative", zIndex: 2, pointerEvents: "auto" }}
                    >
                      {isBookmarked ? "Bookmarked" : "Bookmark"}
                    </Button>
                  ) : null}
                </CardActions>
              </Card>
            );
          })}
        </Box>

        {(hasNextPage || isNextPageError) && (
          <Stack sx={{ mt: 4, alignItems: "center", gap: 2 }}>
            {isNextPageError && (
              <Alert
                severity="error"
                action={<Button color="inherit" size="small" onClick={onRetryLoadMore}>Retry</Button>}
              >
                More collections could not be loaded.
              </Alert>
            )}
            {hasNextPage && (
              <Button variant="outlined" onClick={onLoadMore} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            )}
          </Stack>
        )}
      </>
    )}
  </Box>
);

const ExplorePublicLibrary = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 250);
  const publicPages = usePublicLibrary(debouncedSearch);
  const ownPages = usePages();
  const bookmarks = useBookmarks();
  const bookmarkPage = useBookmarkPage();
  const unbookmarkPage = useUnbookmarkPage();

  const handleToggleBookmark = (page: PublicPageSummary, isBookmarked: boolean) => {
    if (isBookmarked) unbookmarkPage.mutate(page.id);
    else bookmarkPage.mutate(page.id);
  };

  return (
    <ExplorePublicLibraryView
      pages={flattenPublicLibraryPages(publicPages.data?.pages)}
      ownPageIds={new Set(ownPages.data?.map((page) => page.id))}
      bookmarkedPageIds={new Set(bookmarks.data?.map((page) => page.id))}
      isLoading={publicPages.isLoading}
      isError={publicPages.isError}
      isFetchingNextPage={publicPages.isFetchingNextPage}
      isNextPageError={publicPages.isFetchNextPageError}
      hasNextPage={publicPages.hasNextPage}
      search={search}
      onSearchChange={setSearch}
      onToggleBookmark={handleToggleBookmark}
      onLoadMore={() => publicPages.fetchNextPage()}
      onRetryLoadMore={() => publicPages.fetchNextPage()}
      bookmarkPending={bookmarkPage.isPending || unbookmarkPage.isPending}
      ownershipKnown={ownPages.isSuccess}
      bookmarksKnown={bookmarks.isSuccess}
    />
  );
};

export default ExplorePublicLibrary;
