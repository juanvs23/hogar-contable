# Migración y Portabilidad — Hogar Contable

## Requisitos del sistema

### Windows
- **Windows 10 u 11** (64 bits)
- **WebView2 Runtime** — Viene preinstalado en Windows 11.
  En Windows 10 el installer NSIS lo descarga automáticamente si falta.
- No requiere instalación de Go, Node, ni ninguna otra dependencia.

### Linux (desarrollo)
- Ubuntu 24.04+ o similar
- `libgtk-3-dev`, `libwebkit2gtk-4.1-dev`
- Go 1.25+, Node 18+

---

## Ubicación de la base de datos

La base de datos SQLite se guarda automáticamente en:

| Sistema | Ruta |
|---------|------|
| **Windows** | `%APPDATA%\hogar-contable\hogar-contable.db` |
| **Linux** | `~/.local/share/hogar-contable/hogar-contable.db` |

La base de datos contiene **todos los datos**: transacciones, categorías, ahorros, cierres contables y tasas de cambio cacheadas.

---

## Backup manual

### Desde la app
1. Abrí la app
2. Andá a la sección **Reportes**
3. Presioná el botón **Backup**
4. Elegí dónde guardar el archivo `.db`

### Manualmente (app cerrada)
```bash
# Windows (cmd)
copy "%APPDATA%\hogar-contable\hogar-contable.db" "D:\backups\hogar-contable_2026-06-25.db"

# Linux
cp ~/.local/share/hogar-contable/hogar-contable.db ~/backups/hogar-contable_2026-06-25.db
```

---

## Restaurar un backup

1. **Cerrá la app** completamente
2. Reemplazá el archivo de la base de datos por el backup:

```bash
# Windows (cmd)
copy "D:\backups\hogar-contable_2026-06-25.db" "%APPDATA%\hogar-contable\hogar-contable.db"

# Linux
cp ~/backups/hogar-contable_2026-06-25.db ~/.local/share/hogar-contable/hogar-contable.db
```

3. Iniciá la app — los datos deberían estar restaurados

> ⚠️ **Importante**: La app corre migraciones automáticas al iniciar. Si el backup es de una versión anterior, las nuevas columnas/tablas se agregan solas sin perder datos.

---

## Migrar a una PC nueva

### Opción 1: Usando el installer (recomendado)

1. En la PC **vieja**: hacé un **Backup** desde la app (botón Backup en Reportes)
2. Copiá el archivo `.db` a la nueva PC (USB, nube, etc.)
3. En la PC **nueva**:
   - Descargá el installer `hogar-contable-amd64-installer.exe`
   - Ejecutalo — instala la app + WebView2 si hace falta
   - **No abras la app todavía**
4. Copiá el backup a la carpeta de datos:
   ```
   %APPDATA%\hogar-contable\hogar-contable.db
   ```
5. Iniciá la app — los datos están migrados

### Opción 2: Ejecutable portátil

1. Copiá `hogar-contable.exe` a la nueva PC
2. Copiá el backup de la base de datos
3. Ejecutá el `.exe` — la primera vez crea la carpeta de datos vacía
4. **Cerrá la app**
5. Reemplazá la base de datos creada con tu backup
6. Iniciá la app de nuevo

---

## Compatibilidad hacia atrás

La app corre **migraciones automáticas** cada vez que inicia:

- Si el schema cambia en una versión nueva, las tablas se actualizan solas
- `ALTER TABLE ... ADD COLUMN` — si la columna ya existe, se saltea
- `CREATE TABLE IF NOT EXISTS` — no duplica tablas
- Las categorías default se refrescan en cada inicio (no afecta categorías personalizadas)
- Los datos existentes **nunca se borran** durante las migraciones

---

## Solución de problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| "No se puede conectar con el backend" | Se accedió por Vite directo (puerto 5173) | Usar http://localhost:34115 o la app nativa |
| Pantalla negra al iniciar | WebView2 no instalado (Windows 10) | Ejecutar el installer NSIS que lo instala |
| Base de datos corrupta | Corte de energía mientras escribía | Restaurar desde backup |
| Tasas de cambio no disponibles | Sin internet | Se usa el último valor cacheados |
