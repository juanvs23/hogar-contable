import { useState, useEffect } from "react"
import { Plus, PiggyBank, TrendingUp, TrendingDown, Eye, EyeOff, FileDown, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  CreateSavingAccount,
  ListSavingAccounts,
  UpdateSavingAccount,
  DeleteSavingAccount,
  DepositToAccount,
  WithdrawFromAccount,
  ListAccountMovements,
  UpdateSavingMovement,
  DeleteSavingMovement,
  ExportSavingsToExcel,
  GetCurrentExchangeRates,
  ListCategories,
} from "../../../wailsjs/go/main/App"
import { core } from "../../../wailsjs/go/models"
import WysiwygEditor from "@/components/WysiwygEditor"

type AccountBalance = core.AccountBalance
type Movement = core.SavingMovement

function formatUsd(v: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v) }
function formatBs(v: number) { return new Intl.NumberFormat("es-VE", { style: "currency", currency: "VES", minimumFractionDigits: 2 }).format(v) }

export default function SavingsPage() {
  const [accounts, setAccounts] = useState<AccountBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [movements, setMovements] = useState<Movement[]>([])
  const [rates, setRates] = useState<{ official: number; p2p: number } | null>(null)
  const [incomeCategories, setIncomeCategories] = useState<{ id: number; name: string }[]>([])

  // Create account
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [creating, setCreating] = useState(false)

  // Deposit/Withdraw dialog
  const [movAccId, setMovAccId] = useState<number | null>(null)
  const [movType, setMovType] = useState<"deposit" | "withdraw">("deposit")
  const [movUsd, setMovUsd] = useState("")
  const [movDesc, setMovDesc] = useState("")
  const [movAsIncome, setMovAsIncome] = useState(false)
  const [movIncomeCat, setMovIncomeCat] = useState<number | null>(null)
  const [processingMov, setProcessingMov] = useState(false)

  // Edit movement
  const [editMov, setEditMov] = useState<Movement | null>(null)
  const [editMovUsd, setEditMovUsd] = useState("")
  const [editMovDesc, setEditMovDesc] = useState("")
  const [savingMov, setSavingMov] = useState(false)

  // Edit account
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [accs, r, cats] = await Promise.all([
        ListSavingAccounts(),
        GetCurrentExchangeRates().catch(() => null),
        ListCategories("income"),
      ])
      setAccounts(accs ?? [])
      setRates(r)
      setIncomeCategories(cats ?? [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const loadMovements = async (accId: number) => {
    if (expandedId === accId) { setExpandedId(null); return }
    setExpandedId(accId)
    try {
      const movs = await ListAccountMovements(accId)
      setMovements(movs ?? [])
    } catch (err) { console.error(err) }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await CreateSavingAccount(newName.trim(), newDesc)
      setNewName(""); setNewDesc(""); setShowCreate(false)
      await fetchAll()
    } catch (err) { console.error(err) }
    finally { setCreating(false) }
  }

  const handleMovement = async () => {
    if (!movAccId || !parseFloat(movUsd)) return
    setProcessingMov(true)
    try {
      const usd = parseFloat(movUsd)
      const bs = rates?.official ? usd * rates.official : 0
      if (movType === "deposit") {
        await DepositToAccount(movAccId, usd, bs, movDesc)
      } else {
        await WithdrawFromAccount(movAccId, usd, bs, movDesc, movAsIncome, movAsIncome ? movIncomeCat : null)
      }
      setMovUsd(""); setMovDesc(""); setMovAccId(null); setMovAsIncome(false)
      await fetchAll()
      if (expandedId) loadMovements(expandedId)
    } catch (err) { console.error(err) }
    finally { setProcessingMov(false) }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar la cuenta "${name}" y todos sus movimientos?`)) return
    try { await DeleteSavingAccount(id); await fetchAll() }
    catch (err) { console.error(err) }
  }

  const totalUsd = accounts.reduce((s, a) => s + a.balance_usd, 0)
  const totalBs = accounts.reduce((s, a) => s + a.balance_bs, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><PiggyBank className="size-5 text-primary" /> Ahorros</h2>
          <p className="text-xs text-muted-foreground">Cuentas, depósitos y retiros</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="xs" onClick={() => ExportSavingsToExcel().catch(console.error)}><FileDown className="size-3.5 mr-1" />Exportar</Button>
          <Button size="xs" onClick={() => setShowCreate(true)}><Plus className="size-3.5 mr-1" />Nueva cuenta</Button>
        </div>
      </div>

      {/* Total global */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Total ahorrado</p>
        <p className="text-2xl font-bold text-chart-1">{formatUsd(totalUsd)}</p>
        <p className="text-xs text-muted-foreground">{formatBs(totalBs)}</p>
      </div>

      {/* Create account form */}
      {showCreate && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">Nueva cuenta de ahorro</h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium mb-0.5 block text-muted-foreground">Nombre</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Banco A" className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium mb-0.5 block text-muted-foreground">Descripción</label>
              <input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Opcional" className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring" />
            </div>
            <div className="flex items-end gap-2">
              <Button size="sm" onClick={handleCreate} disabled={creating || !newName.trim()}>{creating ? "Creando..." : "Crear"}</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Accounts list */}
      {loading ? (
        <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}</div>
      ) : accounts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <PiggyBank className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No hay cuentas. Creá una para empezar.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map(ab => {
            const isExpanded = expandedId === ab.account.id
            const accMovs = isExpanded ? movements : []
            return (
              <div key={ab.account.id} className="rounded-lg border border-border bg-card">
                {/* Account header */}
                <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => loadMovements(ab.account.id)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <PiggyBank className="size-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{ab.account.name}</p>
                      {ab.account.description && <p className="text-xs text-muted-foreground truncate">{ab.account.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">{formatUsd(ab.balance_usd)}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">{formatBs(ab.balance_bs)}</p>
                    </div>
                    {isExpanded ? <EyeOff className="size-4 text-muted-foreground" /> : <Eye className="size-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* Expanded: movements + actions */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 space-y-3">
                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <Button size="xs" variant="default" onClick={(e) => { e.stopPropagation(); setMovAccId(ab.account.id); setMovType("deposit") }}>
                        <TrendingUp className="size-3 mr-1" /> Depositar
                      </Button>
                      <Button size="xs" variant="destructive" onClick={(e) => { e.stopPropagation(); setMovAccId(ab.account.id); setMovType("withdraw") }}>
                        <TrendingDown className="size-3 mr-1" /> Retirar
                      </Button>
                      <Button size="xs" variant="ghost" onClick={async (e) => { e.stopPropagation(); setEditId(ab.account.id); setEditName(ab.account.name); setEditDesc(ab.account.description ?? "") }}>
                        <Pencil className="size-3 mr-1" /> Editar
                      </Button>
                      <Button size="xs" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(ab.account.id, ab.account.name) }}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>

                    {/* Edit form inline */}
                    {editId === ab.account.id && (
                      <div className="flex gap-2 items-start" onClick={e => e.stopPropagation()}>
                        <div className="flex-1 space-y-1">
                          <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="h-7 w-full rounded border border-input bg-background px-2 text-sm" />
                          <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} className="h-7 w-full rounded border border-input bg-background px-2 text-sm" />
                        </div>
                        <Button size="xs" onClick={async () => { await UpdateSavingAccount(ab.account.id, editName, editDesc); setEditId(null); await fetchAll() }}>Guardar</Button>
                        <Button size="xs" variant="ghost" onClick={() => setEditId(null)}>X</Button>
                      </div>
                    )}

                    {/* Movements list */}
                    {accMovs.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">Sin movimientos</p>
                    ) : (
                      <div className="space-y-1 max-h-60 overflow-y-auto">
                        {accMovs.map(m => (
                          <div key={m.id} className="group flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className={cn("inline-block w-1.5 h-1.5 rounded-full shrink-0", m.type === "deposit" ? "bg-chart-2" : "bg-destructive")} />
                              <span className="truncate" dangerouslySetInnerHTML={{ __html: m.description || (m.type === "deposit" ? "Depósito" : "Retiro") }} />
                              {m.created_transaction_id && <span className="text-[10px] text-chart-2 font-medium shrink-0">→ Ingreso</span>}
                            </div>
                            <span className={cn("tabular-nums font-medium whitespace-nowrap ml-2", m.type === "deposit" ? "text-chart-2" : "text-destructive")}>
                              {m.type === "deposit" ? "+" : "-"}{formatUsd(m.amount_usd)}
                            </span>
                            <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon-xs" onClick={async (e) => { e.stopPropagation(); setEditMov(m); setEditMovUsd(String(m.amount_usd)); setEditMovDesc(m.description) }}><Pencil className="size-2.5" /></Button>
                              <Button variant="ghost" size="icon-xs" className="text-destructive" onClick={async (e) => { e.stopPropagation(); const plainDesc = (m.description || '').replace(/<[^>]*>/g, ''); if (window.confirm(`¿Eliminar "${plainDesc || (m.type === 'deposit' ? 'depósito' : 'retiro')}"?`)) { await DeleteSavingMovement(m.id); loadMovements(ab.account.id); await fetchAll() } }}><Trash2 className="size-2.5" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Deposit/Withdraw dialog */}
      {movAccId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80" onClick={() => setMovAccId(null)}>
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">{movType === "deposit" ? "Depositar" : "Retirar"}</h3>
              <Button variant="ghost" size="icon-xs" onClick={() => setMovAccId(null)}><Trash2 className="size-3.5" /></Button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium mb-0.5 block text-muted-foreground">Monto USD</label>
                <input type="number" step="0.01" min="0" value={movUsd} onChange={e => setMovUsd(e.target.value)} placeholder="0.00" className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring" />
              </div>
              <div>
                <label className="text-xs font-medium mb-0.5 block text-muted-foreground">Descripción</label>
                <WysiwygEditor value={movDesc} onChange={setMovDesc} placeholder="Opcional" minHeight={50} />
              </div>

              {movType === "withdraw" && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={movAsIncome} onChange={e => setMovAsIncome(e.target.checked)} className="rounded border-border" />
                  <span className="text-xs text-muted-foreground">Agregar como ingreso en Transacciones</span>
                </label>
              )}

              {movAsIncome && (
                <div>
                  <label className="text-xs font-medium mb-0.5 block text-muted-foreground">Categoría del ingreso</label>
                  <select value={movIncomeCat ?? ""} onChange={e => setMovIncomeCat(e.target.value ? Number(e.target.value) : null)} className="h-8 w-full rounded-md border border-input bg-background text-foreground px-2 text-sm">
                    <option value="" className="bg-background text-foreground">Sin categoría</option>
                    {incomeCategories.map(c => <option key={c.id} value={c.id} className="bg-background text-foreground">{c.name}</option>)}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="xs" onClick={() => setMovAccId(null)}>Cancelar</Button>
                <Button size="xs" variant={movType === "deposit" ? "default" : "destructive"} onClick={handleMovement} disabled={processingMov || !parseFloat(movUsd)}>
                  {processingMov ? "Procesando..." : movType === "deposit" ? "Depositar" : "Retirar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit movement dialog */}
      {editMov && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80" onClick={() => setEditMov(null)}>
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">Editar movimiento</h3>
              <Button variant="ghost" size="icon-xs" onClick={() => setEditMov(null)}><Trash2 className="size-3.5" /></Button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium mb-0.5 block text-muted-foreground">Monto USD</label>
                <input type="number" step="0.01" value={editMovUsd} onChange={e => setEditMovUsd(e.target.value)} className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring" />
              </div>
              <div>
                <label className="text-xs font-medium mb-0.5 block text-muted-foreground">Descripción</label>
                <WysiwygEditor value={editMovDesc} onChange={setEditMovDesc} minHeight={50} />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="xs" onClick={() => setEditMov(null)}>Cancelar</Button>
                <Button size="xs" onClick={async () => {
                  setSavingMov(true)
                  try {
                    const bs = rates?.official ? parseFloat(editMovUsd) * rates.official : 0
                    await UpdateSavingMovement(editMov.id, parseFloat(editMovUsd), bs, editMovDesc)
                    setEditMov(null)
                    if (expandedId) loadMovements(expandedId)
                    await fetchAll()
                  } catch (err) { console.error(err) }
                  finally { setSavingMov(false) }
                }} disabled={savingMov || !parseFloat(editMovUsd)}>{savingMov ? "Guardando..." : "Guardar"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
