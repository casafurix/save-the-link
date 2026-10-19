import { useEffect, useState } from "react";
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import BookmarkRemoveIcon from "@mui/icons-material/BookmarkRemove";
import PublicIcon from "@mui/icons-material/Public";
import { useNavigate } from "react-router";
import { useAuth } from "../context/useAuth";
import { useThemeMode } from "../context/useThemeMode";
import {
  usePages,
  useCreatePage,
  useBookmarks,
  useUnbookmarkPage,
} from "../features/pages/pagesQueries";
import { buildPageTree } from "../features/pages/buildPageTree";
import { PageTreeList } from "../features/pages/PageTreeItem";
import TrashDialog from "../features/pages/TrashDialog";
import GlobalSearchDialog from "../features/search/GlobalSearchDialog";

export const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 56;
const COLLAPSE_STORAGE_KEY = "sidebar-collapsed";

const getInitialCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const Sidebar = ({ mobileOpen, onCloseMobile }: SidebarProps) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const { data: pages, isLoading } = usePages();
  const createPage = useCreatePage();
  const { data: bookmarks } = useBookmarks();
  const unbookmarkPage = useUnbookmarkPage();
  const [trashOpen, setTrashOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  // Cmd/Ctrl+K opens global search from anywhere in the app.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const tree = pages ? buildPageTree(pages) : [];

  const handleNewPage = async () => {
    const created = await createPage.mutateAsync({ title: "Untitled" });
    navigate(`/pages/${created.id}`);
  };

  const dialogs = (
    <>
      <TrashDialog open={trashOpen} onClose={() => setTrashOpen(false)} />
      <GlobalSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );

  const fullContent = (
    <>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5 }}
      >
        <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600, flex: 1 }}>
          Save The Link
        </Typography>
        <IconButton size="small" onClick={() => setSearchOpen(true)} aria-label="Search">
          <SearchIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={handleNewPage} aria-label="New page">
          <AddIcon fontSize="small" />
        </IconButton>
        {!isMobile && (
          <IconButton
            size="small"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse sidebar"
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      <Divider />

      <Box sx={{ flex: 1, overflowY: "auto", py: 1 }}>
        {isLoading ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
            Loading…
          </Typography>
        ) : tree.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
            No pages yet — create one to get started.
          </Typography>
        ) : (
          <Box sx={{ px: 1 }}>
            <PageTreeList nodes={tree} depth={0} />
          </Box>
        )}
      </Box>

      {bookmarks && bookmarks.length > 0 && (
        <>
          <Divider />
          <Box sx={{ maxHeight: 200, overflowY: "auto", py: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ px: 2, py: 0.5, display: "block", fontWeight: 600, letterSpacing: "0.04em" }}
            >
              Bookmarked
            </Typography>
            <List disablePadding sx={{ px: 1 }}>
              {bookmarks.map((bookmark) => (
                <ListItemButton
                  key={bookmark.id}
                  onClick={() => navigate(`/p/${bookmark.slug}`)}
                  sx={{ borderRadius: 1, py: 0.5 }}
                >
                  <Box sx={{ width: 20, textAlign: "center", mr: 0.75, flexShrink: 0 }}>
                    {bookmark.icon ?? <PublicIcon fontSize="small" />}
                  </Box>
                  <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                    {bookmark.title || "Untitled"}
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label="Remove bookmark"
                    onClick={(event) => {
                      event.stopPropagation();
                      unbookmarkPage.mutate(bookmark.id);
                    }}
                  >
                    <BookmarkRemoveIcon fontSize="small" />
                  </IconButton>
                </ListItemButton>
              ))}
            </List>
          </Box>
        </>
      )}

      <Divider />

      <Stack direction="row" sx={{ alignItems: "center", px: 2, py: 1.5, gap: 1 }}>
        <Typography variant="body2" noWrap sx={{ flex: 1 }}>
          {user?.username}
        </Typography>
        <IconButton
          size="small"
          onClick={toggleMode}
          aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {mode === "dark" ? (
            <LightModeOutlinedIcon fontSize="small" />
          ) : (
            <DarkModeOutlinedIcon fontSize="small" />
          )}
        </IconButton>
        <IconButton size="small" onClick={() => setTrashOpen(true)} aria-label="Trash">
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => navigate("/settings")}
          aria-label="Settings"
        >
          <SettingsOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={logout} aria-label="Log out">
          <LogoutIcon fontSize="small" />
        </IconButton>
      </Stack>
    </>
  );

  // On small screens the sidebar becomes an overlay drawer on its own stacking
  // layer — it never pushes or resizes the main content, and stays closed by
  // default so it can't break the page layout the way a permanent flex sidebar would.
  if (isMobile) {
    return (
      <>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onCloseMobile}
          ModalProps={{ keepMounted: true }}
          sx={{ "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH, display: "flex" } }}
        >
          {fullContent}
        </Drawer>
        {dialogs}
      </>
    );
  }

  if (collapsed) {
    return (
      <Box
        component="nav"
        sx={{
          width: SIDEBAR_COLLAPSED_WIDTH,
          flexShrink: 0,
          height: "100vh",
          borderRight: 1,
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 1.5,
          gap: 0.5,
        }}
      >
        <Tooltip title="Expand sidebar" placement="right">
          <IconButton size="small" onClick={() => setCollapsed(false)}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="New page" placement="right">
          <IconButton size="small" onClick={handleNewPage}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Search" placement="right">
          <IconButton size="small" onClick={() => setSearchOpen(true)}>
            <SearchIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Trash" placement="right">
          <IconButton size="small" onClick={() => setTrashOpen(true)}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Settings" placement="right">
          <IconButton size="small" onClick={() => navigate("/settings")}>
            <SettingsOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip
          title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          placement="right"
        >
          <IconButton size="small" onClick={toggleMode}>
            {mode === "dark" ? (
              <LightModeOutlinedIcon fontSize="small" />
            ) : (
              <DarkModeOutlinedIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title="Log out" placement="right">
          <IconButton size="small" onClick={logout}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {dialogs}
      </Box>
    );
  }

  return (
    <Box
      component="nav"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        height: "100vh",
        borderRight: 1,
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {fullContent}
      {dialogs}
    </Box>
  );
};

export default Sidebar;
