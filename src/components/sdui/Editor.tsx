import { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface EditorProps {
  value: string;
  onChange: (content: string, delta: any, source: string, editor: any) => void;
  readonly?: boolean;
}

const EDITOR_FORMATS = [
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'link',
  'header',
];

function normalizeHtmlForQuill(html: string) {
  return html
    .replace(/<b(\s[^>]*)?>/gi, '<strong$1>')
    .replace(/<\/b>/gi, '</strong>');
}

export default function Editor({ value, onChange, readonly=false }: EditorProps) {
  const normalizedValue = useMemo(() => normalizeHtmlForQuill(value), [value]);

  return (
    <div className="rounded-md border border-input bg-background [&_.ql-toolbar]:rounded-t-md [&_.ql-toolbar]:border-input [&_.ql-container]:rounded-b-md [&_.ql-container]:border-input [&_.ql-editor]:min-h-[220px] [&_.ql-editor]:text-sm [&_.ql-editor_strong]:font-bold">
      <ReactQuill
        theme="snow"
        value={normalizedValue}
        onChange={onChange}
        formats={EDITOR_FORMATS}
        readOnly={readonly}
        modules={{
          toolbar: [['bold', 'italic']],          
        }}
      />
    </div>
  );
}
