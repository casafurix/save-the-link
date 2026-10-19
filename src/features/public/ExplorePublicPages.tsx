import { useEffect, useState, type FocusEvent } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PublicIcon from "@mui/icons-material/Public";
import { Link } from "react-router";
import {
  formatCreatorUsername,
  type PublicPageSummary,
} from "../../models/publicPage";
import { usePublicPagesList } from "./publicQueries";

export const SPOTLIGHT_INTERVAL_MS = 7_000;
const EMPTY_PUBLIC_PAGES: PublicPageSummary[] = [];

interface FeaturedCollectionProps {
  page: PublicPageSummary;
}

const FeaturedCollection = ({ page }: FeaturedCollectionProps) => (
  <Box
    key={page.id}
    sx={{
      display: "flex",
      minHeight: { xs: 220, md: 236 },
      flexDirection: "column",
      justifyContent: "space-between",
      p: { xs: 2.5, md: 3 },
      border: 1,
      borderColor: "primary.main",
      borderRadius: 2,
      bgcolor: "background.default",
      boxShadow: "0 14px 36px rgba(36, 82, 224, 0.12)",
      animation: "spotlight-enter 180ms ease-out",
      "@keyframes spotlight-enter": {
        from: { opacity: 0, transform: "translateY(5px)" },
        to: { opacity: 1, transform: "translateY(0)" },
      },
      "@media (prefers-reduced-motion: reduce)": { animation: "none" },
    }}
  >
    <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
      <Box
        sx={{
          display: "grid",
          width: 44,
          height: 44,
          placeItems: "center",
          borderRadius: 1.25,
          bgcolor: "action.hover",
          color: "primary.main",
          fontSize: "1.35rem",
        }}
      >
        {page.icon ?? <PublicIcon fontSize="medium" />}
      </Box>
      <Button
        component={Link}
        to={`/p/${page.slug}`}
        variant="outlined"
        endIcon={<ArrowOutwardIcon fontSize="small" />}
        aria-label={`Open ${page.title || "Untitled"} collection`}
      >
        Open collection
      </Button>
    </Stack>
    <Box sx={{ mt: 3 }}>
      <Typography
        variant="overline"
        color="primary.main"
        sx={{ fontWeight: 700, letterSpacing: "0.1em" }}
      >
        Collection spotlight
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2, mt: 0.5 }}>
        {page.title || "Untitled"}
      </Typography>
      <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, mt: 1 }}>
        <Typography variant="body2" color="text.secondary" noWrap>
          by {formatCreatorUsername(page.creatorUsername)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
          {page.linkCount} {page.linkCount === 1 ? "link" : "links"}
        </Typography>
      </Stack>
    </Box>
  </Box>
);

interface CollectionChoiceProps {
  page: PublicPageSummary;
  selected: boolean;
  index: number;
  onSelect: () => void;
}

const CollectionChoice = ({ page, selected, index, onSelect }: CollectionChoiceProps) => (
  <Box
    component="button"
    type="button"
    onClick={onSelect}
    aria-label={`Feature ${page.title || "Untitled"} by ${page.creatorUsername}`}
    aria-pressed={selected}
    sx={{
      display: "flex",
      minWidth: 0,
      minHeight: 154,
      flex: { xs: "0 0 78vw", sm: "0 0 280px", md: "1 1 0" },
      flexDirection: "column",
      justifyContent: "space-between",
      scrollSnapAlign: "start",
      p: 2,
      border: 1,
      borderColor: selected ? "primary.main" : "divider",
      borderRadius: 2,
      color: "text.primary",
      bgcolor: "background.paper",
      font: "inherit",
      textAlign: "left",
      cursor: "pointer",
      boxShadow: selected ? "0 8px 20px rgba(36, 82, 224, 0.1)" : "none",
      opacity: 0,
      animation: "collection-enter 280ms ease-out forwards",
      animationDelay: `${Math.min(index, 5) * 45}ms`,
      transition: "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
      "@keyframes collection-enter": {
        from: { opacity: 0, transform: "translateY(8px)" },
        to: { opacity: 1, transform: "translateY(0)" },
      },
      "&:hover": {
        borderColor: "primary.main",
        boxShadow: "0 10px 26px rgba(36, 82, 224, 0.14)",
        transform: "translateY(-2px)",
      },
      "&:focus-visible": {
        outline: "3px solid",
        outlineColor: "primary.main",
        outlineOffset: 3,
      },
      "@media (prefers-reduced-motion: reduce)": {
        opacity: 1,
        animation: "none",
        transition: "none",
        "&:hover": { transform: "none" },
      },
    }}
  >
    <Stack direction="row" sx={{ width: "100%", alignItems: "flex-start", justifyContent: "space-between" }}>
      <Box
        sx={{
          display: "grid",
          width: 36,
          height: 36,
          placeItems: "center",
          borderRadius: 1.25,
          bgcolor: "action.hover",
          color: "primary.main",
          fontSize: "1rem",
        }}
      >
        {page.icon ?? <PublicIcon fontSize="small" />}
      </Box>
      {selected && (
        <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
          In spotlight
        </Typography>
      )}
    </Stack>
    <Box sx={{ mt: 2, width: "100%" }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
        {page.title || "Untitled"}
      </Typography>
      <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, mt: 1 }}>
        <Typography variant="body2" color="text.secondary" noWrap>
          by {formatCreatorUsername(page.creatorUsername)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
          {page.linkCount} {page.linkCount === 1 ? "link" : "links"}
        </Typography>
      </Stack>
    </Box>
  </Box>
);

const DiscoverySkeleton = () => (
  <Stack
    role="status"
    aria-live="polite"
    aria-label="Loading public collections"
    sx={{ gap: 2 }}
  >
    <Typography
      sx={{
        position: "absolute",
        width: 1,
        height: 1,
        p: 0,
        m: -1,
        overflow: "hidden",
        clip: "rect(0 0 0 0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      Loading public collections…
    </Typography>
    <Skeleton variant="rounded" height={236} aria-hidden="true" />
    <Stack direction="row" sx={{ gap: 2 }}>
      <Skeleton variant="rounded" height={154} sx={{ flex: 1 }} aria-hidden="true" />
      <Skeleton variant="rounded" height={154} sx={{ flex: 1 }} aria-hidden="true" />
    </Stack>
  </Stack>
);

interface ExplorePublicPagesViewProps {
  pages?: PublicPageSummary[];
  isLoading?: boolean;
  isError?: boolean;
}

export const ExplorePublicPagesView = ({
  pages,
  isLoading = false,
  isError = false,
}: ExplorePublicPagesViewProps) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [selectedPageId, setSelectedPageId] = useState<string>();
  const [isRotationPaused, setIsRotationPaused] = useState(false);
  const [containsFocus, setContainsFocus] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState !== "hidden",
  );

  const availablePages = pages ?? EMPTY_PUBLIC_PAGES;
  const selectedIndex = Math.max(
    0,
    availablePages.findIndex((page) => page.id === selectedPageId),
  );
  const featuredPage = availablePages[selectedIndex];

  useEffect(() => {
    const handleVisibilityChange = () => setIsDocumentVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (
      !isDesktop ||
      prefersReducedMotion ||
      isRotationPaused ||
      containsFocus ||
      !isDocumentVisible ||
      availablePages.length < 2
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const nextIndex = (selectedIndex + 1) % availablePages.length;
      setSelectedPageId(availablePages[nextIndex].id);
    }, SPOTLIGHT_INTERVAL_MS);

    return () => window.clearTimeout(timeout);
  }, [
    availablePages,
    containsFocus,
    isDesktop,
    isDocumentVisible,
    isRotationPaused,
    prefersReducedMotion,
    selectedIndex,
  ]);

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setContainsFocus(false);
  };

  return (
    <Box
      component="section"
      aria-labelledby="explore-public-pages-heading"
      onFocus={() => setContainsFocus(true)}
      onBlur={handleBlur}
      sx={{ minWidth: 0 }}
    >
      <Typography
        variant="overline"
        color="primary.main"
        sx={{ fontWeight: 700, letterSpacing: "0.12em" }}
      >
        The public library
      </Typography>
      <Typography
        id="explore-public-pages-heading"
        component="h2"
        variant="h3"
        sx={{
          maxWidth: 640,
          mt: { xs: 0.5, md: 0.75 },
          fontSize: { xs: "2rem", sm: "3rem" },
          fontWeight: 700,
          lineHeight: 1.05,
        }}
      >
        Useful corners of the internet, collected by people.
      </Typography>
      <Typography
        color="text.secondary"
        sx={{ maxWidth: 600, mt: { xs: 1, md: 1.5 }, mb: { xs: 2, md: 3 } }}
      >
        Public pages are open to explore before you log in. Browse a collection now,
        then create your own when you are ready.
      </Typography>

      {isLoading ? (
        <DiscoverySkeleton />
      ) : isError ? (
        <Alert severity="info">The public library could not be loaded. You can still sign in.</Alert>
      ) : !featuredPage ? (
        <Box sx={{ p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
          <Typography sx={{ fontWeight: 600 }}>The shelves are being stocked.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Public collections will appear here as they are shared.
          </Typography>
        </Box>
      ) : (
        <Stack aria-label="Public collections" sx={{ gap: 2 }}>
          <FeaturedCollection key={featuredPage.id} page={featuredPage} />

          {availablePages.length > 1 && (
            <Stack
              direction="row"
              role="group"
              aria-label="Choose a spotlight collection"
              sx={{ justifyContent: "center", gap: 0.5 }}
            >
              {isDesktop && (
                <IconButton
                  size="small"
                  onClick={() => setIsRotationPaused((paused) => !paused)}
                  disabled={prefersReducedMotion}
                  aria-label={
                    isRotationPaused || prefersReducedMotion
                      ? "Play spotlight auto-rotation"
                      : "Pause spotlight auto-rotation"
                  }
                  aria-pressed={isRotationPaused || prefersReducedMotion}
                  sx={{ mr: 0.5 }}
                >
                  {isRotationPaused || prefersReducedMotion ? (
                    <PlayArrowIcon fontSize="small" />
                  ) : (
                    <PauseIcon fontSize="small" />
                  )}
                </IconButton>
              )}
              {availablePages.map((page, index) => (
                <IconButton
                  key={page.id}
                  size="small"
                  onClick={() => setSelectedPageId(page.id)}
                  aria-label={`Show ${page.title || "Untitled"} in spotlight`}
                  aria-pressed={index === selectedIndex}
                  sx={{ p: 0.75 }}
                >
                  <Box
                    aria-hidden="true"
                    sx={{
                      width: index === selectedIndex ? 18 : 7,
                      height: 7,
                      borderRadius: 4,
                      bgcolor: index === selectedIndex ? "primary.main" : "action.disabled",
                      transition: "width 160ms ease, background-color 160ms ease",
                      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
                    }}
                  />
                </IconButton>
              ))}
            </Stack>
          )}

          <Box
            sx={{
              display: { xs: "flex", md: "grid" },
              gridTemplateColumns: { md: "repeat(2, minmax(0, 1fr))" },
              gap: 2,
              overflowX: { xs: "auto", md: "visible" },
              scrollSnapType: { xs: "x mandatory", md: "none" },
              scrollbarWidth: "thin",
              pb: { xs: 1, md: 0 },
            }}
          >
            {availablePages.map((page, index) => (
              <CollectionChoice
                key={page.id}
                page={page}
                index={index}
                selected={index === selectedIndex}
                onSelect={() => setSelectedPageId(page.id)}
              />
            ))}
          </Box>
        </Stack>
      )}
    </Box>
  );
};

const ExplorePublicPages = () => {
  const { data, isLoading, isError } = usePublicPagesList();

  return <ExplorePublicPagesView pages={data} isLoading={isLoading} isError={isError} />;
};

export default ExplorePublicPages;
