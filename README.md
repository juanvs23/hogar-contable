# Hogar Contable 🐷💰

**Aplicación de escritorio para finanzas personales** — Controlá tus ingresos, gastos y ahorros de forma sencilla.

Creada con **Wails v2 (Go) + React + TypeScript + TailwindCSS**, pensada para un solo usuario sin conocimientos técnicos.

---

## ✨ Funcionalidades

| Módulo | Qué hace |
|--------|----------|
| **Dashboard** | Resumen mensual de ingresos, gastos y balance en USD (tasa BCV) + Bs |
| **Transacciones** | CRUD completo con 3 monedas (Bs, USD BCV, USDT), filtros por mes/tipo |
| **Categorías** | Gestión completa con 17 categorías default, crear/editar/eliminar |
| **Ahorros** | Módulo independiente (no afecta ingresos/gastos), total global en USD + Bs |
| **Reportes** | Gráficos, desglose por categoría, mayor gasto destacado |
| **Comparación** | Compará meses o años distintos con diferencia porcentual |
| **Cierre mensual/diario** | Puntos de control contable opcionales |
| **Exportar a Excel** | Descargá transacciones, reportes o ahorros en `.xlsx` |
| **Importar CSV** | Cargá transacciones desde un archivo CSV |
| **Backup DB** | Copia de seguridad de toda la base de datos |
| **Modo oscuro** | Toggle manual + detección automática del sistema |
| **Ayuda contextual** | Botón `?` con guía paso a paso y capturas de pantalla |
| **Multi-monedas** | Conversión automática entre Bs, USD BCV y USDT en vivo |

---

## 📸 Capturas

| Vista | |
|-------|---|
| Dashboard | Resumen del mes con ingresos/gastos/balance |
| Transacciones | Tabla con filtros, crear/editar/eliminar |
| Categorías | Grilla con gestión completa |
| Ahorros | Total global + lista con edición inline |
| Reportes | Gráficos, desglose por categoría, comparación |

*(Las capturas están integradas en el modal de ayuda — presioná `?` en cualquier pantalla)*

---

## 🚀 Instalación

### Usuario final (Windows)

1. Descargá [`hogar-contable-amd64-installer.exe`](./build/bin/)
2. Ejecutalo — instala la app y **WebView2 Runtime** automáticamente
3. Listo — la app aparece en el Escritorio y Menú Inicio

> También podés usar el `.exe` portátil directamente si ya tenés WebView2.

### Desarrollador (Linux)

```bash
# Requisitos
sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev gcc-mingw-w64-x86-64 nsis

# Clonar
git clone git@github.com:juanvs23/hogar-contable.git
cd hogar-contable

# Desarrollo (hot reload)
wails dev -tags webkit2_41

# Build para Windows
export CGO_ENABLED=1
export CC=x86_64-w64-mingw32-gcc
export CXX=x86_64-w64-mingw32-g++
export GOOS=windows
export GOARCH=amd64
wails build -platform windows/amd64 -nsis
```

---

## 🏗️ Arquitectura

```
hogar-contable/
├── app.go                    # Handlers Wails (puente Go ↔ Frontend)
├── main.go                   # Entry point de la app
├── internal/
│   ├── core/                 # Modelos de dominio (Transaction, Category, etc.)
│   ├── database/             # SQLite + migraciones automáticas
│   ├── repository/           # Interfaces + implementación SQLite
│   ├── service/              # Lógica de negocio + tests unitarios
│   └── exchange/             # Cliente API dolarapi.com
├── frontend/
│   └── src/
│       ├── components/       # Componentes reutilizables (Layout, Button, Help)
│       ├── features/         # Páginas (Dashboard, Transactions, etc.)
│       ├── hooks/            # Hooks personalizados (useTheme)
│       └── lib/              # Utilidades (cn)
└── build/bin/                # Artefactos compilados (.exe, installer)
```

**Stack:**

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | TailwindCSS + shadcn/ui |
| Gráficos | Recharts |
| Backend | Go 1.25 (Clean Architecture) |
| Base de datos | SQLite (modernc.org/sqlite, sin CGO) |
| Ventana nativa | Wails v2 (WebView2 en Windows, WebKit2GTK en Linux) |

---

## 📦 Artefactos de build

| Archivo | Tamaño | Descripción |
|---------|--------|-------------|
| `hogar-contable.exe` | 18 MB | Ejecutable portátil para Windows |
| `hogar-contable-amd64-installer.exe` | 9,1 MB | Instalador NSIS con WebView2 auto-install |

---

## 🗄️ Base de datos

La DB se guarda automáticamente en:

| Sistema | Ruta |
|---------|------|
| **Windows** | `%APPDATA%\hogar-contable\hogar-contable.db` |
| **Linux** | `~/.local/share/hogar-contable/hogar-contable.db` |

Backup y restore disponibles desde la UI (botón Backup en Reportes).  
Más información en [`docs/MIGRACION.md`](./docs/MIGRACION.md).

---

## 🧪 Tests

```bash
# Backend (Go)
go test ./internal/service/... -v

# Frontend
cd frontend && npx vitest run
```

- **Go**: 12 tests (TransactionService + ExchangeService)
- **Frontend**: 4 tests (Button component)

---

## 📄 Licencia

MIT — JuanVS23

---

## 🙌 Agradecimientos

- [Wails](https://wails.io/) — framework Go para apps de escritorio
- [shadcn/ui](https://ui.shadcn.com/) — componentes React
- [dolarapi.com](https://dolarapi.com/) — API de tasas de cambio
- [excelize](https://github.com/xuri/excelize) — generación de Excel en Go
