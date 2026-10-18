import { useState } from "react";
import { Box, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Outlet, useLocation } from "react-router";
import Sidebar from "./Sidebar";
import { dotGridSx } from "../theme/texture";

const AppLayout = () => {
  const [drawerLocationKey, setDrawerLocationKey] = useState<string | null>(null);
  const location = useLocation();
  const mobileOpen = drawerLocationKey === location.key;

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setDrawerLocationKey(null)} />
      <Box
        component="main"
        sx={(theme) => ({
          flex: 1,
          minWidth: 0,
          height: "100vh",
          overflowY: "auto",
          ...dotGridSx(theme),
        })}
      >
        <IconButton
          onClick={() => setDrawerLocationKey(location.key)}
          aria-label="Open menu"
          sx={{
            display: { xs: "inline-flex", sm: "none" },
            position: "fixed",
            top: 12,
            left: 12,
            zIndex: 1,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
          }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppLayout;
