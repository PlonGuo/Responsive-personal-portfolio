import type { ContactInfo, Education, Experience, Project, Skill, SocialLink } from '../../src/types';

export type ProjectText = Pick<Project, 'title' | 'tagline' | 'description' | 'highlights'>;
export type ProjectMeta = Omit<Project, keyof ProjectText> & { id: string };
export type LocalizedProject = Project & { id: string };
export type EducationText = Omit<Education, 'year'>;
export type EducationMeta = Pick<Education, 'year'> & { id: string };
export type ExperienceText = Omit<Experience, 'year'>;
export type ExperienceMeta = Pick<Experience, 'year'> & { id: string };

export interface ProfileText {
  name: string;
  shortName: string;
  title: string;
  bio: string;
  aboutDescription: string;
  focus: string[];
}

export interface PortfolioProfile extends ProfileText {
  stats: { projects: string; companies: string };
}

export interface SharedPortfolio {
  stats: PortfolioProfile['stats'];
  projects: ProjectMeta[];
  education: EducationMeta[];
  experience: ExperienceMeta[];
  skills: Skill[];
  socialLinks: SocialLink[];
  contactInfo: ContactInfo;
}

export interface PortfolioText {
  profile: ProfileText;
  heroLines: string[];
  projects: Record<string, ProjectText>;
  education: Record<string, EducationText>;
  experience: Record<string, ExperienceText>;
}
