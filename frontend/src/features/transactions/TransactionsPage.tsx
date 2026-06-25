import { useState, useEffect, useCallback } from "react"
import { Plus, Lock, Unlock, FileDown, FileUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import TransactionFilters from "./components/TransactionFilters"
import TransactionList from "./components/TransactionList"
import TransactionDialog from "./components/TransactionDialog"
import type { TransactionForm, EditingTransaction } from "./components/TransactionDialog"
import {
  ListTransactions,
  CreateTransaction,
  UpdateTransaction,
  DeleteTransaction,
  CloseDay,
  IsDayClosed,
  ExportTransactionsToExcel,
  ImportTransactionsFromCSV,
} from "../../../wailsjs/go/main/App"
import { core } from "../../../wailsjs/go/models"

function currentMonth(): string {
  const now = new Date()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  return `${now.getFullYear()}-${m}`
}

function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split("-")
  const from = `${y}-${m}-01`
  const lastDay = new Date(Number(y), Number(m), 0).getDate()
  const to = `${y}-${m}-${String(lastDay).padStart(2, "0")}`
  return { from, to }
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<core.Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(currentMonth())
  const [txType, setTxType] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<EditingTransaction | null>(null)
  const [saving, setSaving] = useState(false)

  // Daily closure
  const today = new Date()
  const defaultDay = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`
  const [closeDate, setCloseDate] = useState(defaultDay)
  const [dayClosed, setDayClosed] = useState(false)
  const [closingDay, setClosingDay] = useState(false)

  useEffect(() => {
    IsDayClosed(closeDate).then(setDayClosed).catch(() => setDayClosed(false))
  }, [closeDate])

  const handleCloseDay = async () => {
    setClosingDay(true)
    try {
      await CloseDay(closeDate)
      setDayClosed(true)
    } catch (err) {
      console.error("Failed to close day:", err)
    } finally {
      setClosingDay(false)
    }
  }

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const { from, to } = monthRange(month)
      const type = txType === "all" ? "" : txType
      const result = await ListTransactions(from, to, type)
      setTransactions(result ?? [])
    } catch (err) {
      console.error("Failed to load transactions:", err)
    } finally {
      setLoading(false)
    }
  }, [month, txType])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
    setEditingTx(null)
  }, [])

  const handleSave = async (data: TransactionForm) => {
    setSaving(true)
    try {
      if (editingTx) {
        await UpdateTransaction(
          editingTx.id,
          data.type,
          data.description,
          data.amount_bs,
          data.amount_usd_bcv,
          data.amount_usdt,
          data.rate_official,
          data.rate_p2p,
          data.category_id,
          data.date
        )
      } else {
        await CreateTransaction(
          data.type,
          data.description,
          data.amount_bs,
          data.amount_usd_bcv,
          data.amount_usdt,
          data.rate_official,
          data.rate_p2p,
          data.category_id,
          data.date
        )
      }
      closeDialog()
      await fetchTransactions()
    } catch (err) {
      console.error("Failed to save transaction:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar esta transacción?")) return
    try {
      await DeleteTransaction(id)
      await fetchTransactions()
    } catch (err) {
      console.error("Failed to delete transaction:", err)
    }
  }

  const handleExport = async () => {
    try {
      const { from, to } = monthRange(month)
      const type = txType === "all" ? "" : txType
      const path = await ExportTransactionsToExcel(from, to, type)
      if (path) {
        console.log("Exported to:", path)
      }
    } catch (err) {
      console.error("Failed to export:", err)
    }
  }

  const handleEdit = (tx: core.Transaction) => {
    setEditingTx({
      id: tx.id,
      type: tx.type as "income" | "expense",
      description: tx.description,
      amount_bs: tx.amount_bs,
      amount_usd_bcv: tx.amount_usd_bcv,
      amount_usdt: tx.amount_usdt,
      rate_official: tx.rate_official,
      rate_p2p: tx.rate_p2p,
      category_id: tx.category_id ?? null,
      date: tx.date,
    })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transacciones</h2>
          <p className="text-sm text-muted-foreground">
            Registra y administra tus ingresos y gastos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => ImportTransactionsFromCSV().catch(console.error)}>
            <FileUp className="size-4 mr-1.5" />
            Importar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileDown className="size-4 mr-1.5" />
            Exportar
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4 mr-2" />
            Nueva Transacción
          </Button>
        </div>
      </div>

      {/* Filters */}
      <TransactionFilters
        month={month}
        txType={txType}
        onMonthChange={setMonth}
        onTypeChange={setTxType}
      />

      {/* Daily closure */}
      <div className="flex items-center gap-3 flex-wrap rounded-lg border border-border bg-card px-4 py-2.5">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Cierre diario</span>
        <input
          type="date"
          value={closeDate}
          onChange={(e) => setCloseDate(e.target.value)}
          className="h-7 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring"
        />
        <Button
          size="xs"
          variant={dayClosed ? "secondary" : "default"}
          disabled={dayClosed || closingDay}
          onClick={handleCloseDay}
        >
          {dayClosed ? (
            <><Lock className="size-3 mr-1" /> Cerrado</>
          ) : (
            <><Unlock className="size-3 mr-1" /> Cerrar día</>
          )}
        </Button>
        {closingDay && <span className="text-xs text-muted-foreground">Cerrando...</span>}
      </div>

      {/* Transaction count */}
      {!loading && (
        <p className="text-xs text-muted-foreground">
          {transactions.length} transacción{transactions.length !== 1 ? "es" : ""}
        </p>
      )}

      {/* Table */}
      <TransactionList
        transactions={transactions}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Dialog */}
      <TransactionDialog
        open={dialogOpen}
        editingTransaction={editingTx}
        onClose={closeDialog}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  )
}
