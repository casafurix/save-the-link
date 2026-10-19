import { Alert, Box, Skeleton, Stack, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import PublicIcon from "@mui/icons-material/Public";
import { Link } from "react-router";
import {
  formatCreatorUsername,
  type PublicPageSummary,
} from "../../models/publicPage";
import { usePublicPagesList } from "./publicQueries";

interface PublicCollectionCardProps {
  page: PublicPageSummary;
  featured?: boolean;
}

const PublicCollectionCard = ({ page, featured = false }: PublicCollectionCardProps) => (
  <Box
    component={Link}
    to={`/p/${page.slug}`}
    aria-label={`Open ${page.title || "Untitled"} by ${page.creatorUsername}`}
    sx={{
      display: "flex",
      minWidth: 0,
      minHeight: featured ? { xs: 144, md: 220 } : { xs: 144, md: 154 },
      flex: {
        xs: featured ? "0 0 86vw" : "0 0 78vw",
        sm: featured ? "0 0 520px" : "0 0 280px",
        md: "1 1 0",
      },
      gridColumn: featured ? { md: "1 / -1" } : undefined,
      flexDirection: "column",
      justifyContent: "space-between",
      scrollSnapAlign: "start",
      p: featured ? { xs: 2, md: 3 } : 2,
      border: 1,
      borderColor: featured ? "primary.main" : "divider",
      borderRadius: 2,
      color: "text.primary",
      bgcolor: featured ? "background.default" : "background.paper",
      textDecoration: "none",
      boxShadow: featured ? "0 14px 36px rgba(36, 82, 224, 0.12)" : "none",
      transition: "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
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
    }}
  >
    <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
      <Box
        sx={{
          display: "grid",
          width: featured ? 44 : 36,
          height: featured ? 44 : 36,
          placeItems: "center",
          borderRadius: 1.25,
          bgcolor: "action.hover",
          color: "primary.main",
          fontSize: featured ? "1.35rem" : "1rem",
        }}
      >
        {page.icon ?? <PublicIcon fontSize={featured ? "medium" : "small"} />}
      </Box>
      <ArrowOutwardIcon color="primary" fontSize="small" aria-hidden="true" />
    </Stack>
    <Box sx={{ mt: 2 }}>
      {featured && (
        <Typography
          variant="overline"
          color="primary.main"
          sx={{ fontWeight: 700, letterSpacing: "0.1em" }}
        >
          Featured collection
        </Typography>
      )}
      <Typography
        variant={featured ? "h5" : "subtitle1"}
        sx={{ fontWeight: 700, lineHeight: 1.2, mt: featured ? 0.5 : 0 }}
      >
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
    <Skeleton variant="rounded" height={220} aria-hidden="true" />
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
}: ExplorePublicPagesViewProps) => (
  <Box component="section" aria-labelledby="explore-public-pages-heading" sx={{ minWidth: 0 }}>
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
    ) : !pages?.length ? (
      <Box sx={{ p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
        <Typography sx={{ fontWeight: 600 }}>The shelves are being stocked.</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Public collections will appear here as they are shared.
        </Typography>
      </Box>
    ) : (
      <Box
        aria-label="Public collections"
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
        {pages.slice(0, 5).map((page, index) => (
          <PublicCollectionCard key={page.id} page={page} featured={index === 0} />
        ))}
      </Box>
    )}
  </Box>
);

const ExplorePublicPages = () => {
  const { data, isLoading, isError } = usePublicPagesList();

  return <ExplorePublicPagesView pages={data} isLoading={isLoading} isError={isError} />;
};

export default ExplorePublicPages;
