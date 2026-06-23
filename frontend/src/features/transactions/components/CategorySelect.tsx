import { useState, useEffect } from "react"
import { ListCategories } from "../../../../wailsjs/go/main/App"
import { core } from "../../../../wailsjs/go/models"

interface CategorySelectProps {
  txType: string
  value: number | null
  onChange: (categoryId: number | null) => void
  disabled?: boolean
}

export default function CategorySelect({
  txType,
  value,
  onChange,
  disabled = false,
}: CategorySelectProps) {
  const [categories, setCategories] = useState<core.Category[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!txType) return
    setLoading(true)
    ListCategories(txType)
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [txType])

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      disabled={disabled || loading}
      className="h-8 w-full rounded-md border border-input bg-background text-foreground px-2.5 text-sm focus:outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring disabled:opacity-50"
    >
      <option value="" className="bg-background text-foreground">Sin categoría</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id} className="bg-background text-foreground">
          {cat.name}
        </option>
      ))}
    </select>
  )
}
