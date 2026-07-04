import { useMemo } from "react"
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
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["clean"],
  ],
}

const formats = ["bold", "italic", "underline", "list", "bullet"]

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
