import { useMemo, type CSSProperties } from "react";
import { useTheme } from "@mui/material";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import "./richTextEditor.css";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const modules = {
  toolbar: [
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "blockquote"],
    ["clean"],
  ],
};

// Keep Quill's document model limited to the controls exposed by this editor.
const formats = ["bold", "italic", "underline", "strike", "list", "link", "blockquote"];

const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const theme = useTheme();

  const cssVars = useMemo(
    () =>
      ({
        "--rte-border": theme.palette.divider,
        "--rte-toolbar-bg": theme.palette.background.default,
        "--rte-editor-bg": theme.palette.background.paper,
        "--rte-text": theme.palette.text.primary,
        "--rte-placeholder": theme.palette.text.disabled,
        "--rte-icon": theme.palette.text.secondary,
        "--rte-accent": theme.palette.primary.main,
      }) as CSSProperties,
    [theme],
  );

  return (
    <div className="rte-wrapper" style={cssVars}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
      />
    </div>
  );
};

export default RichTextEditor;
