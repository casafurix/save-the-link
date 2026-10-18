import { useEffect, useState, type FormEvent } from "react";
import AddLinkIcon from "@mui/icons-material/AddLink";
import { Box, Button, CircularProgress, TextField } from "@mui/material";
import ConfirmDialog from "../../components/ConfirmDialog";
import { isDuplicateUrlConflict, useCreateBlock } from "./blocksQueries";

interface AddLinkFormProps {
  pageId: string;
  onPendingChange?: (isPending: boolean) => void;
}

const AddLinkForm = ({ pageId, onPendingChange }: AddLinkFormProps) => {
  const createBlock = useCreateBlock(pageId);
  const [url, setUrl] = useState("");
  const [duplicateUrl, setDuplicateUrl] = useState<string | null>(null);

  useEffect(() => {
    onPendingChange?.(createBlock.isPending);
  }, [createBlock.isPending, onPendingChange]);

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
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", gap: 1, mt: 4, mb: 4 }}
      >
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
          disabled={!url.trim() || createBlock.isPending}
          startIcon={
            createBlock.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <AddLinkIcon />
            )
          }
          sx={{ flexShrink: 0 }}
        >
          Save
        </Button>
      </Box>

      <ConfirmDialog
        open={duplicateUrl !== null}
        title="Save duplicate link?"
        description="This link is already saved on this page. Do you want to save it again?"
        confirmLabel="Save anyway"
        confirmColor="warning"
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
