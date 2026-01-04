import type { Skill, Education, Experience, Project, SocialLink, ContactInfo } from '../types';

export const personalInfo = {
  name: 'Huizhirong (Jason) Guo',
  shortName: 'Jason Guo',
  title: 'Software Development Engineer',
  bio: 'An software development engineer enthusiast about technology and web development. Passionate on learning new. Adore HipHop & Pop Musics. Love to play videos games.',
  aboutDescription: 'Full-stack Software and Web developer, with extensive knowledge and years of experience, working with web & software technologies and designing.',
  stats: {
    projects: '5+',
    companies: '02+'
  }
};

export const skills: Skill[] = [
  // Languages
  { name: 'HTML', icon: 'html5', category: 'language' },
  { name: 'CSS', icon: 'css3', category: 'language' },
  { name: 'JavaScript', icon: 'javascript', category: 'language' },
  { name: 'TypeScript', icon: 'typescript', category: 'language' },
  { name: 'Python', icon: 'python', category: 'language' },
  { name: 'C++', icon: 'cplusplus', category: 'language' },
  { name: 'C#', icon: 'csharp', category: 'language' },
  { name: 'Java', icon: 'java', category: 'language' },

  // Frameworks
  { name: 'React', icon: 'react', category: 'framework' },
  { name: 'Next.js', icon: 'nextdotjs', category: 'framework' },
  { name: 'Node.js', icon: 'nodedotjs', category: 'framework' },
  { name: 'Django', icon: 'django', category: 'framework' },
  { name: 'Bootstrap', icon: 'bootstrap', category: 'framework' },

  // Tools
  { name: 'Git', icon: 'git', category: 'tool' },
  { name: 'GitHub', icon: 'github', category: 'tool' },
  { name: 'Docker', icon: 'docker', category: 'tool' },
  { name: 'AWS', icon: 'amazonwebservices', category: 'tool' },
  { name: 'Firebase', icon: 'firebase', category: 'tool' },
  { name: 'VS Code', icon: 'visualstudiocode', category: 'tool' },
  { name: 'Cursor', icon: 'cursor', category: 'tool' },
  { name: 'Linux', icon: 'linux', category: 'tool' },

  // Design
  { name: 'Photoshop', icon: 'adobephotoshop', category: 'design' },
  { name: 'Illustrator', icon: 'adobeillustrator', category: 'design' },
  { name: 'InDesign', icon: 'adobeindesign', category: 'design' },
  { name: 'MATLAB', icon: 'mathworks', category: 'tool' },
];

export const education: Education[] = [
  {
    degree: 'Master in Computer Science',
    school: 'Northeastern University',
    period: '2024 - 2026 April (Expected)',
    year: 2024
  },
  {
    degree: 'Bachelor in Computer Science',
    school: 'Santa Clara University, Silicon Valley',
    period: '2020 - 2024',
    year: 2020
  },
  {
    degree: 'High School',
    school: 'John F. Kennedy Catholic High School',
    location: 'Burien, Seattle',
    period: '2016 - 2020',
    year: 2016
  }
];

export const experience: Experience[] = [
  {
    title: 'Backend Engineer Intern',
    company: 'Beijing Gesafe WEALTH Advisory Co., Ltd.',
    period: 'June 2025 - Aug 2025',
    year: 2025
  },
  {
    title: 'Software Engineer Intern',
    company: 'Makeform.ai',
    period: 'Feb 2025 - Present',
    description: 'An innovative platform that empowers users to easily design and deploy dynamic online forms using AI, enhancing productivity and user engagement.',
    year: 2025
  },
  {
    title: 'Software Engineer Intern',
    company: 'China Shipbuilding Orlando Wuxi Software Technology Co., Ltd.',
    period: 'Jun 2024 - Sep 2024',
    year: 2024
  },
  {
    title: 'Fullstack Intern',
    company: 'National Supercomputing Center in Wuxi',
    period: 'Jun 2023 - Aug 2024',
    year: 2023
  }
];

export const projects: Project[] = [
  {
    title: 'User Feedback Platform',
    description: 'A web-based application that allows users to leave feedback and manage their input efficiently. It offers a user-friendly interface for submitting, editing, and deleting feedback.',
    image: '/images/user-feedback-demo.jpg',
    demoUrl: 'https://user-feedback-platform.vercel.app/',
    technologies: ['React', 'TypeScript', 'Tailwind CSS']
  },
  {
    title: 'GitHub Finder',
    description: 'A web-based application that allows users to search for any GitHub account and browse their profile information.',
    image: '/images/github-finder.jpg',
    demoUrl: 'https://github-finder-three-pink.vercel.app/',
    technologies: ['React', 'GitHub API', 'Tailwind CSS']
  },
  {
    title: 'House Market Platform',
    description: 'A platform for buying, selling, and renting properties with user authentication and image uploads.',
    image: '/images/house-market.jpg',
    demoUrl: 'https://house-market-project-49859jrmt-huizhirong-guos-projects.vercel.app/',
    technologies: ['React', 'Tailwind', 'Node.js', 'Firebase']
  },
  {
    title: 'Food E-commerce Platform',
    description: 'An online store for browsing and purchasing food products.',
    image: '/images/e-commerce.jpg',
    githubUrl: 'https://github.com/PlonGuo/Ecommerce-Platform',
    technologies: ['Python', 'Django', 'Bootstrap', 'SQLite']
  },
  {
    title: 'Makeform.ai',
    description: 'An innovative platform that empowers users to easily design and deploy dynamic online forms using AI, enhancing productivity and user engagement.',
    image: '/images/makeform.jpg',
    demoUrl: 'https://www.makeform.ai/',
    technologies: ['React', 'Next.js', 'AI', 'TypeScript']
  }
];

export const socialLinks: SocialLink[] = [
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/jasonguo1104',
    icon: 'linkedin'
  },
  {
    name: 'GitHub',
    url: 'https://github.com/PlonGuo',
    icon: 'github'
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/jasonguo4403/',
    icon: 'instagram'
  },
  {
    name: 'Bluesky',
    url: 'https://bsky.app/profile/huizhirongguo.bsky.social',
    icon: 'bluesky'
  }
];

export const contactInfo: ContactInfo = {
  phone: ['(+1) 669-214-8407', '(+86) 199-5270-9509'],
  email: ['jason.ghzr@gmail.com', '1070221333@qq.com']
};
