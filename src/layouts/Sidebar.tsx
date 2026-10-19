import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
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
import BookmarkRemoveIcon from "@mui/icons-material/BookmarkRemove";
import PublicIcon from "@mui/icons-material/Public";
import CloseIcon from "@mui/icons-material/Close";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";
import { useLocation, useNavigate } from "react-router";
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
import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_WIDTH_STORAGE_KEY,
  clampSidebarWidth,
  readSidebarWidth,
} from "./sidebarWidth";

export const SIDEBAR_WIDTH = SIDEBAR_DEFAULT_WIDTH;
const SIDEBAR_COLLAPSED_WIDTH = 56;
const MOBILE_SIDEBAR_WIDTH = 288;
const COLLAPSE_STORAGE_KEY = "sidebar-collapsed";

const getInitialCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

const getInitialWidth = () =>
  readSidebarWidth(typeof localStorage === "undefined" ? undefined : localStorage);

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface LogoMorphButtonProps {
  label: string;
  onClick: () => void;
  placement?: "bottom" | "right";
  action: ReactNode;
}

const LogoMorphButton = ({ label, onClick, placement = "bottom", action }: LogoMorphButtonProps) => (
  <Tooltip title={label} placement={placement}>
    <IconButton
      size="small"
      onClick={onClick}
      aria-label={label}
      sx={{
        position: "relative",
        width: 36,
        height: 36,
        flexShrink: 0,
        "& .logo-morph-layer": {
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          transition: "opacity 160ms ease, transform 160ms ease",
        },
        "& .logo-morph-action": { opacity: 0, transform: "scale(0.82)" },
        "&:hover .logo-morph-mark, &:focus .logo-morph-mark": {
          opacity: 0,
          transform: "scale(0.82)",
        },
        "&:hover .logo-morph-action, &:focus .logo-morph-action": {
          opacity: 1,
          transform: "scale(1)",
        },
        "@media (prefers-reduced-motion: reduce)": {
          "& .logo-morph-layer": { transition: "none" },
        },
      }}
    >
      <Box className="logo-morph-layer logo-morph-mark" aria-hidden="true">
        <Box component="img" src="/favicon.svg" alt="" sx={{ width: 25, height: 25 }} />
      </Box>
      <Box className="logo-morph-layer logo-morph-action" aria-hidden="true">
        {action}
      </Box>
    </IconButton>
  </Tooltip>
);

const Sidebar = ({ mobileOpen, onCloseMobile }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [sidebarWidth, setSidebarWidth] = useState(getInitialWidth);
  const resizeStart = useRef({ x: 0, width: SIDEBAR_DEFAULT_WIDTH });
  const resizeCleanup = useRef<(() => void) | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
    } catch {
      // Storage may be unavailable in privacy-restricted contexts.
    }
  }, [sidebarWidth]);

  useEffect(
    () => () => {
      resizeCleanup.current?.();
    },
    [],
  );

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
  const exploreActive = location.pathname === "/explore";

  const handleExplore = () => {
    navigate("/explore");
    if (isMobile) onCloseMobile();
  };

  const handleNewPage = async () => {
    const created = await createPage.mutateAsync({ title: "Untitled" });
    navigate(`/pages/${created.id}`);
    if (isMobile) onCloseMobile();
  };

  const handleResizeStart = (event: ReactMouseEvent) => {
    event.preventDefault();
    resizeCleanup.current?.();
    resizeStart.current = { x: event.clientX, width: sidebarWidth };
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    let active = true;

    const handleMove = (moveEvent: MouseEvent) => {
      setSidebarWidth(
        clampSidebarWidth(resizeStart.current.width + moveEvent.clientX - resizeStart.current.x),
      );
    };
    const cleanupResize = () => {
      if (!active) return;
      active = false;
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", cleanupResize);
      window.removeEventListener("blur", cleanupResize);
      if (resizeCleanup.current === cleanupResize) resizeCleanup.current = null;
    };

    resizeCleanup.current = cleanupResize;
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", cleanupResize);
    window.addEventListener("blur", cleanupResize);
  };

  const handleResizeKeyDown = (event: ReactKeyboardEvent) => {
    const step = event.shiftKey ? 24 : 8;
    let nextWidth: number | undefined;

    if (event.key === "ArrowLeft") nextWidth = sidebarWidth - step;
    if (event.key === "ArrowRight") nextWidth = sidebarWidth + step;
    if (event.key === "Home") nextWidth = SIDEBAR_MIN_WIDTH;
    if (event.key === "End") nextWidth = SIDEBAR_MAX_WIDTH;

    if (nextWidth !== undefined) {
      event.preventDefault();
      setSidebarWidth(clampSidebarWidth(nextWidth));
    }
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
        sx={{ alignItems: "center", justifyContent: "space-between", px: 1.25, py: 1.25 }}
      >
        <Box
          component="img"
          src="/favicon.svg"
          alt=""
          sx={{ width: 28, height: 28, flexShrink: 0, mx: 0.5 }}
        />
        <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600, flex: 1, ml: 0.5 }}>
          Save The Link
        </Typography>
        <IconButton size="small" onClick={() => setSearchOpen(true)} aria-label="Search">
          <SearchIcon fontSize="small" />
        </IconButton>
        <Tooltip title={isMobile ? "Close menu" : "Collapse sidebar"}>
          <IconButton
            size="small"
            onClick={isMobile ? onCloseMobile : () => setCollapsed(true)}
            aria-label={isMobile ? "Close menu" : "Collapse sidebar"}
          >
            {isMobile ? (
              <CloseIcon fontSize="small" />
            ) : (
              <ViewSidebarOutlinedIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Stack>

      <Divider />

      <Box sx={{ px: 1, pt: 1 }}>
        <Typography
          component="h2"
          variant="caption"
          color="text.secondary"
          sx={{ px: 1, py: 0.5, display: "block", fontWeight: 700, letterSpacing: "0.08em" }}
        >
          DISCOVER
        </Typography>
        <List disablePadding>
          <ListItemButton
            selected={exploreActive}
            onClick={handleExplore}
            sx={{ borderRadius: 1.5, px: 1.25, py: 1 }}
          >
            <PublicIcon fontSize="small" sx={{ mr: 1.25 }} />
            <Typography variant="body2" sx={{ fontWeight: exploreActive ? 700 : 600 }}>
              Explore
            </Typography>
          </ListItemButton>
        </List>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", py: 1 }}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", px: 2, pb: 0.5 }}
        >
          <Typography
            component="h2"
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 700, letterSpacing: "0.08em" }}
          >
            YOUR PAGES
          </Typography>
          <Tooltip title="New page">
            <IconButton size="small" onClick={handleNewPage} aria-label="New page" sx={{ p: 0.375 }}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
        {isLoading ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
            Loading…
          </Typography>
        ) : tree.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
            No pages yet — create one to get started.
          </Typography>
        ) : (
          <Box sx={{ px: 0.5 }}>
            <PageTreeList nodes={tree} depth={0} />
          </Box>
        )}
      </Box>

      {bookmarks && bookmarks.length > 0 && (
        <>
          <Divider />
          <Box sx={{ maxHeight: 200, overflowY: "auto", py: 1 }}>
            <Typography
              component="h2"
              variant="caption"
              color="text.secondary"
              sx={{ px: 2, py: 0.5, display: "block", fontWeight: 700, letterSpacing: "0.08em" }}
            >
              BOOKMARKED
            </Typography>
            <List disablePadding sx={{ px: 1 }}>
              {bookmarks.map((bookmark) => (
                <ListItemButton
                  key={bookmark.id}
                  onClick={() => navigate(`/p/${bookmark.slug}`)}
                  sx={{ borderRadius: 1, py: 0.5, px: 1 }}
                >
                  <Box sx={{ width: 20, textAlign: "center", mr: 0.75, flexShrink: 0 }}>
                    {bookmark.icon ?? <PublicIcon fontSize="small" />}
                  </Box>
                  <Tooltip title={bookmark.title || "Untitled"} placement="right" enterDelay={500}>
                    <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                      {bookmark.title || "Untitled"}
                    </Typography>
                  </Tooltip>
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

      <Box sx={{ px: 1.5, py: 1 }}>
        <Tooltip title={user?.username ?? ""} placement="top-start">
          <Stack
            direction="row"
            tabIndex={0}
            aria-label={`Signed in as ${user?.username ?? "user"}`}
            sx={{ minWidth: 0, alignItems: "center", gap: 1, px: 0.5, py: 0.5 }}
          >
            <Box
              aria-hidden="true"
              sx={{
                display: "grid",
                width: 26,
                height: 26,
                flexShrink: 0,
                placeItems: "center",
                borderRadius: "50%",
                bgcolor: "action.selected",
                color: "text.secondary",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              {user?.username?.charAt(0).toUpperCase()}
            </Box>
            <Typography variant="body2" noWrap sx={{ minWidth: 0, fontWeight: 600 }}>
              {user?.username}
            </Typography>
          </Stack>
        </Tooltip>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-around", mt: 0.5 }}>
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
      </Box>
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
          sx={{
            "& .MuiDrawer-paper": {
              width: `min(${MOBILE_SIDEBAR_WIDTH}px, calc(100vw - 32px))`,
              display: "flex",
            },
          }}
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
        <LogoMorphButton
          label="Expand sidebar"
          placement="right"
          onClick={() => setCollapsed(false)}
          action={<ViewSidebarOutlinedIcon fontSize="small" sx={{ transform: "scaleX(-1)" }} />}
        />
        <Tooltip title="Search" placement="right">
          <IconButton size="small" onClick={() => setSearchOpen(true)} aria-label="Search">
            <SearchIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="New page" placement="right">
          <IconButton size="small" onClick={handleNewPage} aria-label="New page">
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Explore public library" placement="right">
          <IconButton
            size="small"
            onClick={handleExplore}
            aria-label="Explore public library"
            color={exploreActive ? "primary" : "default"}
            sx={{ bgcolor: exploreActive ? "action.selected" : undefined }}
          >
            <PublicIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Trash" placement="right">
          <IconButton size="small" onClick={() => setTrashOpen(true)} aria-label="Trash">
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Settings" placement="right">
          <IconButton size="small" onClick={() => navigate("/settings")} aria-label="Settings">
            <SettingsOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip
          title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          placement="right"
        >
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
        </Tooltip>
        <Tooltip title="Log out" placement="right">
          <IconButton size="small" onClick={logout} aria-label="Log out">
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
        width: sidebarWidth,
        flexShrink: 0,
        height: "100vh",
        position: "relative",
        borderRight: 1,
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {fullContent}
      <Box
        role="separator"
        aria-label="Resize sidebar"
        aria-orientation="vertical"
        aria-valuemin={SIDEBAR_MIN_WIDTH}
        aria-valuemax={SIDEBAR_MAX_WIDTH}
        aria-valuenow={sidebarWidth}
        tabIndex={0}
        onMouseDown={handleResizeStart}
        onKeyDown={handleResizeKeyDown}
        sx={{
          position: "absolute",
          zIndex: 2,
          top: 0,
          right: -4,
          width: 8,
          height: "100%",
          cursor: "col-resize",
          outline: "none",
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 3,
            width: 2,
            bgcolor: "primary.main",
            opacity: 0,
            transition: "opacity 120ms ease",
          },
          "&:hover::after, &:focus-visible::after": { opacity: 1 },
        }}
      />
      {dialogs}
    </Box>
  );
};

export default Sidebar;
