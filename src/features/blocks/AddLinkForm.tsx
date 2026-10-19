import { useEffect, useState, type FormEvent } from "react";
import AddLinkIcon from "@mui/icons-material/AddLink";
import UploadIcon from "@mui/icons-material/Upload";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Collapse,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ConfirmDialog from "../../components/ConfirmDialog";
import { isDuplicateUrlConflict, useCreateBlock, useImportBlocks } from "./blocksQueries";
import type { BulkImportResult } from "../../models/block";

interface AddLinkFormProps {
  pageId: string;
  onPendingChange?: (isPending: boolean) => void;
}

const AddLinkForm = ({ pageId, onPendingChange }: AddLinkFormProps) => {
  const createBlock = useCreateBlock(pageId);
  const importBlocks = useImportBlocks(pageId);
  const [url, setUrl] = useState("");
  const [duplicateUrl, setDuplicateUrl] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkUrls, setBulkUrls] = useState("");
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const parsedUrls = bulkUrls.split("\n").map((value) => value.trim()).filter(Boolean);
  const isPending = createBlock.isPending || importBlocks.isPending;

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const save = (trimmedUrl: string, allowDuplicate: boolean) => {
    createBlock.mutate(
      { url: trimmedUrl, allowDuplicate },
      {
        onSuccess: () => {
          setUrl("");
          setDuplicateUrl(null);
        },
        onError: (error) => {
          if (isDuplicateUrlConflict(error)) {
            setDuplicateUrl(trimmedUrl);
          }
        },
      },
    );
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = url.trim();

    if (trimmed) {
      save(trimmed, false);
    }
  };

  return (
    <>
      <Stack sx={{ mt: 4, mb: 4, gap: 1.5 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", gap: 1 }}>
          <TextField
            placeholder="Paste a link to save it…"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            fullWidth
            size="small"
            slotProps={{ htmlInput: { "aria-label": "Link URL" } }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={!url.trim() || isPending}
            startIcon={createBlock.isPending ? <CircularProgress size={16} color="inherit" /> : <AddLinkIcon />}
            sx={{ flexShrink: 0 }}
          >
            Save
          </Button>
        </Box>
        <Button
          size="small"
          onClick={() => setBulkOpen((open) => !open)}
          aria-expanded={bulkOpen}
          sx={{ alignSelf: "flex-start" }}
        >
          {bulkOpen ? "Close bulk import" : "Import multiple links"}
        </Button>
        <Collapse in={bulkOpen}>
          <Stack
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              if (parsedUrls.length === 0 || parsedUrls.length > 100) return;
              importBlocks.mutate(
                { urls: parsedUrls, allowDuplicates },
                {
                  onSuccess: (result) => {
                    setImportResult(result);
                    setBulkUrls("");
                  },
                },
              );
            }}
            sx={{ gap: 1.5, p: 2, border: 1, borderColor: "divider", borderRadius: 1 }}
          >
            <TextField
              label="URLs"
              placeholder={"https://example.com\nhttps://example.org"}
              value={bulkUrls}
              onChange={(event) => {
                setBulkUrls(event.target.value);
                setImportResult(null);
              }}
              multiline
              minRows={4}
              helperText={`${parsedUrls.length}/100 URLs · one URL per line`}
              error={parsedUrls.length > 100}
              fullWidth
            />
            <FormControlLabel
              control={<Checkbox checked={allowDuplicates} onChange={(event) => setAllowDuplicates(event.target.checked)} />}
              label="Allow links already saved on this page"
            />
            <Button
              type="submit"
              variant="outlined"
              startIcon={importBlocks.isPending ? <CircularProgress size={16} /> : <UploadIcon />}
              disabled={parsedUrls.length === 0 || parsedUrls.length > 100 || isPending}
              sx={{ alignSelf: "flex-start" }}
            >
              Import links
            </Button>
            {importResult && (
              <Alert severity={importResult.failed.length > 0 ? "warning" : "success"}>
                <Typography variant="body2">
                  Created {importResult.created.length}, skipped {importResult.warnings.length}, failed {importResult.failed.length}.
                </Typography>
              </Alert>
            )}
          </Stack>
        </Collapse>
      </Stack>

      <ConfirmDialog
        open={duplicateUrl !== null}
        title="Save duplicate link?"
        description="This link is already saved on this page. Do you want to save it again?"
        confirmLabel="Save anyway"
        confirmColor="primary"
        confirmDisabled={createBlock.isPending}
        onCancel={() => setDuplicateUrl(null)}
        onConfirm={() => {
          if (duplicateUrl) {
            save(duplicateUrl, true);
          }
        }}
      />
    </>
  );
};

export default AddLinkForm;
