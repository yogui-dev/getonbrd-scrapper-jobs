import { z } from 'zod';

const JobDetailSectionSchema = z.object({
  title: z.string(),
  content: z.string()
});

const JobBenefitSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  icon: z.string().optional()
});

export const JobSchema = z.object({
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
  companyLogoFull: z.string().url().optional(),
  companyProfileUrl: z.string().url().optional(),
  companySite: z.string().url().optional(),
  companyLogoAscii: z.string().optional(),
  source: z.string().url(),
  scrapedAt: z.string(),
  applyUrl: z.string().url().optional(),
  detailHtml: z.string().optional(),
  detailText: z.string().optional(),
  detailSections: z.array(JobDetailSectionSchema).optional(),
  benefitsDetailed: z.array(JobBenefitSchema).optional()
});

export type JobProps = z.infer<typeof JobSchema>;
export type JobDetailSection = z.infer<typeof JobDetailSectionSchema>;
export type JobBenefit = z.infer<typeof JobBenefitSchema>;

export class JobPosting {
  private constructor(private readonly props: JobProps) {}

  static create(data: z.input<typeof JobSchema>): JobPosting {
    const parsed = JobSchema.parse(data);
    return new JobPosting(parsed);
  }

  get id() {
    return this.props.id;
  }

  get title() {
    return this.props.title;
  }

  get company() {
    return this.props.company;
  }

  get jobType() {
    return this.props.jobType;
  }

  get location() {
    return this.props.location;
  }

  get modality() {
    return this.props.modality;
  }

  get remote() {
    return this.props.remote;
  }

  get publishedAt() {
    return this.props.publishedAt;
  }

  get salary() {
    return this.props.salary;
  }

  get badges() {
    return [...this.props.badges];
  }

  get perks() {
    return [...this.props.perks];
  }

  get link() {
    return this.props.link;
  }

  get color() {
    return this.props.color;
  }

  get description() {
    return this.props.description;
  }

  get companyLogo() {
    return this.props.companyLogo;
  }

  get companyLogoFull() {
    return this.props.companyLogoFull;
  }

  get companyProfileUrl() {
    return this.props.companyProfileUrl;
  }

  get companySite() {
    return this.props.companySite;
  }

  get companyLogoAscii() {
    return this.props.companyLogoAscii;
  }

  get source() {
    return this.props.source;
  }

  get scrapedAt() {
    return this.props.scrapedAt;
  }

  get applyUrl() {
    return this.props.applyUrl;
  }

  get detailHtml() {
    return this.props.detailHtml;
  }

  get detailText() {
    return this.props.detailText;
  }

  get detailSections() {
    return this.props.detailSections ? [...this.props.detailSections] : undefined;
  }

  get benefitsDetailed() {
    return this.props.benefitsDetailed ? [...this.props.benefitsDetailed] : undefined;
  }

  toPlainObject(): JobProps {
    return {
      ...this.props,
      badges: this.badges,
      perks: this.perks
    };
  }

  toJSON(): JobProps {
    return this.toPlainObject();
  }
}
