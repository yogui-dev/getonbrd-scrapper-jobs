import { JobScraperService, type ParseJobsOptions, type ScrapeOptions, type ScrapeResult } from '../services/job-scraper-service.js';
import { JobPosting, type JobProps } from '../models/job-posting.js';

export class JobController {
  constructor(private readonly scraperService = new JobScraperService()) {}

  async scrape(options: ScrapeOptions = {}): Promise<ScrapeResult<JobPosting>> {
    return this.scraperService.scrapeProgrammingJobs(options);
  }

  async scrapePlain(options: ScrapeOptions = {}): Promise<ScrapeResult<JobProps>> {
    const result = await this.scrape(options);
    return {
      source: result.source,
      page: result.page,
      total: result.jobs.length,
      jobs: result.jobs.map((job) => job.toPlainObject())
    };
  }

  async parseOfflineHtml(html: string, options: ParseJobsOptions = {}): Promise<JobPosting[]> {
    const { withDetails, ...parseOptions } = options;
    const jobs = this.scraperService.parseFromHtml(html, parseOptions);
    return this.scraperService.attachJobDetails(jobs, Boolean(withDetails));
  }

  async parseOfflinePlain(html: string, options: ParseJobsOptions = {}): Promise<JobProps[]> {
    const jobs = await this.parseOfflineHtml(html, options);
    return jobs.map((job) => job.toPlainObject());
  }
}
