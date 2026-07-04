import { useState, useEffect, useRef, useCallback } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import CategorySelect from "./CategorySelect"
import WysiwygEditor from "@/components/WysiwygEditor"
import { GetCurrentExchangeRates } from "../../../../wailsjs/go/main/App"

type CurrencyType = "bs" | "usd_bcv" | "usdt"

interface ExchangeRates {
  official: number
  p2p: number
}

export interface TransactionForm {
  type: "income" | "expense"
  description: string
  amount_bs: number
  amount_usd_bcv: number
  amount_usdt: number
  rate_official: number
  rate_p2p: number
  category_id: number | null
  date: string
}

export interface EditingTransaction {
  id: number
  type: "income" | "expense"
  description: string
  amount_bs: number
  amount_usd_bcv: number
  amount_usdt: number
  rate_official: number
  rate_p2p: number
  category_id: number | null
  date: string
}

interface FormErrors {
  description?: string
  amount?: string
}

interface TransactionDialogProps {
  open: boolean
  editingTransaction?: EditingTransaction | null
  onClose: () => void
  onSave: (data: TransactionForm) => Promise<void>
  saving: boolean
}

function todayStr(): string {
  const now = new Date()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${m}-${d}`
}

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const currencyLabels: Record<CurrencyType, string> = {
  bs: "Bs",
  usd_bcv: "USD BCV",
  usdt: "USDT",
}

function todayParts(): { year: string; month: number; day: number } {
  const now = new Date()
  return {
    year: String(now.getFullYear()),
    month: now.getMonth(),
    day: now.getDate(),
  }
}

function dateFromParts(year: string, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0")
  const d = String(day).padStart(2, "0")
  return `${year}-${m}-${d}`
}

function daysInMonth(year: string, month: number): number {
  return new Date(Number(year), month + 1, 0).getDate()
}

export default function TransactionDialog({
  open,
  editingTransaction,
  onClose,
  onSave,
  saving,
}: TransactionDialogProps) {
  const initParts = todayParts()
  const [type, setType] = useState<"income" | "expense">("expense")
  const [description, setDescription] = useState("")
  const [currency, setCurrency] = useState<CurrencyType>("bs")
  const [amountInput, setAmountInput] = useState("")
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [dateYear, setDateYear] = useState(initParts.year)
  const [dateMonth, setDateMonth] = useState(initParts.month)
  const [dateDay, setDateDay] = useState(initParts.day)
  const [errors, setErrors] = useState<FormErrors>({})
  const [rates, setRates] = useState<ExchangeRates | null>(null)
  const [ratesLoading, setRatesLoading] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Fetch exchange rates
  const fetchRates = useCallback(async () => {
    setRatesLoading(true)
    try {
      const result = await GetCurrentExchangeRates()
      setRates(result)
    } catch {
      // Silently fail
    } finally {
      setRatesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) fetchRates()
  }, [open, fetchRates])

  // Parse input amount
  const inputAmount = parseFloat(amountInput) || 0

  // Calculate converted amounts based on selected currency
  const calcAmounts = useCallback(() => {
    const ro = rates?.official ?? 0
    const rp = rates?.p2p ?? 0
    let bs = 0, usd = 0, usdt = 0

    if (ro <= 0 || rp <= 0) {
      // No rates available — can't convert
      return { bs: 0, usd: 0, usdt: 0 }
    }

    switch (currency) {
      case "bs":
        bs = inputAmount
        usd = inputAmount / ro
        usdt = inputAmount / rp
        break
      case "usd_bcv":
        usd = inputAmount
        bs = inputAmount * ro
        usdt = (inputAmount * ro) / rp
        break
      case "usdt":
        usdt = inputAmount
        bs = inputAmount * rp
        usd = (inputAmount * rp) / ro
        break
    }
    return { bs, usd, usdt }
  }, [inputAmount, currency, rates])

  const { bs: calcBs, usd: calcUsd, usdt: calcUsdt } = calcAmounts()

  // Reset or pre-fill form on open
  useEffect(() => {
    if (open && editingTransaction) {
      const [y, m, d] = editingTransaction.date.split("-")
      setType(editingTransaction.type)
      setDescription(editingTransaction.description)
      setCurrency("bs")
      setAmountInput(String(editingTransaction.amount_bs))
      setCategoryId(editingTransaction.category_id)
      setDateYear(y)
      setDateMonth(Number(m) - 1)
      setDateDay(Number(d))
      setErrors({})
    } else if (open) {
      const p = todayParts()
      setType("expense")
      setDescription("")
      setCurrency("bs")
      setAmountInput("")
      setCategoryId(null)
      setDateYear(p.year)
      setDateMonth(p.month)
      setDateDay(p.day)
      setErrors({})
    }
  }, [open, editingTransaction])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  // Close on click outside
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

  const validate = (): boolean => {
    const errs: FormErrors = {}
    if (!description.trim()) errs.description = "La descripción es obligatoria"
    if (inputAmount <= 0) errs.amount = "El monto debe ser mayor a 0"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    await onSave({
      type,
      description: description.trim(),
      amount_bs: calcBs,
      amount_usd_bcv: calcUsd,
      amount_usdt: calcUsdt,
      rate_official: rates?.official ?? 0,
      rate_p2p: rates?.p2p ?? 0,
      category_id: categoryId,
      date: dateFromParts(dateYear, dateMonth, dateDay),
    })
  }

  const ro = rates?.official ?? 0
  const rp = rates?.p2p ?? 0
  const hasRates = ro > 0 && rp > 0

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80">
      <div
        ref={dialogRef}
        className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="text-base font-semibold">{editingTransaction ? "Editar Transacción" : "Nueva Transacción"}</h3>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type selector — expense = red, income = green */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Tipo</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === "expense" ? "destructive" : "secondary"}
                size="sm"
                onClick={() => { setType("expense"); setCategoryId(null) }}
                className="flex-1"
              >
                Gasto
              </Button>
              <Button
                type="button"
                variant={type === "income" ? "default" : "secondary"}
                size="sm"
                onClick={() => { setType("income"); setCategoryId(null) }}
                className="flex-1"
              >
                Ingreso
              </Button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="desc" className="text-sm font-medium mb-1.5 block">
              Descripción
            </label>
            <WysiwygEditor
              value={description}
              onChange={setDescription}
              placeholder="Ej: Sueldo de junio"
            />
            {errors.description && (
              <p className="text-xs text-destructive mt-1">{errors.description}</p>
            )}
          </div>

          {/* Amount — single input + currency selector */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Monto</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="h-8 flex-1 rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring"
              />
              <div className="flex gap-1">
                {(["bs", "usd_bcv", "usdt"] as CurrencyType[]).map((c) => (
                  <Button
                    key={c}
                    type="button"
                    variant={currency === c ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setCurrency(c)}
                    className="min-w-[60px]"
                  >
                    {currencyLabels[c]}
                  </Button>
                ))}
              </div>
            </div>
            {errors.amount && (
              <p className="text-xs text-destructive mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Converted amounts */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Equivalencias
              {ratesLoading && (
                <span className="text-xs text-muted-foreground ml-2">(cargando tasas...)</span>
              )}
              {!hasRates && !ratesLoading && (
                <span className="text-xs text-destructive ml-2">(tasas no disponibles)</span>
              )}
            </label>
            <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Bs</span>
                <span className={cn("font-mono font-medium tabular-nums", calcBs > 0 ? "text-foreground" : "text-muted-foreground")}>
                  {formatCurrency(calcBs, "VES")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">USD BCV</span>
                <span className={cn("font-mono font-medium tabular-nums", calcUsd > 0 ? "text-foreground" : "text-muted-foreground")}>
                  {formatCurrency(calcUsd, "USD")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">USDT</span>
                <span className={cn("font-mono font-medium tabular-nums", calcUsdt > 0 ? "text-foreground" : "text-muted-foreground")}>
                  {formatCurrency(calcUsdt, "USD")}
                </span>
              </div>
              {hasRates && (
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border mt-1">
                  <span>1 USD BCV = {formatCurrency(ro, "VES")}</span>
                  <span>1 USDT = {formatCurrency(rp, "VES")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="text-sm font-medium mb-1.5 block">
              Categoría
            </label>
            <CategorySelect
              txType={type}
              value={categoryId}
              onChange={setCategoryId}
            />
          </div>

          {/* Date — dropdowns */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Fecha</label>
            <div className="flex gap-2">
              <select
                value={dateDay}
                onChange={(e) => setDateDay(Number(e.target.value))}
                className="h-8 w-16 rounded-md border border-input bg-background text-foreground px-1 text-sm text-center cursor-pointer outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring"
              >
                {Array.from({ length: daysInMonth(dateYear, dateMonth) }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d} className="bg-background text-foreground">{String(d).padStart(2, "0")}</option>
                ))}
              </select>

              <select
                value={dateMonth}
                onChange={(e) => {
                  const newM = Number(e.target.value)
                  const maxDay = daysInMonth(dateYear, newM)
                  setDateMonth(newM)
                  if (dateDay > maxDay) setDateDay(maxDay)
                }}
                className="h-8 flex-1 rounded-md border border-input bg-background text-foreground px-1 text-sm cursor-pointer outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring"
              >
                {MONTHS_ES.map((name, i) => (
                  <option key={i} value={i} className="bg-background text-foreground">{name}</option>
                ))}
              </select>

              <select
                value={dateYear}
                onChange={(e) => {
                  const newY = e.target.value
                  const maxDay = daysInMonth(newY, dateMonth)
                  setDateYear(newY)
                  if (dateDay > maxDay) setDateDay(maxDay)
                }}
                className="h-8 w-20 rounded-md border border-input bg-background text-foreground px-1 text-sm text-center font-bold cursor-pointer outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring tabular-nums"
              >
                {Array.from({ length: 10 }, (_, i) => String(Number(dateYear) - 5 + i)).map((y) => (
                  <option key={y} value={y} className="bg-background text-foreground">{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
