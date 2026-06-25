import { useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

interface TransactionFiltersProps {
  month: string
  txType: string
  onMonthChange: (month: string) => void
  onTypeChange: (type: string) => void
}

export default function TransactionFilters({
  month,
  txType,
  onMonthChange,
  onTypeChange,
}: TransactionFiltersProps) {
  const [year, m] = month.split("-")
  const monthIdx = Number(m) - 1

  const prevMonth = useCallback(() => {
    const d = new Date(Number(year), monthIdx - 1, 1)
    const ny = d.getFullYear()
    const nm = String(d.getMonth() + 1).padStart(2, "0")
    onMonthChange(`${ny}-${nm}`)
  }, [year, monthIdx, onMonthChange])

  const nextMonth = useCallback(() => {
    const d = new Date(Number(year), monthIdx + 1, 1)
    const ny = d.getFullYear()
    const nm = String(d.getMonth() + 1).padStart(2, "0")
    onMonthChange(`${ny}-${nm}`)
  }, [year, monthIdx, onMonthChange])

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Month selector — dropdowns */}
      <div className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1">
        <Button variant="ghost" size="icon-xs" onClick={prevMonth}>
          <ChevronLeft className="size-3.5" />
        </Button>

        <select
          value={monthIdx}
          onChange={(e) => onMonthChange(`${year}-${String(Number(e.target.value) + 1).padStart(2, "0")}`)}
          className="bg-transparent text-sm font-medium min-w-[80px] text-center cursor-pointer outline-none"
        >
          {MONTHS_ES.map((name, i) => (
            <option key={i} value={i} className="bg-background text-foreground">{name}</option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => onMonthChange(`${e.target.value}-${String(monthIdx + 1).padStart(2, "0")}`)}
          className="bg-transparent text-sm font-bold min-w-[60px] text-center cursor-pointer outline-none tabular-nums"
        >
          {Array.from({ length: 10 }, (_, i) => String(Number(year) - 5 + i)).map((y) => (
            <option key={y} value={y} className="bg-background text-foreground">{y}</option>
          ))}
        </select>

        <Button variant="ghost" size="icon-xs" onClick={nextMonth}>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-1">
        {(["all", "income", "expense"] as const).map((type) => (
          <Button
            key={type}
            variant={txType === type ? "default" : "secondary"}
            size="sm"
            onClick={() => onTypeChange(type)}
          >
            {type === "all" ? "Todas" : type === "income" ? "Ingresos" : "Gastos"}
          </Button>
        ))}
      </div>
    </div>
  )
}
