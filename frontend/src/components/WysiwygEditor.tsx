import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"

interface WysiwygEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    ["blockquote", "code-block"],
    ["link"],
    ["clean"],
  ],
}

const formats = [
  "header",
  "bold", "italic", "underline", "strike",
  "color", "background",
  "list", "bullet", "check",
  "indent",
  "align",
  "blockquote", "code-block",
  "link",
]

export default function WysiwygEditor({
  value,
  onChange,
  placeholder = "Escribí...",
  minHeight = 80,
}: WysiwygEditorProps) {
  return (
    <div className="wysiwyg-wrapper">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        style={{ minHeight }}
      />
    </div>
  )
}
