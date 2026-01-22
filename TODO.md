# TODO del proyecto

## ✅ Completado
- Migración total a TypeScript (CLI, scraper modular, tsconfig y scripts pnpm).
- Scraping enriquecido con `--with-details` (descripciones extendidas, secciones, link de postulación).
- Captura de logo HQ, perfil de empresa, sitio externo y conversión de logo a arte ASCII para los `.txt`.
- Exportación individual via `--txt-dir` con toda la metadata y bloques ASCII.

## 🚧 Pendiente
1. **Integrar Supabase/Postgres para persistencia**
   - Dependencias y configuración `.env`.
   - CLI flags para credenciales.
   - Inserción/upsert de empleos y manejo de errores.
   - Documentación del flujo.

2. **Actualizar README y plantilla `.env`**
   - Documentar `--with-details`, campos enriquecidos y requisitos para ASCII.
   - Agregar instrucciones de Supabase/Postgres y ejemplos de uso.
