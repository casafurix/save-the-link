import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { Block } from "../../models/block";
import { useUpdateBlock } from "./blocksQueries";
import RichTextEditor from "../../components/RichTextEditor";
import TagInput from "../../components/TagInput";
import { normalizeNbsp, sanitizeHtml } from "../../lib/sanitizeHtml";

interface EditBlockFormProps {
  block: Block;
  pageId: string;
  onClose: () => void;
}

const EditBlockForm = ({ block, pageId, onClose }: EditBlockFormProps) => {
  const updateBlock = useUpdateBlock(pageId);
  const [title, setTitle] = useState(block.title);
  const [description, setDescription] = useState(() =>
    block.description ? sanitizeHtml(normalizeNbsp(block.description)) : "",
  );
  const [tags, setTags] = useState(block.tags);

  const handleSave = () => {
    updateBlock.mutate(
      {
        id: block.id,
        updates: {
          title: title.trim() || block.title,
          description: sanitizeHtml(normalizeNbsp(description)),
          tags,
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <>
      <DialogTitle>Edit link</DialogTitle>
      <DialogContent>
        <Stack sx={{ gap: 2.5, mt: 1 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            fullWidth
            autoFocus
          />
          <Stack sx={{ gap: 0.75 }}>
            <Typography variant="caption" color="text.secondary">
              Description
            </Typography>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Add your own notes about this link…"
            />
          </Stack>
          <TagInput tags={tags} onChange={setTags} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={updateBlock.isPending}
        >
          Save
        </Button>
      </DialogActions>
    </>
  );
};

interface EditBlockDialogProps {
  block: Block | null;
  pageId: string;
  onClose: () => void;
}

const EditBlockDialog = ({ block, pageId, onClose }: EditBlockDialogProps) => {
  return (
    <Dialog open={block !== null} onClose={onClose} fullWidth maxWidth="md">
      {block && (
        <EditBlockForm key={block.id} block={block} pageId={pageId} onClose={onClose} />
      )}
    </Dialog>
  );
};

export default EditBlockDialog;
