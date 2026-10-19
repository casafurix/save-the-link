import { useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import type { Page, PageCollaboration } from "../../models/page";
import { usePublishPage, useSetCollaborators, useUnpublishPage } from "./pagesQueries";
import { useSearchUsers } from "../users/userQueries";
import { useToast } from "../../context/useToast";

type Collaboration = Exclude<PageCollaboration, "none">;

const CollaboratorsPicker = ({ page }: { page: Page }) => {
  const [inputValue, setInputValue] = useState("");
  const { data: suggestions } = useSearchUsers(inputValue);
  const setCollaborators = useSetCollaborators();
  const emails = page.collaboratorEmails ?? [];

  const addEmail = (raw: string) => {
    const email = raw.trim().toLowerCase();

    if (!email || emails.includes(email)) {
      setInputValue("");
      return;
    }

    setCollaborators.mutate({ id: page.id, emails: [...emails, email] });
    setInputValue("");
  };

  const removeEmail = (email: string) => {
    setCollaborators.mutate({
      id: page.id,
      emails: emails.filter((existing) => existing !== email),
    });
  };

  return (
    <Stack sx={{ gap: 1 }}>
      <Autocomplete
        freeSolo
        options={suggestions?.map((user) => user.email) ?? []}
        inputValue={inputValue}
        onInputChange={(_event, value) => setInputValue(value)}
        onChange={(_event, value) => {
          if (typeof value === "string") {
            addEmail(value);
          }
        }}
        renderInput={(params) => (
          <TextField {...params} label="Add people by email" size="small" />
        )}
      />

      {emails.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {emails.map((email) => (
            <Chip
              key={email}
              label={email}
              size="small"
              onDelete={() => removeEmail(email)}
            />
          ))}
        </Box>
      )}
    </Stack>
  );
};

interface ShareDialogProps {
  page: Page;
  open: boolean;
  onClose: () => void;
}

const ShareDialog = ({ page, open, onClose }: ShareDialogProps) => {
  const publishPage = usePublishPage();
  const unpublishPage = useUnpublishPage();
  const { showToast } = useToast();
  const [collaboration, setCollaboration] = useState<Collaboration>(
    page.collaboration === "edit" || page.collaboration === "invite"
      ? page.collaboration
      : "view",
  );

  const isPublic = page.visibility === "public";
  const shareUrl = page.slug ? `${window.location.origin}/p/${page.slug}` : "";

  const handleToggle = (checked: boolean) => {
    if (checked) {
      publishPage.mutate({ id: page.id, collaboration });
    } else {
      unpublishPage.mutate(page.id);
    }
  };

  const handleCollaborationChange = (value: Collaboration) => {
    setCollaboration(value);
    publishPage.mutate({ id: page.id, collaboration: value });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Link copied");
    } catch {
      showToast("Couldn't copy the link", "error");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Share "{page.title || "Untitled"}"</DialogTitle>
      <DialogContent>
        <Stack sx={{ gap: 2.5, mt: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isPublic}
                onChange={(event) => handleToggle(event.target.checked)}
              />
            }
            label={isPublic ? "Anyone with the link can view" : "Private"}
          />

          {isPublic && (
            <>
              <TextField
                label="Share link"
                value={shareUrl}
                fullWidth
                slotProps={{
                  input: {
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleCopy}
                          aria-label="Copy link"
                          size="small"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Stack sx={{ gap: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Permission
                </Typography>
                <RadioGroup
                  value={collaboration}
                  onChange={(event) =>
                    handleCollaborationChange(event.target.value as Collaboration)
                  }
                >
                  <FormControlLabel value="view" control={<Radio />} label="View only" />
                  <FormControlLabel
                    value="edit"
                    control={<Radio />}
                    label="Anyone with the link can edit"
                  />
                  <FormControlLabel
                    value="invite"
                    control={<Radio />}
                    label="Only people I choose can edit"
                  />
                </RadioGroup>
              </Stack>

              {collaboration === "invite" && <CollaboratorsPicker page={page} />}

              <Alert severity="info" variant="outlined">
                Turning this back to private will invalidate the link above.
              </Alert>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog;
