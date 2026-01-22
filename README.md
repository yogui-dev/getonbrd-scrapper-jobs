# GetOnBrd Scrapper Jobs

Scraper y CLI en Node.js + pnpm para obtener el listado de empleos de programación publicado en [Get on Board](https://www.getonbrd.cl/jobs/programacion). Expone tanto comandos listos para usar como funciones reutilizables en otros proyectos.

## Requisitos

- Node.js >= 20
- pnpm >= 10

Instala las dependencias con:

```bash
pnpm install
```

## Uso rápido del CLI

```bash
pnpm run scrape -- [opciones]
```

Opciones disponibles:

| Opción | Descripción |
| --- | --- |
| `--page`, `-p` | Número de página a solicitar (default: 1). |
| `--limit`, `-l` | Máximo de registros a devolver (se filtra tras el parseo). |
| `--url` | URL base del listado. Útil si GetOnBrd cambia el dominio. |
| `--file` | Ruta a un HTML local para parsear sin hacer request. |
| `--origin` | Origen base (scheme + host) para resolver URLs al parsear archivos locales. |
| `--format` | `json` (default) o `table` para una vista tabular resumida. |
| `--output`, `-o` | Guarda el resultado JSON en disco. |
| `--txt-dir` | Carpeta destino para generar un `.txt` por cada empleo. |
| `--quiet` | Suprime la salida en consola (requiere `--output`). |
| `--help`, `-h` | Muestra la ayuda integrada. |

### Ejemplos

Obtener los primeros 5 empleos en formato JSON:

```bash
pnpm run scrape -- --limit 5
```

Ver la información en tabla para una página específica:

```bash
pnpm run scrape -- --page 2 --limit 10 --format table
```

Guardar la data en disco sin imprimir nada:

```bash
pnpm run scrape -- --limit 25 --output data/jobs.json --quiet
```

Parsear el HTML descargado localmente (incluido `sample.html`):

```bash
pnpm run scrape -- --file sample.html --origin https://www.getonbrd.cl --url https://www.getonbrd.cl/jobs/programacion
```

Exportar cada oferta a un archivo `.txt` dentro de la carpeta `exports/txt`:

```bash
pnpm run scrape -- --limit 10 --txt-dir exports/txt
```

## Uso programático

```js
import { scrapeProgrammingJobs, parseJobsFromHtml } from './src/scraper.js';

const { jobs } = await scrapeProgrammingJobs({ limit: 5 });
console.log(jobs.map(({ title, company }) => `${title} @ ${company}`));
```

Para parsear un HTML previamente descargado:

```js
import fs from 'node:fs/promises';
import { parseJobsFromHtml } from './src/scraper.js';

const html = await fs.readFile('sample.html', 'utf8');
const jobs = parseJobsFromHtml(html, {
  origin: 'https://www.getonbrd.cl',
  sourceUrl: 'https://www.getonbrd.cl/jobs/programacion',
  limit: 10
});
```

Cada job validado incluye:

- `id`, `title`, `company`
- `jobType`, `location`, `modality`, `remote`
- `publishedAt`, `salary`, `badges`, `perks`
- `link`, `color`, `description`, `companyLogo`
- `source`, `scrapedAt`

## Estructura del proyecto

```
├── sample.html       # HTML real para pruebas offline
├── src
│   ├── scraper.js    # Lógica de parsing + requests HTTP (got + cheerio + zod)
│   └── index.js      # CLI que orquesta argumentos y salidas
├── README.md
└── tags.json
```

## Buenas prácticas de scraping

1. **Respeta el sitio**: evita ejecutar scraping agresivo; este CLI solo requiere una solicitud por ejecución.
2. **Identifícate**: el encabezado `User-Agent` del proyecto explica el origen del tráfico.
3. **Cachea si es posible**: guarda resultados para usos posteriores y minimiza llamadas.
4. **Cumple con los términos**: revisa políticas de uso de Get on Board antes de automatizar.

## Próximos pasos sugeridos

- Añadir tests automatizados para `parseJobsFromHtml` usando fixtures.
- Empaquetar el CLI como binario (`bin` en package.json) para instalarlo globalmente.
- Exponer filtros adicionales (por modalidad, remote, etc.) directamente desde la línea de comandos.
