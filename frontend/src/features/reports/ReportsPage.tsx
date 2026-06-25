import { useState, useEffect, useCallback } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Lock, Unlock, TrendingUp, TrendingDown, Award, FileDown, Database } from "lucide-react"
import {
  GetMonthlySummary,
  GetYearlySummary,
  GetExpensesByCategory,
  GetIncomeByCategory,
  CloseMonth,
  IsMonthClosed,
  ExportReportToExcel,
  BackupDatabase,
} from "../../../wailsjs/go/main/App"
import { service, core } from "../../../wailsjs/go/models"

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

function CompareRow({ label, valA, valB, format }: { label: string; valA: number; valB: number; format: (v: number) => string }) {
  const diff = valB - valA
  const pct = valA !== 0 ? ((valB - valA) / valA * 100) : 0
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2 pr-4 text-muted-foreground">{label}</td>
      <td className="py-2 px-3 text-right tabular-nums font-medium">{format(valA)}</td>
      <td className="py-2 px-3 text-right tabular-nums font-medium">{format(valB)}</td>
      <td className={cn(
        "py-2 pl-3 text-right tabular-nums font-semibold whitespace-nowrap",
        diff > 0 ? "text-chart-2" : diff < 0 ? "text-destructive" : "text-muted-foreground"
      )}>
        {diff > 0 ? "+" : ""}{format(diff)}
        <span className="text-xs ml-1 font-normal">
          ({pct > 0 ? "+" : ""}{pct.toFixed(1)}%)
        </span>
      </td>
    </tr>
  )
}

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export default function ReportsPage() {
  const now = new Date()
  const [selYear, setSelYear] = useState(String(now.getFullYear()))
  const [selMonth, setSelMonth] = useState(now.getMonth()) // 0-indexed
  const [summary, setSummary] = useState<service.MonthlySummary | null>(null)
  const [yearlySummary, setYearlySummary] = useState<service.MonthlySummary | null>(null)
  const [expenseCats, setExpenseCats] = useState<core.CategoryTotal[]>([])
  const [incomeCats, setIncomeCats] = useState<core.CategoryTotal[]>([])
  const [closed, setClosed] = useState(false)
  const [closing, setClosing] = useState(false)

  // Comparison mode
  const [compareMode, setCompareMode] = useState(false)
  const [compareType, setCompareType] = useState<"months" | "years">("months")
  // Month comparison
  const [cmpYearA, setCmpYearA] = useState("2024")
  const [cmpMonthA, setCmpMonthA] = useState(3)
  const [cmpYearB, setCmpYearB] = useState("2025")
  const [cmpMonthB, setCmpMonthB] = useState(6)
  const [cmpSummaryA, setCmpSummaryA] = useState<service.MonthlySummary | null>(null)
  const [cmpSummaryB, setCmpSummaryB] = useState<service.MonthlySummary | null>(null)
  // Year comparison
  const [cmpYearOnlyA, setCmpYearOnlyA] = useState("2020")
  const [cmpYearOnlyB, setCmpYearOnlyB] = useState("2026")
  const [cmpYearSummaryA, setCmpYearSummaryA] = useState<service.MonthlySummary | null>(null)
  const [cmpYearSummaryB, setCmpYearSummaryB] = useState<service.MonthlySummary | null>(null)

  const cmpMStrA = String(cmpMonthA + 1).padStart(2, "0")
  const cmpMStrB = String(cmpMonthB + 1).padStart(2, "0")

  const fetchComparison = useCallback(async () => {
    if (!compareMode) return
    if (compareType === "months") {
      const [a, b] = await Promise.all([
        GetMonthlySummary(cmpYearA, cmpMStrA),
        GetMonthlySummary(cmpYearB, cmpMStrB),
      ])
      setCmpSummaryA(a)
      setCmpSummaryB(b)
    } else {
      const [a, b] = await Promise.all([
        GetYearlySummary(cmpYearOnlyA),
        GetYearlySummary(cmpYearOnlyB),
      ])
      setCmpYearSummaryA(a)
      setCmpYearSummaryB(b)
    }
  }, [compareMode, compareType, cmpYearA, cmpMonthA, cmpYearB, cmpMonthB, cmpYearOnlyA, cmpYearOnlyB])

  useEffect(() => { fetchComparison() }, [fetchComparison])

  const mStr = String(selMonth + 1).padStart(2, "0")

  useEffect(() => {
    GetMonthlySummary(selYear, mStr).then(setSummary).catch(console.error)
    GetExpensesByCategory(selYear, mStr).then((r) => setExpenseCats(r ?? [])).catch(console.error)
    GetIncomeByCategory(selYear, mStr).then((r) => setIncomeCats(r ?? [])).catch(console.error)
    GetYearlySummary(selYear).then(setYearlySummary).catch(console.error)
    IsMonthClosed(selYear, mStr).then(setClosed).catch(console.error)
  }, [selYear, selMonth])

  const handleCloseMonth = async () => {
    setClosing(true)
    try {
      await CloseMonth(selYear, mStr)
      setClosed(true)
      const [res, closedRes] = await Promise.all([
        GetMonthlySummary(selYear, mStr),
        IsMonthClosed(selYear, mStr),
      ])
      setSummary(res)
      setClosed(closedRes)
    } catch (err) {
      console.error("Failed to close month:", err)
    } finally {
      setClosing(false)
    }
  }

  // Sort categories by USD descending (fallback to Bs if USD is 0)
  const catValue = (c: core.CategoryTotal) => c.total_usd > 0 ? c.total_usd : c.total_bs
  const sortedExpenses = [...expenseCats].filter((c) => c.total_usd > 0 || c.total_bs > 0).sort((a, b) => catValue(b) - catValue(a))
  const sortedIncome = [...incomeCats].filter((c) => c.total_usd > 0 || c.total_bs > 0).sort((a, b) => catValue(b) - catValue(a))
  const topExpense = sortedExpenses[0] ?? null

  // Display value helper: prefer USD, fallback to Bs
  const displayValue = (cat: core.CategoryTotal): string =>
    cat.total_usd > 0 ? formatUsd(cat.total_usd) : formatBs(cat.total_bs)

  const isUsd = (cat: core.CategoryTotal): boolean => cat.total_usd > 0

  // Bar chart data (prefer USD, fallback to Bs)
  const hasUsd = (summary?.total_income_usd ?? 0) > 0 || (summary?.total_expenses_usd ?? 0) > 0
  const barData = summary
    ? [
        { name: "Ingresos", monto: hasUsd ? summary.total_income_usd : summary.total_income_bs, isUsd },
        { name: "Gastos", monto: hasUsd ? summary.total_expenses_usd : summary.total_expenses_bs, isUsd },
      ]
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reportes</h2>
          <p className="text-sm text-muted-foreground">
            Resumen financiero mensual y anual
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selMonth}
            onChange={(e) => setSelMonth(Number(e.target.value))}
            className="h-8 rounded-md border border-input bg-background text-foreground px-2 text-sm font-medium cursor-pointer outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring capitalize"
          >
            {MONTHS_ES.map((name, i) => (
              <option key={i} value={i} className="bg-background text-foreground">{name}</option>
            ))}
          </select>
          <select
            value={selYear}
            onChange={(e) => setSelYear(e.target.value)}
            className="h-8 rounded-md border border-input bg-background text-foreground px-2 text-sm font-bold cursor-pointer outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring tabular-nums"
          >
            {Array.from({ length: 10 }, (_, i) => String(Number(selYear) - 5 + i)).map((y) => (
              <option key={y} value={y} className="bg-background text-foreground">{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-chart-2" /> Ingresos
            </p>
            <p className="text-xl font-bold text-chart-2">{formatUsd(summary.total_income_usd)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatBs(summary.total_income_bs)}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="size-3.5 text-destructive" /> Gastos
            </p>
            <p className="text-xl font-bold text-destructive">{formatUsd(summary.total_expenses_usd)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatBs(summary.total_expenses_bs)}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Balance</p>
            <p className={`text-xl font-bold ${summary.balance_usd >= 0 ? "text-chart-1" : "text-destructive"}`}>
              {formatUsd(summary.balance_usd)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatBs(summary.balance_bs)}</p>
          </div>
        </div>
      )}

      {/* Close month */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleCloseMonth}
          disabled={closed || closing}
          variant={closed ? "secondary" : "default"}
          size="sm"
        >
          {closed ? (
            <><Lock className="size-3.5 mr-1.5" /> Mes cerrado</>
          ) : (
            <><Unlock className="size-3.5 mr-1.5" /> Cerrar mes</>
          )}
        </Button>
        {closing && <span className="text-xs text-muted-foreground">Cerrando...</span>}
        <Button variant="outline" size="sm" onClick={() => ExportReportToExcel(selYear, mStr).catch(console.error)}>
          <FileDown className="size-4 mr-1.5" />
          Exportar
        </Button>
        <Button variant="outline" size="sm" onClick={() => BackupDatabase().catch(console.error)}>
          <Database className="size-4 mr-1.5" />
          Backup
        </Button>
      </div>

      {/* Comparar */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Comparar</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCompareMode(!compareMode)}
          >
            {compareMode ? "Ocultar" : "Comparar"}
          </Button>
        </div>

        {compareMode && (
          <div className="space-y-4">
            {/* Tabs: meses / años */}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant={compareType === "months" ? "default" : "secondary"}
                size="sm"
                onClick={() => setCompareType("months")}
              >
                Comparar meses
              </Button>
              <Button
                type="button"
                variant={compareType === "years" ? "default" : "secondary"}
                size="sm"
                onClick={() => setCompareType("years")}
              >
                Comparar años
              </Button>
            </div>

            {compareType === "months" ? (
              /* ---- Comparar meses ---- */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-md border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground font-medium mb-2">Mes A</p>
                    <div className="flex items-center gap-2">
                      <select value={cmpMonthA} onChange={(e) => setCmpMonthA(Number(e.target.value))}
                        className="h-7 flex-1 rounded-md border border-input bg-background text-foreground px-1 text-sm cursor-pointer outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring capitalize">
                        {MONTHS_ES.map((name, i) => (<option key={i} value={i} className="bg-background text-foreground">{name}</option>))}
                      </select>
                      <select value={cmpYearA} onChange={(e) => setCmpYearA(e.target.value)}
                        className="h-7 w-20 rounded-md border border-input bg-background text-foreground px-1 text-sm font-bold text-center cursor-pointer outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring tabular-nums">
                        {Array.from({ length: 10 }, (_, i) => String(Number(cmpYearA) - 5 + i)).map((y) => (<option key={y} value={y} className="bg-background text-foreground">{y}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="rounded-md border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground font-medium mb-2">Mes B</p>
                    <div className="flex items-center gap-2">
                      <select value={cmpMonthB} onChange={(e) => setCmpMonthB(Number(e.target.value))}
                        className="h-7 flex-1 rounded-md border border-input bg-background text-foreground px-1 text-sm cursor-pointer outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring capitalize">
                        {MONTHS_ES.map((name, i) => (<option key={i} value={i} className="bg-background text-foreground">{name}</option>))}
                      </select>
                      <select value={cmpYearB} onChange={(e) => setCmpYearB(e.target.value)}
                        className="h-7 w-20 rounded-md border border-input bg-background text-foreground px-1 text-sm font-bold text-center cursor-pointer outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring tabular-nums">
                        {Array.from({ length: 10 }, (_, i) => String(Number(cmpYearB) - 5 + i)).map((y) => (<option key={y} value={y} className="bg-background text-foreground">{y}</option>))}
                      </select>
                    </div>
                  </div>
                </div>

                {(cmpSummaryA || cmpSummaryB) && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs text-muted-foreground">
                          <th className="text-left py-2 pr-4 font-medium">Concepto</th>
                          <th className="text-right py-2 px-3 font-medium">{MONTHS_ES[cmpMonthA]} {cmpYearA}</th>
                          <th className="text-right py-2 px-3 font-medium">{MONTHS_ES[cmpMonthB]} {cmpYearB}</th>
                          <th className="text-right py-2 pl-3 font-medium">Diferencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        <CompareRow label="Ingresos" valA={cmpSummaryA?.total_income_usd ?? 0} valB={cmpSummaryB?.total_income_usd ?? 0} format={formatUsd} />
                        <CompareRow label="Gastos" valA={cmpSummaryA?.total_expenses_usd ?? 0} valB={cmpSummaryB?.total_expenses_usd ?? 0} format={formatUsd} />
                        <CompareRow label="Balance" valA={cmpSummaryA?.balance_usd ?? 0} valB={cmpSummaryB?.balance_usd ?? 0} format={formatUsd} />
                        <tr className="border-t border-border"><td colSpan={4} className="py-2 text-xs text-muted-foreground">En bolívares</td></tr>
                        <CompareRow label="Ingresos (Bs)" valA={cmpSummaryA?.total_income_bs ?? 0} valB={cmpSummaryB?.total_income_bs ?? 0} format={formatBs} />
                        <CompareRow label="Gastos (Bs)" valA={cmpSummaryA?.total_expenses_bs ?? 0} valB={cmpSummaryB?.total_expenses_bs ?? 0} format={formatBs} />
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* ---- Comparar años ---- */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-md border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground font-medium mb-2">Año A</p>
                    <select value={cmpYearOnlyA} onChange={(e) => setCmpYearOnlyA(e.target.value)}
                      className="h-7 w-full rounded-md border border-input bg-background text-foreground px-2 text-sm font-bold text-center cursor-pointer outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring tabular-nums">
                      {Array.from({ length: 15 }, (_, i) => String(2026 - 14 + i)).map((y) => (<option key={y} value={y} className="bg-background text-foreground">{y}</option>))}
                    </select>
                  </div>
                  <div className="rounded-md border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground font-medium mb-2">Año B</p>
                    <select value={cmpYearOnlyB} onChange={(e) => setCmpYearOnlyB(e.target.value)}
                      className="h-7 w-full rounded-md border border-input bg-background text-foreground px-2 text-sm font-bold text-center cursor-pointer outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring tabular-nums">
                      {Array.from({ length: 15 }, (_, i) => String(2026 - 14 + i)).map((y) => (<option key={y} value={y} className="bg-background text-foreground">{y}</option>))}
                    </select>
                  </div>
                </div>

                {(cmpYearSummaryA || cmpYearSummaryB) && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs text-muted-foreground">
                          <th className="text-left py-2 pr-4 font-medium">Concepto</th>
                          <th className="text-right py-2 px-3 font-medium">{cmpYearOnlyA}</th>
                          <th className="text-right py-2 px-3 font-medium">{cmpYearOnlyB}</th>
                          <th className="text-right py-2 pl-3 font-medium">Diferencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        <CompareRow label="Ingresos" valA={cmpYearSummaryA?.total_income_usd ?? 0} valB={cmpYearSummaryB?.total_income_usd ?? 0} format={formatUsd} />
                        <CompareRow label="Gastos" valA={cmpYearSummaryA?.total_expenses_usd ?? 0} valB={cmpYearSummaryB?.total_expenses_usd ?? 0} format={formatUsd} />
                        <CompareRow label="Balance" valA={cmpYearSummaryA?.balance_usd ?? 0} valB={cmpYearSummaryB?.balance_usd ?? 0} format={formatUsd} />
                        <tr className="border-t border-border"><td colSpan={4} className="py-2 text-xs text-muted-foreground">En bolívares</td></tr>
                        <CompareRow label="Ingresos (Bs)" valA={cmpYearSummaryA?.total_income_bs ?? 0} valB={cmpYearSummaryB?.total_income_bs ?? 0} format={formatBs} />
                        <CompareRow label="Gastos (Bs)" valA={cmpYearSummaryA?.total_expenses_bs ?? 0} valB={cmpYearSummaryB?.total_expenses_bs ?? 0} format={formatBs} />
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {!cmpSummaryA && !cmpSummaryB && !cmpYearSummaryA && !cmpYearSummaryB && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Seleccioná dos períodos para comparar
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bar chart */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-sm font-semibold mb-4">Ingresos vs Gastos ({MONTHS_ES[selMonth]} {selYear})</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(v) => hasUsd ? `$${Number(v)}` : `Bs ${Number(v)}`} />
              <Tooltip formatter={(v) => hasUsd ? formatUsd(Number(v)) : formatBs(Number(v))} />
              <Bar dataKey="monto" radius={[4, 4, 0, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "hsl(var(--chart-2))" : "hsl(var(--chart-5))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed category breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by category */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingDown className="size-4 text-destructive" />
            Gastos por categoría
          </h3>
          {sortedExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No hay gastos este mes</p>
          ) : (
            <div className="space-y-1">
              {/* Header */}
              <div className="flex items-center gap-x-2.5 text-xs text-muted-foreground font-medium px-3 py-1.5 border-b border-border">
                <span className="flex-1">Categoría</span>
                <span className="w-20 text-right">USD</span>
                <span className="w-24 text-right hidden sm:block">Bs</span>
              </div>
              {/* Rows */}
              {sortedExpenses.map((cat, i) => {
                const isTop = i === 0
                return (
                  <div
                    key={cat.category_id}
                    className={cn(
                      "flex items-center gap-x-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                      isTop
                        ? "bg-destructive/10 text-destructive font-semibold"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <span className="flex-1 flex items-center gap-2 truncate">
                      {isTop && <Award className="size-3.5 shrink-0" />}
                      <span className="truncate">{cat.category_name}</span>
                    </span>
                    <span className="w-20 text-right tabular-nums font-medium">
                      {displayValue(cat)}
                    </span>
                    <span className="w-24 text-right tabular-nums text-muted-foreground hidden sm:block">
                      {isUsd(cat) ? formatBs(cat.total_bs) : "—"}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Income by category */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="size-4 text-chart-2" />
            Ingresos por categoría
          </h3>
          {sortedIncome.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No hay ingresos este mes</p>
          ) : (
            <div className="space-y-1">
              {/* Header */}
              <div className="flex items-center gap-x-2.5 text-xs text-muted-foreground font-medium px-3 py-1.5 border-b border-border">
                <span className="flex-1">Categoría</span>
                <span className="w-20 text-right">USD</span>
                <span className="w-24 text-right hidden sm:block">Bs</span>
              </div>
              {/* Rows */}
              {sortedIncome.map((cat) => (
                <div
                  key={cat.category_id}
                  className="flex items-center gap-x-2.5 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors"
                >
                  <span className="flex-1 truncate">{cat.category_name}</span>
                  <span className="w-20 text-right tabular-nums font-medium text-chart-2">
                    {displayValue(cat)}
                  </span>
                  <span className="w-24 text-right tabular-nums text-muted-foreground hidden sm:block">
                    {isUsd(cat) ? formatBs(cat.total_bs) : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Yearly summary */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">Resumen anual ({selYear})</h3>
        {yearlySummary ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Ingresos</p>
              <p className="text-lg font-bold text-chart-2">{formatUsd(yearlySummary.total_income_usd)}</p>
              <p className="text-xs text-muted-foreground">{formatBs(yearlySummary.total_income_bs)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gastos</p>
              <p className="text-lg font-bold text-destructive">{formatUsd(yearlySummary.total_expenses_usd)}</p>
              <p className="text-xs text-muted-foreground">{formatBs(yearlySummary.total_expenses_bs)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className={`text-lg font-bold ${yearlySummary.balance_usd >= 0 ? "text-chart-1" : "text-destructive"}`}>
                {formatUsd(yearlySummary.balance_usd)}
              </p>
              <p className="text-xs text-muted-foreground">{formatBs(yearlySummary.balance_bs)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
        )}
      </div>
    </div>
  )
}
