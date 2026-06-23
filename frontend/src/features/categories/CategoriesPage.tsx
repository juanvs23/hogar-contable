import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import CategoryDialog from "./components/CategoryDialog"
import {
  ListCategories,
  CreateCategory,
  UpdateCategory,
  DeleteCategory,
} from "../../../wailsjs/go/main/App"
import { core } from "../../../wailsjs/go/models"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<core.Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all")
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState<"income" | "expense">("expense")
  const [creating, setCreating] = useState(false)

  // Edit dialog state
  const [editCategory, setEditCategory] = useState<core.Category | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const type = filter === "all" ? "" : filter
      const result = await ListCategories(type)
      setCategories(result ?? [])
    } catch (err) {
      console.error("Failed to load categories:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [filter])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await CreateCategory(newName.trim(), newType)
      setNewName("")
      await fetchCategories()
    } catch (err) {
      console.error("Failed to create category:", err)
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (cat: core.Category) => {
    setEditCategory(cat)
  }

  const handleSave = async (id: number, name: string, type: string) => {
    setSaving(true)
    try {
      await UpdateCategory(id, name, type)
      setEditCategory(null)
      await fetchCategories()
    } catch (err) {
      console.error("Failed to update category:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar la categoría "${name}"?`)) return
    try {
      await DeleteCategory(id)
      await fetchCategories()
    } catch (err) {
      console.error("Failed to delete category:", err)
    }
  }

  const incomeCats = categories.filter((c) => c.type === "income")
  const expenseCats = categories.filter((c) => c.type === "expense")
  const filteredCats =
    filter === "all" ? categories : filter === "income" ? incomeCats : expenseCats

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Categorías</h2>
        <p className="text-sm text-muted-foreground">
          Administrá las categorías de ingresos y gastos
        </p>
      </div>

      {/* Create form */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Nueva categoría</h3>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="cat-name" className="text-xs font-medium mb-1 block text-muted-foreground">
              Nombre
            </label>
            <input
              id="cat-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Supermercado"
              className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block text-muted-foreground">
              Tipo
            </label>
            <div className="flex gap-1">
              {(["expense", "income"] as const).map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={newType === t ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setNewType(t)}
                >
                  {t === "expense" ? "Gasto" : "Ingreso"}
                </Button>
              ))}
            </div>
          </div>
          <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
            <Plus className="size-4 mr-1.5" />
            {creating ? "Creando..." : "Crear"}
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1">
        {(["all", "income", "expense"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Todas" : f === "income" ? "Ingresos" : "Gastos"}
          </Button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredCats.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay categorías {filter !== "all" ? `de ${filter === "income" ? "ingresos" : "gastos"}` : ""}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredCats.map((cat) => (
            <div
              key={cat.id}
              className="rounded-lg border border-border bg-card px-4 py-3 flex items-center justify-between group cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleEdit(cat)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                    cat.type === "income" ? "bg-primary" : "bg-destructive"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cat.type === "income" ? "Ingreso" : "Gasto"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <CategoryDialog
        open={editCategory !== null}
        category={editCategory}
        onClose={() => setEditCategory(null)}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  )
}
