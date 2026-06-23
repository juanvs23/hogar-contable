import TransactionRow from "./TransactionRow"
import { core } from "../../../../wailsjs/go/models"
import { ListCategories } from "../../../../wailsjs/go/main/App"
import { useState, useEffect, useMemo } from "react"

interface TransactionListProps {
  transactions: core.Transaction[]
  loading: boolean
  onEdit: (tx: core.Transaction) => void
  onDelete: (id: number) => void
}

export default function TransactionList({
  transactions,
  loading,
  onEdit,
  onDelete,
}: TransactionListProps) {
  // Load categories to resolve names
  const [categories, setCategories] = useState<Record<number, string>>({})

  useEffect(() => {
    // Load both income and expense categories
    Promise.all([ListCategories("income"), ListCategories("expense")])
      .then(([income, expense]) => {
        const map: Record<number, string> = {}
        ;[...income, ...expense].forEach((c) => {
          map[c.id] = c.name
        })
        setCategories(map)
      })
      .catch(console.error)
  }, [])

  const categoryName = (categoryId?: number): string | undefined =>
    categoryId ? categories[categoryId] : undefined

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 border-b border-border last:border-0 flex items-center px-4"
          >
            <div className="h-3 w-full max-w-[200px] rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No hay transacciones registradas para este período
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Fecha
            </th>
            <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Descripción
            </th>
            <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tipo
            </th>
            <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Categoría
            </th>
            <th className="py-2.5 px-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Bs
            </th>
            <th className="py-2.5 px-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              USD BCV
            </th>
            <th className="py-2.5 px-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              USDT
            </th>
            <th className="py-2.5 px-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              categoryName={categoryName(tx.category_id)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
