import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { core } from "../../../../wailsjs/go/models"

interface TransactionRowProps {
  transaction: core.Transaction
  categoryName?: string
  onEdit: (tx: core.Transaction) => void
  onDelete: (id: number) => void
}

function formatBs(value: number): string {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "VES",
    minimumFractionDigits: 2,
  }).format(value)
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-")
  return `${d}/${m}/${y}`
}

export default function TransactionRow({
  transaction,
  categoryName,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const isIncome = transaction.type === "income"

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="py-3 px-4 text-sm tabular-nums text-muted-foreground whitespace-nowrap">
        {formatDate(transaction.date)}
      </td>
      <td className="py-3 px-4 text-sm font-medium text-foreground max-w-[200px] truncate">
        <span dangerouslySetInnerHTML={{ __html: transaction.description }} />
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            isIncome
              ? "bg-primary/10 text-primary"
              : "bg-destructive/10 text-destructive"
          )}
        >
          {isIncome ? "Ingreso" : "Gasto"}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground">
        {categoryName ?? "—"}
      </td>
      <td className="py-3 px-4 text-sm tabular-nums text-right font-medium whitespace-nowrap">
        {formatBs(transaction.amount_bs)}
      </td>
      <td className="py-3 px-4 text-sm tabular-nums text-right text-muted-foreground whitespace-nowrap">
        {transaction.amount_usd_bcv > 0 ? formatUsd(transaction.amount_usd_bcv) : "—"}
      </td>
      <td className="py-3 px-4 text-sm tabular-nums text-right text-muted-foreground whitespace-nowrap">
        {transaction.amount_usdt > 0 ? formatUsd(transaction.amount_usdt) : "—"}
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon-xs" onClick={() => onEdit(transaction)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onDelete(transaction.id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
