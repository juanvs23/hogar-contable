import { useState, useEffect } from "react"
import { RefreshCw, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "@/hooks/useTheme"
import { GetCurrentExchangeRates } from "../../../wailsjs/go/main/App"

interface ExchangeRates {
  official: number
  p2p: number
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "VES",
    minimumFractionDigits: 2,
  }).format(value)
}

export default function Header() {
  const [rates, setRates] = useState<ExchangeRates | null>(null)
  const [loading, setLoading] = useState(false)
  const { isDark, toggle } = useTheme()

  const fetchRates = async () => {
    setLoading(true)
    try {
      const result = await GetCurrentExchangeRates()
      setRates(result)
    } catch {
      // Silently fail — rates will show as unavailable
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRates()
  }, [])

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
      <h1 className="text-sm font-medium text-muted-foreground">
        <span className="text-foreground font-semibold">Hogar Contable</span> — Control de Gastos
      </h1>

      <div className="flex items-center gap-2">
        {rates && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mr-2">
            <span>
              Oficial: <strong className="text-foreground">{formatCurrency(rates.official)}</strong>
            </span>
            <span className="text-border">|</span>
            <span>
              P2P: <strong className="text-foreground">{formatCurrency(rates.p2p)}</strong>
            </span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={toggle} title={isDark ? "Modo claro" : "Modo oscuro"}>
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={fetchRates} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>
    </header>
  )
}
