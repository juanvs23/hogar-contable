import { useState, useEffect } from "react"
import { RefreshCw, Moon, Sun, CircleHelp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "@/hooks/useTheme"
import HelpModal from "@/components/help/HelpModal"
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
  const [helpOpen, setHelpOpen] = useState(false)
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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
            <span>BCV <strong className="text-foreground">{formatCurrency(rates.official)}</strong></span>
            <span className="text-border/60 mx-0.5">|</span>
            <span>USDT <strong className="text-foreground">{formatCurrency(rates.p2p)}</strong></span>
            {rates.official > 0 && (
              <span className={cn("ml-1 font-bold", rates.p2p >= rates.official ? "text-red-500" : "text-green-500")}>
                ({(rates.p2p / rates.official - 1) >= 0 ? "+" : ""}{((rates.p2p / rates.official - 1) * 100).toFixed(1)}%)
              </span>
            )}
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setHelpOpen(true)} title="Ayuda">
          <CircleHelp className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggle} title={isDark ? "Modo claro" : "Modo oscuro"}>
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={fetchRates} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </header>
  )
}
