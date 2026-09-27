# Roadmap — Hogar Contable

> Sincronizado con el estado real del proyecto — 27/09/2026 (v1.2.1).
> El detalle de features por versión está en `docs/CHANGELOG.md`.

## Fase 1: Fundación ✅
- [x] Discovery completo
- [x] Selección de stack
- [x] Inicialización del proyecto Wails
- [x] Configurar Go backend con SQLite
- [x] Migraciones de base de datos
- [x] Diseño de componentes UI (guía de diseño)
- [x] Estructura de carpetas Clean Architecture

## Fase 2: Core (casi completa)
- [x] CRUD de transacciones (ingresos/egresos) — crear, listar, editar, eliminar
- [x] Dashboard principal (resumen del mes)
- [x] Categorización de gastos — gestión completa + categorías default
- [x] Conversión Bs/USD (oficial + P2P) — 3 monedas: Bs, USD BCV, USDT
- [x] Cache de tipo de cambio offline — fallback automático + tasas manuales (v1.2.0)
- [ ] Secciones variables (personalizables) — pendiente

## Fase 3: Reportes ✅ (v1.0.0)
- [x] Cierre diario
- [x] Cierre mensual
- [x] Reporte mensual comparativo
- [x] Reporte anual — modo comparar con tabs meses/años en el módulo de reportes
- [x] Comparación entre años — con diferencia porcentual
- [x] Gráficos con Recharts conectados al backend real

## Fase 4: Export/Import ✅ (v1.0.0)
- [x] Exportar a Excel (transacciones, reportes, ahorros)
- [x] Importar desde CSV con validación
- [x] Backup de base de datos — botón Backup en la UI (Reportes)

## Fase 5: Build & Distribución (parcial)
- [x] Cross-compile a Windows (.exe) — v1.0.0
- [x] NSIS installer con WebView2 auto-install — v1.0.0
- [x] Pruebas en Windows 11 — bugfixes de ventana nativa en v1.1.0 (bordes, min/max/cerrar, arrastre)
- [ ] GitHub Actions CI/CD
- [ ] Testing E2E con Playwright

## Fase 6: Guía de uso interactiva (casi completa)
- [x] Botón de ayuda (?) en el header con modal contextual por ruta — v1.0.0
- [x] Capturas de pantalla por vista — 5 screenshots integrados en el modal (dashboard, transacciones, categorías, ahorros, reportes)
- [ ] Video o GIF de uso básico (opcional)

## Fase 7: Migración y portabilidad (parcial)
- [x] Documentar ubicación de la base de datos SQLite — `MIGRACION.md` (Windows `%APPDATA%\hogar-contable\`, Linux `~/.local/share/hogar-contable/`)
- [x] Backup/restore de la DB — botón Backup en la UI + procedimiento manual documentado (`MIGRACION.md`)
- [x] Procedimiento de migración a nueva PC — `MIGRACION.md` (installer o .exe portátil + restaurar DB)
- [x] Compatibilidad backward: migraciones automáticas de schema al iniciar (`internal/database/db.go` — CREATE TABLE IF NOT EXISTS, datos preservados)
- [ ] Exportar/Importar configuración (categorías personalizadas, preferencia de tema)
- [ ] Tool externo para migrar datos (las migraciones automáticas ya cubren cambios de schema)

## Extras agregados post-v1.0 (v1.1.0–v1.2.0)
- [x] Editor WYSIWYG para descripciones (react-quill) — v1.1.0
- [x] Rediseño del módulo Ahorros: cuentas, movimientos editables, multi-moneda (USD BCV, USDT, Bs) — v1.2.0
- [x] Modal de tasas manuales + fallback de API + mutex anti-SQLITE_BUSY — v1.2.0

## Pendiente real (consolidado)
- [ ] Secciones variables (personalizables)
- [ ] GitHub Actions CI/CD
- [ ] Testing E2E con Playwright
- [ ] Ampliar cobertura de tests (actual: 12 Go + 4 componentes)
- [ ] Exportar/Importar configuración (categorías personalizadas, tema)
- [ ] Video o GIF de uso básico (opcional)
