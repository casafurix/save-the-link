import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { dotGridSx } from "../theme/texture";
import ExplorePublicPages from "../features/public/ExplorePublicPages";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

const Brand = () => (
  <Stack direction="row" sx={{ alignItems: "center", gap: 1.25 }}>
    <Box component="img" src="/favicon.svg" alt="" sx={{ width: 32, height: 32 }} />
    <Typography sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>Save The Link</Typography>
  </Stack>
);

const AuthLayout = ({ title, subtitle, children, footer }: AuthLayoutProps) => (
  <Box
    sx={(theme) => ({
      minHeight: "100dvh",
      display: { md: "grid" },
      gridTemplateColumns: { md: "minmax(0, 1fr) minmax(400px, 460px)" },
      ...dotGridSx(theme),
    })}
  >
    <Box
      sx={{
        minWidth: 0,
        px: { xs: 2, sm: 4, lg: 7 },
        py: { xs: 2, md: 5 },
        borderRight: { md: 1 },
        borderColor: { md: "divider" },
      }}
    >
      <Brand />
      <Box sx={{ mt: { xs: 2.5, md: 8 }, maxWidth: 860 }}>
        <ExplorePublicPages />
      </Box>
    </Box>

    <Box
      component="aside"
      aria-label="Account access"
      sx={{
        display: "flex",
        minHeight: { md: "100dvh" },
        alignItems: { md: "center" },
        alignSelf: { md: "start" },
        position: { md: "sticky" },
        top: 0,
        px: { xs: 2, sm: 4, md: 5 },
        py: { xs: 5, md: 6 },
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 380, mx: "auto" }}>
        <Stack sx={{ mb: 4, gap: 1 }}>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography color="text.secondary">{subtitle}</Typography>
        </Stack>
        {children}
        <Box sx={{ mt: 3, textAlign: "center" }}>{footer}</Box>
      </Box>
    </Box>
  </Box>
);

export default AuthLayout;
