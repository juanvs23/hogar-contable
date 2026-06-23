import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const data = [
  { name: "Ene", ingresos: 400, gastos: 240 },
  { name: "Feb", ingresos: 300, gastos: 139 },
  { name: "Mar", ingresos: 200, gastos: 280 },
  { name: "Abr", ingresos: 278, gastos: 190 },
  { name: "May", ingresos: 189, gastos: 230 },
  { name: "Jun", ingresos: 239, gastos: 180 },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reportes</h2>
        <p className="text-sm text-muted-foreground">
          Comparativas mensuales y anuales
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-sm font-semibold mb-4">Comparativa Mensual</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Bar dataKey="ingresos" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
