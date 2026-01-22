import got from 'got';
import * as cheerio from 'cheerio';
import { z } from 'zod';

export const DEFAULT_LIST_URL = 'https://www.getonbrd.cl/jobs/programacion';
const DEFAULT_HEADERS = {
  'user-agent': 'getonbrd-scraper/0.1 (+https://github.com/)',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
};

const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string().optional(),
  jobType: z.string().optional(),
  location: z.string().optional(),
  modality: z.string().optional(),
  remote: z.boolean(),
  publishedAt: z.string().optional(),
  salary: z.string().optional(),
  badges: z.array(z.string()),
  perks: z.array(z.string()),
  link: z.string().url(),
  color: z.string().optional(),
  description: z.string().optional(),
  companyLogo: z.string().url().optional(),
  source: z.string().url(),
  scrapedAt: z.string()
});

const JobListSchema = z.array(JobSchema);

const normalizeText = (value = '') => value.replace(/\s+/g, ' ').trim();

const toAbsoluteUrl = (value, origin) => {
  if (!value) return undefined;
  try {
    return new URL(value, origin).href;
  } catch {
    return undefined;
  }
};

const pickSalary = (root) => {
  if (!root || root.length === 0) return undefined;
  const clone = root.clone();
  clone.find('i').remove();
  const text = normalizeText(clone.text());
  return text || undefined;
};

const extractModality = (locationText) => {
  if (!locationText) return { location: undefined, modality: undefined };
  const modalityMatch = locationText.match(/\(([^)]+)\)/);
  return {
    location: normalizeText(locationText.replace(/\(([^)]+)\)/, '').trim()),
    modality: modalityMatch ? normalizeText(modalityMatch[1]) : undefined
  };
};

export function parseJobsFromHtml(html, { origin = new URL(DEFAULT_LIST_URL).origin, limit, sourceUrl = DEFAULT_LIST_URL } = {}) {
  const $ = cheerio.load(html);
  const jobs = [];
  $('ul.sgb-results-list > a.gb-results-list__item').each((_, element) => {
    if (limit && jobs.length >= limit) return false;

    const anchor = $(element);
    const titleElement = anchor.find('.gb-results-list__title').first();
    const title = normalizeText(titleElement.find('strong').first().text()) || normalizeText(titleElement.text());
    if (!title) return;

    const jobType = normalizeText(titleElement.find('.opacity-half').first().text()) || undefined;
    const infoBlock = anchor.find('.gb-results-list__info .size0').first();
    const company = normalizeText(infoBlock.find('strong').first().text()) || undefined;

    const locationBlock = normalizeText(anchor.find('.location').first().text()) || undefined;
    const { location, modality } = extractModality(locationBlock);
    const remote = /remot/i.test(locationBlock || '') || anchor.find('.icon-wifi').length > 0;

    const companyLogo = anchor.find('.gb-results-list__img').attr('data-src') || anchor.find('.gb-results-list__img').attr('src');
    const description = anchor.attr('title') ? normalizeText(anchor.attr('title')) : undefined;
    const color = anchor.attr('data-color') || undefined;

    const salaryNode = anchor.find('.gb-results-list__badges').find('.icon-money-bill').parent();
    const salary = pickSalary(salaryNode);

    const publishedAt = normalizeText(anchor.find('.gb-results-list__secondary .opacity-half.size0').last().text()) || undefined;

    const badges = anchor
      .find('.gb-results-list__badges .badge')
      .map((__, badge) => normalizeText($(badge).text()))
      .get()
      .filter(Boolean);

    const perks = anchor
      .find('.gb-perks-list i')
      .map((__, perk) => normalizeText($(perk).attr('title') || ''))
      .get()
      .filter(Boolean);

    const link = toAbsoluteUrl(anchor.attr('href'), origin);
    if (!link) return;

    const id = link.split('/').filter(Boolean).pop();
    if (!id) return;

    const job = {
      id,
      title,
      company,
      jobType,
      location,
      modality,
      remote,
      publishedAt,
      salary,
      badges,
      perks: Array.from(new Set(perks)),
      link,
      color,
      description,
      companyLogo: toAbsoluteUrl(companyLogo, origin),
      source: sourceUrl,
      scrapedAt: new Date().toISOString()
    };

    jobs.push(job);
  });

  const parsed = JobListSchema.safeParse(jobs);
  if (!parsed.success) {
    throw new Error(`Error validando empleos: ${parsed.error.message}`);
  }

  return limit ? parsed.data.slice(0, limit) : parsed.data;
}

export async function scrapeProgrammingJobs({ baseUrl = DEFAULT_LIST_URL, page = 1, limit } = {}) {
  const url = new URL(baseUrl);
  if (page && page > 1) {
    url.searchParams.set('page', String(page));
  }

  const html = await got(url.toString(), { headers: DEFAULT_HEADERS }).text();
  const origin = `${url.protocol}//${url.host}`;
  const jobs = parseJobsFromHtml(html, { origin, limit, sourceUrl: url.toString() });

  return {
    source: url.toString(),
    page,
    total: jobs.length,
    jobs
  };
}
