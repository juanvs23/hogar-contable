import { useState, useEffect, useRef } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { core } from "../../../../wailsjs/go/models"

interface CategoryDialogProps {
  open: boolean
  category: core.Category | null
  onClose: () => void
  onSave: (id: number, name: string, type: string) => Promise<void>
  saving: boolean
}

export default function CategoryDialog({
  open,
  category,
  onClose,
  onSave,
  saving,
}: CategoryDialogProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState<"income" | "expense">("expense")
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && category) {
      setName(category.name)
      setType(category.type as "income" | "expense")
    }
  }, [open, category])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    setTimeout(() => document.addEventListener("mousedown", handler), 0)
    return () => document.removeEventListener("mousedown", handler)
  }, [open, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !category) return
    await onSave(category.id, name.trim(), type)
  }

  if (!open || !category) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80">
      <div
        ref={dialogRef}
        className="bg-card border border-border rounded-lg shadow-lg w-full max-w-sm mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="text-base font-semibold">Editar categoría</h3>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="cat-edit-name" className="text-sm font-medium mb-1.5 block">
              Nombre
            </label>
            <input
              id="cat-edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de la categoría"
              className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Tipo</label>
            <div className="flex gap-2">
              {(["expense", "income"] as const).map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={type === t ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setType(t)}
                  className="flex-1"
                >
                  {t === "expense" ? "Gasto" : "Ingreso"}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cerrar
            </Button>
            <Button type="submit" size="sm" disabled={saving || !name.trim()}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
