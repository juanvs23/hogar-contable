import { useState, useEffect, useRef } from "react"
import { X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SetManualExchangeRates } from "../../../wailsjs/go/main/App"

interface RateModalProps {
  open: boolean
  onClose: () => void
  onSaved: (official: number, p2p: number) => void
}

export default function RateModal({ open, onClose, onSaved }: RateModalProps) {
  const [official, setOfficial] = useState("")
  const [p2p, setP2p] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const dialogRef = useRef<HTMLDivElement>(null)

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

  const handleSave = async () => {
    const officialVal = parseFloat(official)
    const p2pVal = parseFloat(p2p)

    if (isNaN(officialVal) || officialVal <= 0) {
      setError("Ingresá un valor válido para la tasa oficial")
      return
    }
    if (isNaN(p2pVal) || p2pVal <= 0) {
      setError("Ingresá un valor válido para la tasa USDT")
      return
    }

    setSaving(true)
    setError("")
    try {
      await SetManualExchangeRates(officialVal, p2pVal)
      onSaved(officialVal, p2pVal)
      onClose()
    } catch (err: unknown) {
      setError(typeof err === "string" ? err : "Error al guardar las tasas")
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80">
      <div
        ref={dialogRef}
        className="bg-card border border-border rounded-lg shadow-lg w-full max-w-sm mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 text-amber-500" />
            <h3 className="text-base font-semibold">Tasas de cambio</h3>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            No se pudo obtener las tasas automáticamente. Ingresalas manualmente para que la app pueda calcular los montos.
          </p>

          {/* Official rate */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tasa Oficial (BCV)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej: 1450.00"
              value={official}
              onChange={(e) => { setOfficial(e.target.value); setError("") }}
              className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* P2P rate */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tasa USDT (P2P)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej: 1570.00"
              value={p2p}
              onChange={(e) => { setP2p(e.target.value); setError("") }}
              className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar tasas"}
          </Button>
        </div>
      </div>
    </div>
  )
}
