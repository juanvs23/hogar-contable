import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { X, PiggyBank, LayoutDashboard, ArrowRightLeft, Tags, FileBarChart, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

import dashboardImg from "@/assets/images/help/dashboard.png"
import transactionsImg from "@/assets/images/help/transactions.png"
import categoriesImg from "@/assets/images/help/categories.png"
import savingsImg from "@/assets/images/help/savings.png"
import reportsImg from "@/assets/images/help/reports.png"

interface HelpContent {
  title: string
  icon: React.ReactNode
  image?: string
  steps: string[]
  tips?: string[]
}

const helpMap: Record<string, HelpContent> = {
  "/dashboard": {
    title: "Dashboard",
    icon: <LayoutDashboard className="size-5 text-primary" />,
    image: dashboardImg,
    steps: [
      "El Dashboard te da un resumen rápido del mes actual.",
      "Las tarjetas superiores muestran Ingresos, Gastos y Balance en USD (tasa BCV).",
      "Debajo de cada valor en USD, se muestra el equivalente en bolívares.",
      "Los datos se actualizan automáticamente al abrir la página.",
      "Usá el botón de refrescar tasas (🔄) en el header para actualizar el tipo de cambio.",
    ],
    tips: [
      "El balance se pone en rojo si los gastos superan los ingresos.",
      "Las tasas se cachean localmente, funcionan offline con el último valor.",
    ],
  },
  "/transactions": {
    title: "Transacciones",
    icon: <ArrowRightLeft className="size-5 text-primary" />,
    image: transactionsImg,
    steps: [
      "Acá registrás todos tus ingresos y gastos del hogar.",
      'Presioná "Nueva Transacción" para abrir el formulario.',
      "Elegí si es un Gasto o un Ingreso usando los botones (rojo = gasto, verde = ingreso).",
      "Escribí una descripción clara (ej: 'Sueldo junio', 'Mercado semanal').",
      "Seleccioná la moneda del monto: Bs, USD BCV o USDT.",
      "El sistema calcula automáticamente el equivalente en las otras monedas.",
      "Elegí una categoría y la fecha, y guardá.",
      "Usá los filtros de mes y tipo para buscar transacciones.",
      "Hacé clic en el lápiz para editar o en el tacho para eliminar.",
      "También podés cerrar un día específico con el botón 'Cerrar día' para evitar modificaciones.",
    ],
    tips: [
      "Siempre llená al menos un monto (Bs, USD o USDT) para poder guardar.",
      "El cierre diario es optativo: solo cerrá cuando estés seguro de que no vas a modificar ese día.",
    ],
  },
  "/categories": {
    title: "Categorías",
    icon: <Tags className="size-5 text-primary" />,
    image: categoriesImg,
    steps: [
      "Las categorías organizan tus transacciones para después ver reportes.",
      'Escribí el nombre de la categoría y elegí si es de "Gasto" o "Ingreso".',
      "Presioná 'Crear' para agregarla.",
      "Las categorías se muestran en una grilla con un punto de color: rojo = gasto, verde = ingreso.",
      "Hacé clic en cualquier categoría para EDITARLA (cambiar nombre o tipo).",
      "Las categorías default (precargadas) también se pueden editar.",
      "No se pueden eliminar categorías que estén siendo usadas por transacciones.",
    ],
    tips: [
      "Creá categorías específicas para tener mejores reportes (ej: 'Comida' y 'Salidas' en vez de un solo 'Varios').",
      "Las categorías default se refrescan en cada inicio de la app.",
    ],
  },
  "/savings": {
    title: "Ahorros",
    icon: <PiggyBank className="size-5 text-primary" />,
    image: savingsImg,
    steps: [
      "Acá registrás tus ahorros de forma independiente a los ingresos y gastos.",
      "Los ahorros NO afectan el balance del dashboard ni de los reportes.",
      'Presioná "Nuevo ahorro" y completá la descripción.',
      "Ingresá el monto en USD solamente.",
      "El sistema muestra automáticamente el equivalente en Bs (tasa BCV y USDT).",
      "Arriba de todo ves el TOTAL AHORRADO global en USD y Bs.",
      "Usá el lápiz para editar o el tacho para eliminar.",
    ],
    tips: [
      "Los ahorros son independientes para que puedas separar 'lo que ganaste' de 'lo que guardaste'.",
      "Cuando retirés un ahorro, simplemente eliminá el registro.",
    ],
  },
  "/reports": {
    title: "Reportes",
    icon: <FileBarChart className="size-5 text-primary" />,
    image: reportsImg,
    steps: [
      "Los reportes te dan una vista más detallada de tus finanzas.",
      "Seleccioná el MES y el AÑO con los dropdowns de arriba.",
      "Las tarjetas de resumen muestran Ingresos, Gastos y Balance del mes.",
      "El gráfico de barras compara Ingresos vs Gastos visualmente.",
      "La sección de GASTOS POR CATEGORÍA muestra cuánto gastaste en cada una, ordenado de mayor a menor.",
      "El mayor gasto del mes se marca en rojo con un ícono 🏆.",
      "La sección de INGRESOS POR CATEGORÍA hace lo mismo con tus ingresos.",
      'El botón "Cerrar mes" guarda el cierre contable del mes.',
      "En la sección COMPARAR podés comparar dos meses o dos años distintos.",
      "La tabla de comparación muestra la diferencia en USD y el porcentaje de variación.",
    ],
    tips: [
      "Usá la comparación para ver cómo cambian tus gastos entre meses (ej: comparar diciembre vs enero).",
      "El cierre mensual no bloquea las transacciones, solo deja un registro.",
    ],
  },
}

const fallbackHelp: HelpContent = {
  title: "Ayuda",
  icon: <HelpCircle className="size-5 text-primary" />,
  steps: [
    "Usá el menú de la izquierda para navegar entre las secciones.",
    "Cada sección tiene su propia guía paso a paso.",
    "Si tenés dudas, consultá esta ayuda desde cualquier pantalla.",
  ],
}

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export default function HelpModal({ open, onClose }: HelpModalProps) {
  const location = useLocation()
  const dialogRef = useRef<HTMLDivElement>(null)

  const path = Object.keys(helpMap).find((p) => location.pathname.startsWith(p)) ?? ""
  const content = helpMap[path] ?? fallbackHelp

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80">
      <div
        ref={dialogRef}
        className="bg-card border border-border rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {content.icon}
            <h3 className="text-base font-semibold">Guía: {content.title}</h3>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Screenshot */}
          {content.image && (
            <div className="rounded-lg border border-border overflow-hidden">
              <img
                src={content.image}
                alt={`Captura de ${content.title}`}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Steps */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Paso a paso
            </h4>
            <ol className="space-y-2.5">
              {content.steps.map((step, i) => (
                <li key={i} className="text-sm text-foreground leading-relaxed flex gap-2.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Tips */}
          {content.tips && content.tips.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Consejos
              </h4>
              <ul className="space-y-1.5">
                {content.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary shrink-0">💡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
