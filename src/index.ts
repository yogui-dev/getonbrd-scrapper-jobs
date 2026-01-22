#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { JobController } from './domain/controllers/job-controller.js';
import { DEFAULT_LIST_URL } from './domain/services/job-scraper-service.js';
import type { JobProps } from './domain/models/job-posting.js';

const controller = new JobController();

const DEFAULT_ORIGIN = new URL(DEFAULT_LIST_URL).origin;

const helpMessage = `
getonbrd-scrapper-jobs

Uso:
  pnpm run scrape -- [opciones]

Opciones:
  --page, -p <n>        Página a solicitar (default: 1)
  --limit, -l <n>       Número máximo de empleos a devolver
  --url <url>           URL base a scrappear (default: ${DEFAULT_LIST_URL})
  --file <ruta>         HTML local a parsear (omite request HTTP)
  --origin <url>        Origen a usar al parsear HTML local (default: ${DEFAULT_ORIGIN})
  --format <json|table> Formato de salida (default: json)
  --output, -o <ruta>   Guarda el resultado JSON en disco
  --txt-dir <ruta>      Carpeta destino para generar un .txt por empleo
  --quiet               Oculta salida en consola (solo válido con --output)
  --help, -h            Muestra esta ayuda
`;

type OutputFormat = 'json' | 'table';

interface CliArgs {
  help?: boolean;
  page: number;
  limit?: number;
  url?: string;
  file?: string;
  origin?: string;
  format: OutputFormat;
  output?: string;
  txtDir?: string;
  quiet: boolean;
}

const parseArgs = (argv: string[]): CliArgs => {
  const args: CliArgs = { page: 1, format: 'json', quiet: false };

  const nextValue = (token: string, index: number): string => {
    if (token.includes('=')) {
      return token.split('=').slice(1).join('=');
    }

    const value = argv[index + 1];
    if (value === undefined) {
      throw new Error(`El argumento ${token} requiere un valor`);
    }

    return value;
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const flag = token.split('=')[0];

    switch (flag) {
      case '--help':
      case '-h':
        args.help = true;
        break;
      case '--page':
      case '-p': {
        const value = nextValue(token, i);
        args.page = Number(value);
        if (Number.isNaN(args.page) || args.page < 1) {
          throw new Error('El parámetro --page debe ser un número >= 1');
        }
        if (!token.includes('=')) i += 1;
        break;
      }
      case '--limit':
      case '-l': {
        const value = nextValue(token, i);
        args.limit = Number(value);
        if (Number.isNaN(args.limit) || args.limit <= 0) {
          throw new Error('El parámetro --limit debe ser un número > 0');
        }
        if (!token.includes('=')) i += 1;
        break;
      }
      case '--url': {
        const value = nextValue(token, i);
        args.url = value;
        if (!token.includes('=')) i += 1;
        break;
      }
      case '--file': {
        const value = nextValue(token, i);
        args.file = value;
        if (!token.includes('=')) i += 1;
        break;
      }
      case '--origin': {
        const value = nextValue(token, i);
        args.origin = value;
        if (!token.includes('=')) i += 1;
        break;
      }
      case '--format': {
        const value = nextValue(token, i) as OutputFormat;
        args.format = value;
        if (!token.includes('=')) i += 1;
        break;
      }
      case '--txt-dir': {
        const value = nextValue(token, i);
        args.txtDir = value;
        if (!token.includes('=')) i += 1;
        break;
      }
      case '--output':
      case '-o': {
        const value = nextValue(token, i);
        args.output = value;
        if (!token.includes('=')) i += 1;
        break;
      }
      case '--quiet':
        args.quiet = true;
        break;
      default:
        if (token.startsWith('--')) {
          throw new Error(`Argumento desconocido: ${token}`);
        }
    }
  }

  if (args.quiet && !args.output) {
    throw new Error('La opción --quiet requiere --output para escribir la data en disco.');
  }

  if (!['json', 'table'].includes(args.format)) {
    throw new Error('Los formatos soportados son "json" y "table".');
  }

  return args;
};

interface CliResult {
  source: string;
  page: number;
  total: number;
  jobs: JobProps[];
}

const formatResult = (result: CliResult, format: OutputFormat = 'json') => {
  if (format === 'table') {
    const table = result.jobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      type: job.jobType,
      location: job.location,
      modality: job.modality,
      remote: job.remote ? 'Sí' : 'No',
      publishedAt: job.publishedAt,
      salary: job.salary
    }));
    console.table(table);
    return;
  }

  if (format !== 'json') {
    throw new Error(`Formato desconocido: ${format}`);
  }

  console.log(JSON.stringify(result, null, 2));
};

const writeOutput = async (filepath: string | undefined, result: CliResult) => {
  if (!filepath) return;
  const target = path.resolve(process.cwd(), filepath);
  const data = JSON.stringify(result, null, 2);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, `${data}\n`, 'utf8');
  console.info(`✔️  Resultado guardado en ${target}`);
};

const sanitizeFilename = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

const formatJobAsText = (job: JobProps): string => {
  const parts = [
    `Título: ${job.title}`,
    `Empresa: ${job.company ?? 'N/D'}`,
    `Tipo: ${job.jobType ?? 'N/D'}`,
    `Ubicación: ${job.location ?? 'N/D'}`,
    `Modalidad: ${job.modality ?? 'N/D'}`,
    `Remoto: ${job.remote ? 'Sí' : 'No'}`,
    `Publicado: ${job.publishedAt ?? 'N/D'}`,
    `Salario: ${job.salary ?? 'N/D'}`,
    `Badges: ${job.badges.length ? job.badges.join(', ') : 'N/A'}`,
    `Beneficios: ${job.perks.length ? job.perks.join(', ') : 'N/A'}`,
    `Link: ${job.link}`,
    `Descripción: ${job.description ?? 'N/D'}`
  ];

  return `${parts.join('\n')}\n`;
};

const writeTxtFiles = async (dir: string | undefined, jobs: JobProps[]) => {
  if (!dir || !jobs?.length) return;
  const targetDir = path.resolve(process.cwd(), dir);
  await fs.mkdir(targetDir, { recursive: true });

  await Promise.all(
    jobs.map(async (job) => {
      const filename = `${sanitizeFilename(job.id || job.title || 'job') || 'job'}.txt`;
      const target = path.join(targetDir, filename);
      await fs.writeFile(target, formatJobAsText(job), 'utf8');
    })
  );

  console.info(`✔️  Archivos .txt generados en ${targetDir}`);
};

async function run() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      console.log(helpMessage.trim());
      return;
    }

    let result: CliResult;
    if (args.file) {
      const html = await fs.readFile(path.resolve(process.cwd(), args.file), 'utf8');
      const origin = args.origin || DEFAULT_ORIGIN;
      const sourceUrl = args.url || DEFAULT_LIST_URL;
      const jobs = controller.parseOfflinePlain(html, { origin, limit: args.limit, sourceUrl });
      result = { source: sourceUrl, page: args.page ?? 1, total: jobs.length, jobs };
    } else {
      result = await controller.scrapePlain({ baseUrl: args.url || DEFAULT_LIST_URL, page: args.page, limit: args.limit });
    }

    await writeOutput(args.output, result);
    await writeTxtFiles(args.txtDir, result.jobs);
    if (!args.quiet) {
      formatResult(result, args.format);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`❌  ${message}`);
    process.exitCode = 1;
  }
}

run();
