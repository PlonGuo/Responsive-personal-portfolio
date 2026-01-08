export interface Skill {
  name: string;
  icon: string;
  category: 'language' | 'framework' | 'tool' | 'design';
}

export interface Education {
  degree: string;
  school: string;
  location?: string;
  period: string;
  year: number;
}

export interface Experience {
  title: string;
  company: string;
  period: string;
  description?: string;
  year: number;
}

export interface Project {
  title: string;
  description: string;
  image: string;
  demoUrl?: string;
  githubUrl?: string;
  technologies: string[];
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
