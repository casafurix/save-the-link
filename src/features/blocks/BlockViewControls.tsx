import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { Block } from "../../models/block";
import {
  defaultBlockView,
  getBlockSources,
  getBlockTags,
  hasBlockFilters,
  type BlockViewState,
} from "./blockView";

interface BlockViewControlsProps {
  blocks: Block[];
  value: BlockViewState;
  onChange: (value: BlockViewState) => void;
  resultCount: number;
  reorderDisabled?: boolean;
}

const BlockViewControls = ({
  blocks,
  value,
  onChange,
  resultCount,
  reorderDisabled = false,
}: BlockViewControlsProps) => {
  const tags = getBlockTags(blocks);
  const sources = getBlockSources(blocks);
  const filtersActive = hasBlockFilters(value);
  const update = (updates: Partial<BlockViewState>) => onChange({ ...value, ...updates });

  return (
    <Stack spacing={1.25} sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ gap: 1, alignItems: { sm: "center" } }}
      >
        <TextField
          placeholder="Search links on this page…"
          aria-label="Search links"
          value={value.search}
          onChange={(event) => update({ search: event.target.value })}
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <SearchIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
              ),
            },
          }}
          sx={{ flex: "1 1 240px" }}
        />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel id="block-sort-label">Sort</InputLabel>
          <Select
            labelId="block-sort-label"
            label="Sort"
            value={value.sort}
            onChange={(event) => update({ sort: event.target.value as BlockViewState["sort"] })}
          >
            <MenuItem value="custom">Custom</MenuItem>
            <MenuItem value="newest">Newest</MenuItem>
            <MenuItem value="oldest">Oldest</MenuItem>
            <MenuItem value="title">Title A-Z</MenuItem>
            <MenuItem value="website">Website</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="block-source-label">Website</InputLabel>
          <Select
            labelId="block-source-label"
            label="Website"
            value={value.source}
            onChange={(event) => update({ source: event.target.value })}
          >
            <MenuItem value="">All websites</MenuItem>
            {sources.map((source) => (
              <MenuItem key={source} value={source}>{source}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 145 }}>
          <InputLabel id="block-preview-label">Preview</InputLabel>
          <Select
            labelId="block-preview-label"
            label="Preview"
            value={value.preview}
            onChange={(event) =>
              update({ preview: event.target.value as BlockViewState["preview"] })
            }
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="ready">Ready</MenuItem>
            <MenuItem value="failed">Preview failed</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {tags.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              color={value.tag === tag ? "primary" : undefined}
              variant={value.tag === tag ? "filled" : "outlined"}
              onClick={() => update({ tag: value.tag === tag ? null : tag })}
            />
          ))}
        </Box>
      )}

      <Stack direction="row" sx={{ minHeight: 30, alignItems: "center", gap: 1 }}>
        <Typography variant="caption" color="text.secondary" aria-live="polite">
          {resultCount} of {blocks.length} {blocks.length === 1 ? "link" : "links"}
        </Typography>
        {filtersActive && (
          <Button
            size="small"
            onClick={() => onChange({ ...defaultBlockView, sort: value.sort })}
          >
            Clear filters
          </Button>
        )}
        {reorderDisabled && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
            Choose Custom and clear filters to reorder.
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};

export default BlockViewControls;
