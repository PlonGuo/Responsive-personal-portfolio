export interface Skill {
  name: string;
  icon: string;
  category: 'language' | 'framework' | 'ai' | 'data' | 'tool';
}

export interface Education {
  degree: string;
  school: string;
  college?: string;
  location?: string;
  period: string;
  note?: string;
  year: number;
}

export interface Experience {
  title: string;
  company: string;
  companyNote?: string;
  location?: string;
  period: string;
  summary?: string;
  highlights?: string[];
  /** @deprecated 用 highlights 代替；保留仅为 Phase 3 迁移前的兼容 */
  description?: string;
  year: number;
}

export interface Project {
  title: string;
  tagline?: string;
  description: string;
  highlights?: string[];
  image: string;
  demoUrl?: string;
  githubUrl?: string;
  technologies: string[];
  year: number;
  featured?: boolean;
}

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

export interface ContactInfo {
  phone: string[];
  email: string[];
}

// Chat types
export * from './chat';
