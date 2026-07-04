import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, X, Check, PiggyBank, RefreshCw, FileDown } from "lucide-react"
import WysiwygEditor from "@/components/WysiwygEditor"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ListSavings,
  CreateSaving,
  UpdateSaving,
  DeleteSaving,
  GetSavingTotal,
  GetCurrentExchangeRates,
  ExportSavingsToExcel,
} from "../../../wailsjs/go/main/App"

interface SavingItem {
  id: number
  description: string
  amount_bs: number
  amount_usd: number
  created_at: string
}

interface SavingTotal {
  total_bs: number
  total_usd: number
}

interface ExchangeRates {
  official: number
  p2p: number
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value)
}

function formatBs(value: number): string {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "VES",
    minimumFractionDigits: 2,
  }).format(value)
}

export default function SavingsPage() {
  const [savings, setSavings] = useState<SavingItem[]>([])
  const [total, setTotal] = useState<SavingTotal | null>(null)
  const [loading, setLoading] = useState(true)
  const [rates, setRates] = useState<ExchangeRates | null>(null)
  const [ratesLoading, setRatesLoading] = useState(false)

  // Create form
  const [createOpen, setCreateOpen] = useState(false)
  const [newDesc, setNewDesc] = useState("")
  const [newUsd, setNewUsd] = useState("")
  const [creating, setCreating] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDesc, setEditDesc] = useState("")
  const [editUsd, setEditUsd] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchRates = useCallback(async () => {
    setRatesLoading(true)
    try {
      const r = await GetCurrentExchangeRates()
      setRates(r)
    } catch {
      // fallback silent
    } finally {
      setRatesLoading(false)
    }
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [savingsList, totalRes] = await Promise.all([
        ListSavings(),
        GetSavingTotal(),
      ])
      setSavings(savingsList ?? [])
      setTotal(totalRes)
    } catch (err) {
      console.error("Failed to load savings:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll(); fetchRates() }, [])

  // Auto-calculated Bs values
  const parsedUsd = parseFloat(newUsd) || 0
  const rateOfficial = rates?.official ?? 0
  const rateP2P = rates?.p2p ?? 0
  const bsBcv = parsedUsd * rateOfficial
  const bsUsdt = parsedUsd * rateP2P

  const handleCreate = async () => {
    if (!newDesc.trim() || parsedUsd <= 0) return
    setCreating(true)
    try {
      await CreateSaving(newDesc.trim(), bsBcv, parsedUsd)
      setNewDesc(""); setNewUsd("")
      setCreateOpen(false)
      await fetchAll()
    } catch (err) {
      console.error("Failed to create saving:", err)
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (s: SavingItem) => {
    setEditingId(s.id)
    setEditDesc(s.description)
    setEditUsd(String(s.amount_usd))
  }

  const cancelEdit = () => setEditingId(null)

  const parsedEditUsd = parseFloat(editUsd) || 0
  const editBsBcv = parsedEditUsd * rateOfficial

  const handleUpdate = async (id: number) => {
    if (!editDesc.trim() || parsedEditUsd <= 0) return
    setSaving(true)
    try {
      await UpdateSaving(id, editDesc.trim(), editBsBcv, parsedEditUsd)
      setEditingId(null)
      await fetchAll()
    } catch (err) {
      console.error("Failed to update saving:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, desc: string) => {
      const plainDesc = desc.replace(/<[^>]*>/g, '')
      if (!window.confirm(`¿Eliminar el ahorro "${plainDesc}"?`)) return
    try {
      await DeleteSaving(id)
      await fetchAll()
    } catch (err) {
      console.error("Failed to delete saving:", err)
    }
  }

  const hasRates = rateOfficial > 0 && rateP2P > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <PiggyBank className="size-6 text-primary" />
            Ahorros
          </h2>
          <p className="text-sm text-muted-foreground">
            Registrá y administrá tus ahorros (no afecta ingresos/gastos)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => ExportSavingsToExcel().catch(console.error)}>
            <FileDown className="size-4 mr-1.5" />
            Exportar
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4 mr-1.5" />
            Nuevo ahorro
          </Button>
        </div>
      </div>

      {/* Global total */}
      {total && (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total ahorrado</p>
          <div className="flex items-baseline gap-4 flex-wrap">
            <span className="text-2xl font-bold text-chart-1">{formatUsd(total.total_usd)}</span>
            <span className="text-sm text-muted-foreground">
              ≈ {formatBs(total.total_bs)} (BCV)
            </span>
          </div>
        </div>
      )}

      {/* Create form */}
      {createOpen && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Nuevo ahorro</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[250px]">
              <label className="text-xs font-medium mb-1 block text-muted-foreground">Descripción</label>
              <WysiwygEditor
                value={newDesc}
                onChange={setNewDesc}
                placeholder="Ej: Fondo de emergencia"
              />
            </div>
            <div className="w-32">
              <label className="text-xs font-medium mb-1 block text-muted-foreground">Monto en USD</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newUsd}
                onChange={(e) => setNewUsd(e.target.value)}
                placeholder="0.00"
                className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring"
              />
            </div>
            <Button onClick={handleCreate} disabled={creating || !newDesc.trim() || parsedUsd <= 0} size="sm">
              {creating ? "Guardando..." : "Guardar"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>Cancelar</Button>
          </div>

          {/* Auto-converted amounts */}
          {parsedUsd > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span>USD: <strong className="text-foreground">{formatUsd(parsedUsd)}</strong></span>
              {hasRates && (
                <>
                  <span>→ Bs BCV: <strong className="text-foreground">{formatBs(bsBcv)}</strong></span>
                  <span>→ Bs USDT: <strong className="text-foreground">{formatBs(bsUsdt)}</strong></span>
                </>
              )}
              {!hasRates && !ratesLoading && (
                <span className="text-destructive">Tasas no disponibles</span>
              )}
              {ratesLoading && <span>Cargando tasas...</span>}
            </div>
          )}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : savings.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <PiggyBank className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No hay ahorros registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {savings.map((s) => {
            const listBsBcv = s.amount_usd * rateOfficial
            const listBsUsdt = s.amount_usd * rateP2P
            return (
              <div
                key={s.id}
                className="rounded-lg border border-border bg-card px-4 py-3 flex items-center justify-between group"
              >
                {editingId === s.id ? (
                  /* Edit mode */
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-1">
                      <WysiwygEditor
                        value={editDesc}
                        onChange={setEditDesc}
                        placeholder="Descripción"
                        minHeight={60}
                      />
                    </div>
                    <div className="w-28">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editUsd}
                        onChange={(e) => setEditUsd(e.target.value)}
                        className="h-7 w-full rounded-md border border-input bg-background px-2 text-sm text-right focus:outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring"
                      />
                      {hasRates && parsedEditUsd > 0 && (
                        <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                          Bs {editBsBcv.toFixed(2)} / Bs {(parsedEditUsd * rateP2P).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon-xs" onClick={() => handleUpdate(s.id)} disabled={saving || !editDesc.trim() || parsedEditUsd <= 0} className="text-primary">
                      <Check className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={cancelEdit}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <PiggyBank className="size-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" dangerouslySetInnerHTML={{ __html: s.description }} />
                        <p className="text-xs text-muted-foreground">{s.created_at}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">{formatUsd(s.amount_usd)}</p>
                        {hasRates && (
                          <p className="text-xs text-muted-foreground tabular-nums">
                            Bs {listBsBcv.toFixed(2)} / Bs {listBsUsdt.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon-xs" onClick={() => startEdit(s)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(s.id, s.description)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
