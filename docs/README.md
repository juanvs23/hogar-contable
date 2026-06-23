# Hogar Contable

Sistema de control de gastos e ingresos para el hogar. Lleva un libro de cuentas digital con secciones variables, cálculo de conversión Bs/USD actualizado vía API, reportes mensuales/anuales, y cierres por día/mes.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS + Recharts |
| Backend | Go 1.23 + Wails 2 (webview nativo) |
| Base de datos | SQLite |
| Testing | Vitest + React Testing Library |

## Arquitectura

Clean Architecture / Screaming Architecture — el proyecto está organizado por funcionalidad de negocio, no por capas técnicas.

```
src/
├── core/              # Entidades, value objects, tipos
├── features/          # Módulos por feature
│   ├── dashboard/     # Resumen general
│   ├── transacciones/ # CRUD de ingresos/egresos
│   ├── reportes/      # Reportes mensuales/anuales
│   ├── cierres/       # Cierre diario/mensual
│   └── conversion/    # Tipo de cambio Bs/USD
├── shared/            # UI, componentes atómicos
└── services/          # API calls, bindings a backend
```

## Requisitos

- Windows 11 (target) o Linux (desarrollo)
- WebView2 Runtime (viene incluido en Windows 11)

## Desarrollo

```bash
# Frontend en modo dev (navegador)
cd frontend && npm run dev

# App completa con Wails (ventana nativa)
wails dev

# Compilar para Windows
GOOS=windows GOARCH=amd64 wails build
```

## Licencia

Uso personal.
