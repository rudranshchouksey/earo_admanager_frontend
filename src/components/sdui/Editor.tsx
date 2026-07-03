import { TrashIcon } from "lucide-react";
import { useMemo, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface EditorProps {
  value: string;
  onChange: (content: string, delta: any, source: string, editor: any) => void;
  readonly?: boolean;
  maxLength?: number;
}

const EDITOR_FORMATS = [
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "link",
  "header",
];

function normalizeHtmlForQuill(html: string) {
  return (html?.trim() || "")
    .replace(/<b(\s[^>]*)?>/gi, "<strong$1>")
    .replace(/<\/b>/gi, "</strong>");
}

export default function Editor({
  value,
  onChange,
  readonly = false,
  maxLength = 1000,
}: EditorProps) {
  const normalizedValue = useMemo(() => normalizeHtmlForQuill(value), [value]);
  const editorRef = useRef<ReactQuill>(null);

  const clear = () => {
    onChange("", "", "", editorRef.current?.getEditor());
    setTimeout(() => {
      onChange("", "", "", editorRef.current?.getEditor());
    }, 100);
  };


  editorRef.current?.getEditor().on('text-change', (delta, oldDelta, source) => {
    // quill.getLength() includes the trailing newline (\n), 
    // so we subtract 1 for an accurate count.

    if(maxLength) {
      const currentLength = editorRef.current?.getEditor().getLength() - 1; 
    
      if (currentLength > maxLength) {
        // Calculate how many characters crossed the line
        const overLimit = currentLength - maxLength;
        
        // Delete the excess characters from the end of the input
        editorRef.current?.getEditor().deleteText(maxLength, overLimit);
      }
    }
  });

  return (
    <div className="w-full">
      <div className="relative rounded-md border border-input bg-background [&_.ql-toolbar]:rounded-t-md [&_.ql-toolbar]:border-input [&_.ql-container]:rounded-b-md [&_.ql-container]:border-input [&_.ql-editor]:min-h-[220px] [&_.ql-editor]:text-sm [&_.ql-editor_strong]:font-bold">
        <ReactQuill
          theme="snow"
          value={normalizedValue}
          onChange={onChange}
          formats={EDITOR_FORMATS}
          readOnly={readonly}
          modules={{
            toolbar: [["bold", "italic"]],
          }}
          placeholder="Write your script here..."
          ref={editorRef}
        />
        <button
          disabled={value?.length === 0}
          onClick={clear}
          className="absolute bottom-5 cursor-pointer right-5 inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-[8px] px-3 absolute bottom-2 right-2 h-8"
        >
          <TrashIcon className="w-4 h-4" />
          <span>Clear</span>
        </button>
      </div>
      <div className="w-full flex items-center justify-end">
        <span className="text-xs text-muted-foreground text-right">
          {editorRef?.current?.getEditor().getText().trim().length}{" "}/1000 characters
        </span>
      </div>
    </div>
  );
}
