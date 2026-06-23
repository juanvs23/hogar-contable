# Roadmap — Hogar Contable

## Fase 1: Fundación ✅
- [x] Discovery completo
- [x] Selección de stack
- [x] Inicialización del proyecto Wails
- [x] Configurar Go backend con SQLite
- [x] Migraciones de base de datos
- [x] Diseño de componentes UI (guía de diseño)
- [x] Estructura de carpetas Clean Architecture

## Fase 2: Core ✅
- [x] CRUD de transacciones (ingresos/egresos) — crear, listar, editar, eliminar
- [x] Dashboard principal (resumen del mes)
- [x] Categorización de gastos — gestión completa + categorías default
- [x] Conversión Bs/USD (oficial + P2P) — 3 monedas: Bs, USD BCV, USDT
- [x] Cache de tipo de cambio offline — fallback automático
- [ ] Secciones variables (personalizables) — pendiente

## Fase 3: Reportes (pendiente)
- [ ] Cierre diario
- [ ] Cierre mensual
- [ ] Reporte mensual comparativo
- [ ] Reporte anual
- [ ] Comparación entre años
- [ ] Gráficos con Recharts — datos mock, falta conectar a backend real

## Fase 4: Export/Import (pendiente)
- [ ] Exportar a Excel
- [ ] Importar desde CSV
- [ ] Backup de base de datos

## Fase 5: Build & Distribución (pendiente)
- [ ] Cross-compile a Windows (.exe)
- [ ] NSIS installer
- [ ] GitHub Actions CI/CD
- [ ] Testing E2E con Playwright
- [ ] Pruebas en Windows 11

## Fase 6: Migración y portabilidad (pendiente)
- [ ] Documentar ubicación de la base de datos SQLite (`~/.local/share/hogar-contable/`)
- [ ] Script de backup/restore de la DB
- [ ] Procedimiento de migración a nueva PC:
  - Instalar Wails runtime (WebView2)
  - Copiar el .exe
  - Restaurar la base de datos
- [ ] Exportar/Importar configuración (categorías personalizadas, preferencia de tema)
- [ ] Compatibilidad backward: migración automática de schema al actualizar la app
- [ ] Tool/script para migrar datos desde versión anterior si cambia el schema
