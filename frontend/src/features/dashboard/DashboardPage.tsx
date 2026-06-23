import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { GetMonthlySummary } from "../../../wailsjs/go/main/App"

interface Summary {
  month: string
  total_income: number
  total_expenses: number
  balance: number
}

function formatBs(value: number): string {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "VES",
    minimumFractionDigits: 2,
  }).format(value)
}

function getCurrentMonth(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  return `${now.getFullYear()}-${month}`
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [currentMonth] = useState(getCurrentMonth)

  useEffect(() => {
    const [year, month] = currentMonth.split("-")
    GetMonthlySummary(year, month).then(setSummary).catch(console.error)
  }, [currentMonth])

  const cards = [
    {
      title: "Ingresos",
      value: summary ? formatBs(summary.total_income) : "Bs 0,00",
      icon: TrendingUp,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      title: "Gastos",
      value: summary ? formatBs(summary.total_expenses) : "Bs 0,00",
      icon: TrendingDown,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      title: "Balance",
      value: summary ? formatBs(summary.balance) : "Bs 0,00",
      icon: Wallet,
      color: summary?.balance && summary.balance >= 0 ? "text-chart-1" : "text-destructive",
      bg: "bg-card",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Resumen de {currentMonth}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-lg border border-border bg-card p-5 flex items-start gap-4"
          >
            <div className={`rounded-lg p-3 ${card.bg}`}>
              <card.icon className={`size-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for charts and recent transactions */}
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        <p className="text-sm">Aquí irán los gráficos y transacciones recientes</p>
      </div>
    </div>
  )
}
