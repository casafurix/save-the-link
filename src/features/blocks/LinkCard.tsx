import { useState, type SyntheticEvent } from "react";
import { Box, Card, CardActionArea, Chip, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import type { Block } from "../../models/block";
import { useDeleteBlock } from "./blocksQueries";
import ConfirmDialog from "../../components/ConfirmDialog";
import { normalizeNbsp, sanitizeHtml } from "../../lib/sanitizeHtml";
import { monoFont } from "../../theme/theme";
import { getBlockSource } from "./blockView";

const hideOnError = (event: SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.style.display = "none";
};

interface LinkCardProps {
  block: Block;
  pageId: string;
  onEdit: (block: Block) => void;
  readOnly?: boolean;
}

const LinkCard = ({ block, pageId, onEdit, readOnly = false }: LinkCardProps) => {
  const deleteBlock = useDeleteBlock(pageId);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const descriptionHtml = block.description
    ? sanitizeHtml(normalizeNbsp(block.description))
    : "";

  return (
    <Card
      variant="outlined"
      sx={{
        position: "relative",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
      }}
    >
      <CardActionArea
        component="a"
        href={block.url}
        target="_blank"
        rel="noopener noreferrer"
        draggable={false}
      >
        {block.coverImage ? (
          <Box
            component="img"
            src={block.coverImage}
            alt=""
            referrerPolicy="no-referrer"
            onError={hideOnError}
            sx={{
              width: "100%",
              height: 140,
              objectFit: "cover",
              display: "block",
              bgcolor: "action.hover",
            }}
          />
        ) : (
          <Box
            sx={{
              height: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "action.hover",
            }}
          >
            {block.fetchStatus === "failed" ? (
              <LinkOffIcon color="disabled" />
            ) : block.favicon ? (
              <Box
                component="img"
                src={block.favicon}
                alt=""
                referrerPolicy="no-referrer"
                onError={hideOnError}
                sx={{ width: 28, height: 28 }}
              />
            ) : null}
          </Box>
        )}

        <Box sx={{ p: 1.5 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {block.title}
          </Typography>

          {descriptionHtml && (
            <Box
              sx={{
                mt: 0.5,
                color: "text.secondary",
                fontSize: "0.875rem",
                lineHeight: 1.43,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                "& p": { m: 0 },
                "& ul, & ol": { m: 0, pl: "1.2em" },
                "& a": { color: "inherit" },
              }}
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          )}

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block", fontFamily: monoFont }}
          >
            {getBlockSource(block)}
          </Typography>

          {block.tags.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
              {block.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          )}
        </Box>
      </CardActionArea>

      {!readOnly && (
        <>
          <IconButton
            size="small"
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            aria-label="Link options"
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <MoreHorizIcon fontSize="small" />
          </IconButton>

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            disableRestoreFocus
          >
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                onEdit(block);
              }}
            >
              Edit
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                setConfirmOpen(true);
              }}
              sx={{ color: "error.main" }}
            >
              Delete
            </MenuItem>
          </Menu>

          <ConfirmDialog
            open={confirmOpen}
            title="Remove this link?"
            description={`"${block.title}" will be removed from this page.`}
            confirmLabel="Remove"
            onConfirm={() => {
              setConfirmOpen(false);
              deleteBlock.mutate(block.id);
            }}
            onCancel={() => setConfirmOpen(false)}
          />
        </>
      )}
    </Card>
  );
};

export default LinkCard;
