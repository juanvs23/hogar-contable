# Changelog

## [1.2.3] - 2026-09-27

### Fixed
- Eliminar una cuenta de ahorros ahora borra sus movimientos en una misma transacción (antes dejaba filas huérfanas invisibles en la DB pese a que la UI prometía "y todos sus movimientos")
- Foreign keys ahora se aplican a todas las conexiones del pool vía DSN (`_pragma=foreign_keys(1)`); antes el PRAGMA corría en una sola conexión y las FK no se cumplían de verdad
- El modal de depósito/retiro de ahorros resetea monto, fecha, descripción, checkbox de ingreso y categoría al cerrarse por cualquier camino (Cancelar, X, fondo); antes un modal cancelado heredaba el monto tipeado al siguiente

### Added
- Tests de repositorio sobre DB temporal: FK aplicadas por conexión, delete de cuenta sin movimientos huérfanos, delete de cuenta inexistente como no-op

## [1.2.2] - 2026-09-27

### Fixed
- Retiros de ahorros validan el saldo en USDT (moneda base del módulo); antes comparaban en USD BCV y podían rechazar retiros válidos o permitir sobregiro cuando la relación paralelo/oficial cambiaba entre movimientos
- Movimientos de ahorros muestran el monto USDT como principal y el USD BCV como secundario (consistente con el header de cuenta y el total global)
- Mensaje de "saldo insuficiente" en retiros reporta el saldo disponible en USDT

### Added
- Tests de regresión para retiros de ahorros: tasas mixtas entre depósito y retiro, saldo insuficiente, retiro del saldo exacto

## [1.2.1] - 2026-09-27

### Changed
- Roadmap sincronizado con el estado real del proyecto: Fase 3 (Reportes) y Fase 4 (Export/Import) completadas, Fases 5-7 marcadas parcialmente según evidencia; pendientes reales consolidados en una sola lista
- Contexto (docs/context.md) actualizado: exportación/importación ya no figuran como pendientes, estado del proyecto al día (27/09/2026)
- Versión del sidebar actualizada a v1.2.1

## [1.2.0] - 2026-07-18

### Added
- Modal para ingresar tasas manualmente cuando la API de dolarapi.com no responde
- Fallback promedio desde compra/venta si la API no devuelve promedio
- Regla de proyecto: CHANGELOG obligatorio en cada cambio (docs/context.md)
- Binding SetManualExchangeRates desde el frontend

### Fixed
- SQLITE_BUSY en escrituras concurrentes de tasas de cambio (sync.Mutex en GetCurrentRates)
- Versión en sidebar mostraba v0.1 en vez de la versión real del proyecto

### Changed
- Vista de versión actualizada a v1.2.0 en el sidebar

## [1.1.0] - 2026-07-04

### Added
- Editor WYSIWYG (react-quill) para descripciones en transacciones y ahorros
- Toolbar completa: negrita, cursiva, subrayado, tachado, color, listas, checklist, alineación, citas, código, enlace
- IDs fijos para categorías default (1-17) para mantener referencias estables

### Fixed
- Categorías no se guardaban en transacciones por IDs cambiantes en cada reinicio
- Ventana Windows sin bordes ni botones de min/max/cerrar (native_webview2loader)
- Ventana Windows sin posibilidad de arrastrar (Frameless: false)
- Duplicación de React que rompía react-quill

### Changed
- Tamaño de ventana reducido a 1000x700 (min 800x500)
- Descripciones renderizadas como HTML en listas
- Espacios reducidos al mínimo en modal de transacción

## [1.0.0] - 2026-06-25

### Added
- CRUD completo de transacciones con 3 montos (Bs, USD BCV, USDT)
- Conversión automática entre monedas con tasas en vivo (dolarapi.com)
- Dashboard con resumen mensual en USD BCV + Bs
- Gestión completa de categorías con 17 categorías default
- Ahorros: módulo independiente con total global y conversión automática
- Reportes mensuales con gráficos y desglose por categoría
- Comparación entre meses y entre años con diferencia porcentual
- Cierre mensual y cierre diario
- Exportar a Excel (transacciones, reportes, ahorros)
- Importar desde CSV con validación
- Backup de base de datos desde la UI
- Modo oscuro con toggle + detección del sistema
- Botón de ayuda contextual con screenshots por vista
- Diferencial porcentual USDT/BCV en el header
- Selectores de fecha en dropdowns en toda la app
- Error handling: ErrorBoundary, slices no nulos desde Go

### Changed
- API de tasas de pydolarve.org a dolarapi.com
- Selectores nativos de fecha a dropdowns personalizados
- Dashboard: USD BCV como moneda principal

### Fixed
- Pantalla negra por Wails bindings ausentes
- Transacciones sin categoría no aparecían en reportes (LEFT JOIN)
- Slices nil de Go serializados como null en JSON
- Dark mode en selects nativos (color-scheme)
- FK constraint al refrescar categorías default

### Build
- Cross-compile a Windows .exe (18 MB PE32+)
- NSIS installer con WebView2 auto-install (9.1 MB)
- Tests Go: 12 tests unitarios
- Tests frontend: 4 tests de componentes
- Documentación de migración (MIGRACION.md)

## [0.0.1] - 2026-06-23

### Added
- Inicialización del proyecto con Wails v2 + React + TypeScript + Vite
- Configuración de TailwindCSS y PostCSS
- Configuración de Vitest + Testing Library
- Documentación inicial del proyecto
- SDD initialization
