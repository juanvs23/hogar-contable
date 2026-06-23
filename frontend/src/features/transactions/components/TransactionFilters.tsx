import { Button } from "@/components/ui/button"

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
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Month selector */}
      <input
        type="month"
        value={month}
        onChange={(e) => onMonthChange(e.target.value)}
        className="h-8 rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring"
      />

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
