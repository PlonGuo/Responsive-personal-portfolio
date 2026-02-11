import type {
  Skill,
  Education,
  Experience,
  Project,
  SocialLink,
  ContactInfo,
} from '../types';

export const personalInfo = {
  name: 'Huizhirong (Jason) Guo',
  shortName: 'Jason Guo',
  title: 'Software Development Engineer',
  bio: 'An software development engineer enthusiast about technology and web development. Passionate on learning new. Adore HipHop & Pop Musics. Love to play videos games.',
  aboutDescription:
    'Full-stack Software and Web developer, with extensive knowledge and years of experience, working with web & software technologies and designing.',
  stats: {
    projects: '5+',
    companies: '02+',
  },
};

export const skills: Skill[] = [
  // Languages
  { name: 'HTML', icon: 'html5', category: 'language' },
  { name: 'CSS', icon: 'css3', category: 'language' }, // Will show "CS" fallback
  { name: 'JavaScript', icon: 'javascript', category: 'language' },
  { name: 'TypeScript', icon: 'typescript', category: 'language' },
  { name: 'Python', icon: 'python', category: 'language' },
  { name: 'C++', icon: 'cplusplus', category: 'language' },
  { name: 'Go', icon: 'go', category: 'language' },
  { name: 'C#', icon: 'csharp', category: 'language' },

  // Frameworks
  { name: 'React', icon: 'react', category: 'framework' },
  { name: 'Next.js', icon: 'nextdotjs', category: 'framework' },
  { name: 'Django', icon: 'django', category: 'framework' },
  { name: 'FastAPI', icon: 'fastapi', category: 'framework' },
  { name: 'LangChain', icon: 'langchain', category: 'framework' },
  { name: 'PydanticAI', icon: 'pydantic', category: 'framework' },
  { name: 'Tailwind', icon: 'tailwindcss', category: 'framework' },
  { name: 'Vite', icon: 'vite', category: 'framework' },
  { name: 'Angular', icon: 'angular', category: 'framework' },
  { name: 'ASP .NET', icon: 'dotnet', category: 'framework' },
  { name: 'Gin', icon: 'gin', category: 'framework' },
  { name: 'Electron', icon: 'electron', category: 'framework' },

  // Database & Tools
  { name: 'Prisma', icon: 'prisma', category: 'tool' },
  { name: 'Git', icon: 'git', category: 'tool' },
  { name: 'GitHub', icon: 'github', category: 'tool' },
  { name: 'Docker', icon: 'docker', category: 'tool' },
  { name: 'Firebase', icon: 'firebase', category: 'tool' },
  { name: 'Cursor', icon: 'cursor', category: 'tool' },
  { name: 'Supabase', icon: 'supabase', category: 'tool' },
  { name: 'MongoDB', icon: 'mongodb', category: 'tool' },
  { name: 'PostgreSQL', icon: 'postgresql', category: 'tool' },
  { name: 'MySQL', icon: 'mysql', category: 'tool' },
  { name: 'SQLite', icon: 'sqlite', category: 'tool' },
  { name: 'Redis', icon: 'redis', category: 'tool' },
  { name: 'Navicat', icon: 'navicat', category: 'tool' },
  { name: 'Claude', icon: 'anthropic', category: 'tool' },
  { name: 'WebRTC', icon: 'webrtc', category: 'tool' },
  { name: 'Azure', icon: 'microsoftazure', category: 'tool' },

  // Design
  { name: 'Photoshop', icon: 'adobephotoshop', category: 'design' },
  { name: 'Illustrator', icon: 'adobeillustrator', category: 'design' },
  { name: 'InDesign', icon: 'adobeindesign', category: 'design' },
];

export const education: Education[] = [
  {
    degree: 'Master in Computer Science',
    school: 'Northeastern University',
    period: '2024 - 2026 Dec (Expected)',
    year: 2024,
  },
  {
    degree: 'Bachelor in Computer Science',
    school: 'Santa Clara University, Silicon Valley',
    period: '2020 - 2024',
    year: 2020,
  },
  {
    degree: 'High School',
    school: 'John F. Kennedy Catholic High School',
    location: 'Burien, Seattle',
    period: '2016 - 2020',
    year: 2016,
  },
];

export const experience: Experience[] = [
  {
    title: 'Software Engineer Intern ',
    company: 'Next Play Games Inc. (start up) ',
    period: 'Sep 2025 - Dec 2025',
    year: 2025,
    description:
      'Developing B2B coach dashboard using React, TypeScript, Vite for team management and analytics, enabling coaches to add users to teams, monitor individual progress, and track performance metrics with real-time data synchronization via Supabase; integrated Stripe Payment for subscription billing and automated webhook processing.',
  },
  {
    title: 'Backend Engineer Intern',
    company: 'Beijing Gesafe WEALTH Advisory Co., Ltd.',
    period: 'June 2025 - Aug 2025',
    year: 2025,
  },
  {
    title: 'Software Engineer Intern',
    company: 'Makeform.ai',
    period: 'Feb 2025 - Present',
    description:
      'An innovative platform that empowers users to easily design and deploy dynamic online forms using AI, enhancing productivity and user engagement.',
    year: 2025,
  },
  {
    title: 'Software Engineer Intern',
    company: 'China Shipbuilding Orlando Wuxi Software Technology Co., Ltd.',
    period: 'Jun 2024 - Sep 2024',
    year: 2024,
  },
  {
    title: 'Fullstack Intern',
    company: 'National Supercomputing Center in Wuxi',
    period: 'Jun 2023 - Aug 2024',
    year: 2023,
  },
];

export const projects: Project[] = [
  // 2026 Projects
  {
    title: 'GoChatroom',
    description:
      'Real-time chat application with React frontend and Go backend, deployed on Vercel + Fly.io',
    image: '/images/go-chatroom.png',
    githubUrl: 'https://github.com/PlonGuo/GoChatroom',
    demoUrl: 'https://frontend-three-pied-39.vercel.app',
    technologies: ['React', 'Go', 'WebSocket', 'Vercel', 'Fly.io'],
    year: 2026,
  },
  {
    title: 'Travel Agent Booking System',
    description:
      'A comprehensive booking management system designed for travel agents to track flights, hotels, and insurance payments with customer payment tracking.',
    image: '/images/travel-agent-booking-system.png',
    githubUrl: 'https://github.com/PlonGuo/Travel-Agent-Booking-System',
    technologies: ['React', 'TypeScript', 'Supabase'],
    year: 2026,
  },
  {
    title: 'Flowboard',
    description:
      'Real-time collaborative kanban board with AI assistant and interactive whiteboard. Built with .NET 8 & Angular 17',
    image: '/images/flowboard-demo.png',
    githubUrl: 'https://github.com/PlonGuo/flowboard',
    demoUrl: 'https://red-pond-0f305f80f.4.azurestaticapps.net',
    technologies: ['.NET 8', 'Angular 17', 'AI', 'Kanban'],
    year: 2026,
  },
  // 2025 Projects
  {
    title: 'Sportlingo Coaching Dashboard',
    description:
      'B2B coach dashboard for team management and analytics, enabling coaches to add users to teams, monitor individual progress, and track performance metrics.',
    image: '/images/coach_dashboard.png',
    demoUrl: 'https://www.sportlingo.ai/',
    technologies: ['React', 'Supabase', 'AI', 'TypeScript'],
    year: 2025,
  },
  {
    title: 'Makeform.ai',
    description:
      'An innovative platform that empowers users to easily design and deploy dynamic online forms using AI, enhancing productivity and user engagement.',
    image: '/images/makeform.jpg',
    demoUrl: 'https://www.makeform.ai/',
    technologies: ['React', 'Next.js', 'AI', 'TypeScript'],
    year: 2025,
  },
  // Older Projects
  {
    title: 'GitHub Finder',
    description:
      'A web-based application that allows users to search for any GitHub account and browse their profile information.',
    image: '/images/github-finder.jpg',
    githubUrl: 'https://github.com/PlonGuo/GithubFinder.git',
    demoUrl: 'https://github-finder-three-pink.vercel.app/',
    technologies: ['React', 'GitHub API', 'Tailwind CSS'],
    year: 2024,
  },
  {
    title: 'Food E-commerce Platform',
    description: 'An online store for browsing and purchasing food products.',
    image: '/images/e-commerce.jpg',
    githubUrl: 'https://github.com/PlonGuo/Ecommerce-Platform',
    technologies: ['Python', 'Django', 'Bootstrap', 'SQLite'],
    year: 2023,
  },
];

export const socialLinks: SocialLink[] = [
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/jasonguo1104',
    icon: 'linkedin',
  },
  {
    name: 'GitHub',
    url: 'https://github.com/PlonGuo',
    icon: 'github',
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/jasonguo4403/',
    icon: 'instagram',
  },
  {
    name: 'Bluesky',
    url: 'https://bsky.app/profile/huizhirongguo.bsky.social',
    icon: 'bluesky',
  },
];

export const contactInfo: ContactInfo = {
  phone: ['(+1) 669-214-8407', '(+86) 199-5270-9509'],
  email: ['jason.ghzr@gmail.com', '1070221333@qq.com'],
};
