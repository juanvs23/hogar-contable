# Contexto del Proyecto — Hogar Contable

## Particularidades

- **Target**: Windows 11, desarrollado en Linux (Ubuntu 24.04)
- **Usuario final**: Persona sin conocimientos de informática
- **Idioma**: Español (toda la UI)
- **Autenticación**: No requiere — un solo usuario
- **Cierres contables**: Por día y por mes, para integridad de reportes
- **Conversión Bs/USD**: Fetch a API externa (dólar oficial + USDT P2P) via dolarapi.com
- **Offline**: Funciona sin internet excepto para tipo de cambio (mantiene último valor)
- **Exportación**: Excel (pendiente)
- **Importación**: CSV (pendiente)
- **Persistencia**: SQLite local en ~/.local/share/hogar-contable/
- **Sin autenticación ni multiusuario**

## Stack confirmado

- Wails v2 (Go + webview nativo) → window nativa
- React 18 + TypeScript + Vite
- TailwindCSS + shadcn/ui + Recharts
- SQLite (modernc.org/sqlite, puro Go, sin CGO)
- Vitest + React Testing Library
- Clean / Screaming Architecture
- WebKit2GTK 4.1 (Linux), WebView2 (Windows)

## Patrón de diseño

- Componentes atómicos (shadcn/ui como base)
- Container-Presentational para features
- Llamadas directas a Wails bindings (sin TanStack Query aún)
- Comandos Wails/Go para operaciones de backend

## Estado del proyecto (23/06/2026)

### Completado — Backend
- Modelos: Transaction (con amount_bs, amount_usd_bcv, amount_usdt, rate_official, rate_p2p), Category, Closure, ExchangeRate
- SQLite con WAL, foreign keys, migrations automáticas
- CRUD transacciones: crear, listar (por fecha/tipo), editar, eliminar
- CRUD categorías: crear, editar, eliminar con 17 categorías default (se refrescan en cada inicio)
- Fetch de tasas de cambio desde dolarapi.com con cache offline
- Clean Architecture: core → repository → service → App handlers

### Completado — Frontend
- Layout responsive: Sidebar con navegación + Header con tasas en vivo
- Dashboard con tarjetas de resumen (ingresos/gastos/balance) llamando al backend
- Transacciones: tabla completa con columnas Bs/USD BCV/USDT, filtros por mes y tipo, modal crear/editar con selector de moneda y equivalencias automáticas
- Categorías: grilla con crear, editar (modal), eliminar, filtro por tipo
- Modo oscuro: toggle manual + detección del sistema, persistido en localStorage
- ErrorBoundary global para fallos de conexión con backend
- Componente shadcn/ui Button con todas las variantes

### Pendiente
- Reportes: cierre diario/mensual/anual, gráficos con datos reales
- Exportación a Excel
- Importación CSV
- Backup de base de datos
- Tests unitarios
- Cross-compile a Windows (.exe)
- NSIS installer

## Decisiones registradas

- Se eligió Wails sobre Tauri porque el backend Go es más accesible para futuros desarrolladores
- WebView2 runtime es nativo en Windows 11, en Linux se usa webkit2gtk-4.1
- Sin autenticación ni sesiones — un solo usuario local
- Los datos viajan dentro de la app (sin servidor externo)
- API de tasas de cambio: dolarapi.com (reemplazó a pydolarve.org que dejó de funcionar)
- Categorías default se refrescan en cada inicio (DELETE + INSERT)
- Transacciones guardan 3 montos (Bs, USD BCV, USDT) + tasas de conversión usadas
- Dark mode con toggle manual + detección del sistema, persistido en localStorage
- Compilación en Ubuntu 24.04 requiere tag webkit2_41 para Wails
- Sin TanStack Query — se usa estado local con useState/useEffect por simplicidad
- Sin autenticación ni multiusuario
