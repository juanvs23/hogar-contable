import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  ArrowRightLeft,
  Tags,
  FileBarChart,
  PiggyBank,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transacciones", icon: ArrowRightLeft },
  { to: "/categories", label: "Categorías", icon: Tags },
  { to: "/reports", label: "Reportes", icon: FileBarChart },
]

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      {/* Logo / Title */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border">
        <PiggyBank className="size-5 text-primary" />
        <span className="font-bold text-lg">Hogar Contable</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted-foreground">Hogar Contable v0.1</p>
      </div>
    </aside>
  )
}
