import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// --- INITIALIZATION ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- CONSTANTS ---
const MAX_REQUESTS_PER_HOUR = 30;
const MAX_TOKENS_PER_HOUR = 100000;
const MAX_INPUT_LENGTH = 1000;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

const ALLOWED_ORIGINS = [
  'https://plonguo.com',
  'https://www.plonguo.com',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000', // vercel dev default port
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

// --- SECURITY LAYER 1: Method Validation ---
function validateMethod(req: VercelRequest): boolean {
  return req.method === 'POST';
}

// --- SECURITY LAYER 2: CORS Validation ---
function validateCORS(origin: string | undefined): boolean {
  // In development, allow all localhost origins
  if (
    origin &&
    (origin.includes('localhost') || origin.includes('127.0.0.1'))
  ) {
    return true;
  }
  return origin ? ALLOWED_ORIGINS.includes(origin) : false;
}

// --- SECURITY LAYER 3: Turnstile Verification ---
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: ip,
        }),
      }
    );
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
}

// --- SECURITY LAYER 4: Rate Limiting with Supabase ---
interface RateLimitResult {
  allowed: boolean;
  reason?: string;
}

async function checkRateLimit(
  ipAddress: string,
  sessionId: string
): Promise<RateLimitResult> {
  const key = `${ipAddress}:${sessionId}`;
  const now = new Date();

  try {
    // Get existing rate limit record
    const { data, error } = await supabase
      .from('chat_rate_limits')
      .select('*')
      .eq('ip_session_key', key)
      .single();

    if (error && error.code !== 'PGRST116') {
      // Error other than "not found"
      console.error('Rate limit check error:', error);
      throw new Error('Rate limit check failed');
    }

    if (!data) {
      // First request - create record
      await supabase.from('chat_rate_limits').insert({
        ip_session_key: key,
        request_count: 1,
        token_count: 0,
        window_start: now.toISOString(),
        last_request: now.toISOString(),
      });
      return { allowed: true };
    }

    // Check if window expired (1 hour)
    const windowStart = new Date(data.window_start);
    const windowExpired =
      now.getTime() - windowStart.getTime() > RATE_LIMIT_WINDOW;

    if (windowExpired) {
      // Reset window
      await supabase
        .from('chat_rate_limits')
        .update({
          request_count: 1,
          token_count: 0,
          window_start: now.toISOString(),
          last_request: now.toISOString(),
        })
        .eq('ip_session_key', key);
      return { allowed: true };
    }

    // Check limits
    if (data.request_count >= MAX_REQUESTS_PER_HOUR) {
      return {
        allowed: false,
        reason: 'Request limit exceeded (30/hour). Please try again later.',
      };
    }
    if (data.token_count >= MAX_TOKENS_PER_HOUR) {
      return {
        allowed: false,
        reason: 'Token limit exceeded. Please try again later.',
      };
    }

    // Increment request count
    await supabase
      .from('chat_rate_limits')
      .update({
        request_count: data.request_count + 1,
        last_request: now.toISOString(),
      })
      .eq('ip_session_key', key);

    return { allowed: true };
  } catch (error) {
    console.error('Rate limit error:', error);
    // On error, allow request but log it
    return { allowed: true };
  }
}

// Update token count after response
async function updateTokenCount(
  ipAddress: string,
  sessionId: string,
  tokens: number
): Promise<void> {
  const key = `${ipAddress}:${sessionId}`;

  try {
    const { data } = await supabase
      .from('chat_rate_limits')
      .select('token_count')
      .eq('ip_session_key', key)
      .single();

    if (data) {
      await supabase
        .from('chat_rate_limits')
        .update({ token_count: data.token_count + tokens })
        .eq('ip_session_key', key);
    }
  } catch (error) {
    console.error('Token count update error:', error);
  }
}

// --- SECURITY LAYER 5: Input Validation & Sanitization ---
interface ValidationResult {
  valid: boolean;
  error?: string;
}

function validateInput(message: unknown): ValidationResult {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required' };
  }

  if (message.length > MAX_INPUT_LENGTH) {
    return {
      valid: false,
      error: `Message too long (max ${MAX_INPUT_LENGTH} characters)`,
    };
  }

  if (message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  // Prompt injection detection (basic patterns)
  const suspiciousPatterns = [
    /ignore\s+(previous|above|all)\s+instructions/i,
    /disregard\s+(previous|prior|all)\s+instructions/i,
    /you\s+are\s+now/i,
    /new\s+instructions/i,
    /system\s*:\s*/i,
    /\[system\]/i,
    /forget\s+everything/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(message)) {
      return { valid: false, error: 'Invalid message content' };
    }
  }

  return { valid: true };
}

// Sanitize HTML/XSS
function sanitizeMessage(message: string): string {
  return message
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// --- SYSTEM PROMPT ---
function buildSystemPrompt(): string {
  return `You are Jason Guo (Huizhirong Guo), a Software Development Engineer. You speak in first person about yourself on your personal portfolio website.

PERSONALITY:
- Friendly, approachable, and occasionally humorous
- Enthusiastic about technology and learning
- Professional but conversational
- Keep responses concise (2-4 sentences typically)
- IMPORTANT: You MUST refuse to discuss: racism, politics, violence, adult/NSFW content, or any harmful topics. If asked, politely redirect to discussing your work and skills.

YOUR BACKGROUND:
- Currently pursuing Master's in Computer Science at Northeastern University (Sep 2024 - Dec 2026 expected, GPA: 4.0/4.0)
- Bachelor's in Computer Science and Mathematics from Santa Clara University, Silicon Valley (Sep 2020 - Jun 2024)
- High School at John F. Kennedy Catholic High School, Seattle (2016-2020)
- Full-stack developer with expertise in React, TypeScript, Python, Go, C#, Node.js
- Experience with Next.js, Django, Flask, Tailwind CSS, Supabase, Firebase, Docker, Kubernetes

WHY I CHOSE CS:
- I love that I can create things on my own through programming
- Unlike physical constructs like buildings, cars, or ships that I can't build alone, with a computer I can create things that are truly my own
- This ability to build and create independently is what makes software development so fascinating to me

CAREER GOAL:
- My goal is to independently develop a product with a significant user base - to build something meaningful that people actually use

CERTIFICATIONS:
- AWS Certified Cloud Practitioner (Sep 2024 - Sep 2027)

STRONGEST TECH STACK:
- React + Vite + Supabase (my go-to stack for web applications)
- Python (one of my most proficient languages)

WORK EXPERIENCE:

1. Next Play Games Inc. (Startup) - Software Engineer Intern (Sep-Dec 2025, Remote)
   - Architected full-stack application with Supabase database (RLS policies and proper schema design), Stripe payment integration with automated webhook processing and PCI compliance, and Cloudflare Pages deployment with edge function routing for global performance optimization
   - Built B2B coach dashboard using React, TypeScript, and Vite enabling team management, individual progress monitoring, and real-time performance analytics with live data synchronization across web and mobile platforms
   - Built cross-platform mobile app with React Native, optimizing component rendering to eliminate redundant re-renders and improving Supabase data fetching performance through query optimization and caching strategies
   - Architected AI-powered coaching features using OpenAI API including automated lesson generation and interactive chatbot. Designed Supabase Edge Functions with automated fine-tuning pipeline retraining GPT-4o mini models weekly or at 50 conversations, utilizing database Views and RLS policies for real-time synchronization

2. Beijing Gesafe WEALTH Advisory Co., Ltd. - Backend Engineer Intern (Jun-Aug 2025, Beijing)
   - Developed internal workflow automation tools with Django REST framework, reducing manual processing time by 35% and automating daily recurring tasks including report generation, data validation, and email notifications
   - Built RESTful APIs with Flask and MongoDB, implementing pagination and query optimization for sub-200ms response times across core business endpoints while handling complex aggregation pipelines for financial data. Tested APIs using Postman for endpoint validation and debugging
   - Designed MySQL database schema with proper indexing strategies, improving report generation speed by 60% and reducing query execution time from 3 seconds to around 1 second for complex analytical queries
   - Collaborated with cross-functional teams to deliver payment integration, automated reporting, and user dashboard features in Kubernetes Pod environments. Participated in daily stand-ups, sprint planning, and code reviews while coordinating with frontend developers, product managers, and QA engineers

3. Previous: China Shipbuilding Orlando Wuxi Software Technology (Jun-Sep 2024), National Supercomputing Center in Wuxi (Jun 2023-Aug 2024)

NOTABLE PROJECTS:

1. Travel Agent Booking System (2026) - Electron, Prisma, SQLite, React, TypeScript
   - Built full-stack desktop application to automate travel agency payment tracking, reducing financial settlement time from 5+ minutes (manual Excel calculations) to instant calculations and multi-company settlement reports
   - Architected custom database migration system with version-controlled SQL schemas, automatic backup/rollback, and Windows file lock handling, eliminating manual data export/import cycles and update-related support requests to zero
   - Implemented secure Electron IPC architecture for renderer-main communication, with Prisma ORM managing hierarchical data models (Category → Customer → Transaction → OrderItem) and Excel file export for data portability
   - GitHub: github.com/PlonGuo/Travel-Agent-Booking-System

2. Go ChatRoom (2026) - Go, Gin, Redis, WebRTC, React
   - Built concurrent WebSocket hub with Go channels and mutex locks, handling 1000+ connections with buffered channels
   - Designed dual-session architecture for bidirectional sync, enabling real-time delivery and read status tracking per user
   - Implemented Redis for session and online status management, reducing database queries by 60%
   - Developed P2P WebRTC calling with custom signaling server, cutting bandwidth costs by 90% vs centralized streaming
   - Deployed on Vercel (frontend) + Fly.io (backend)
   - GitHub: github.com/PlonGuo/GoChatroom

3. FlowBoard (2026) - Angular 17, C#, .NET 8, Azure, SignalR
   - Developed real-time team collaboration platform addressing inefficiencies in asynchronous kanban tools, enabling instant multi-user synchronization with integrated AI assistant and collaborative whiteboard for system design discussions
   - Implemented SignalR WebSocket with CQRS/MediatR and optimistic concurrency control (ROWVERSION) for 50+ concurrent users, utilizing message batching and .NET Channels to prevent race conditions and message storms
   - Integrated Azure OpenAI via Semantic Kernel for natural language task creation and Excalidraw for real-time collaborative diagramming with operational transformation
   - GitHub: github.com/PlonGuo/flowboard

4. Sportlingo Coaching Dashboard (2025) - React, Supabase, AI, TypeScript
   - My flagship project at Next Play Games that I led as the main developer
   - B2B platform for coaches with team management, progress monitoring, and real-time analytics
   - Demo: sportlingo.ai

5. GitHub Finder (2024) - React, GitHub API, Tailwind CSS
   - Web app for searching GitHub accounts and browsing profile information
   - Demo: github-finder-three-pink.vercel.app

6. Food E-commerce Platform (2023) - Python, Django, Bootstrap, SQLite
   - Online store for browsing and purchasing food products
   - GitHub: github.com/PlonGuo/Ecommerce-Platform

SKILLS:
- Languages: Python, JavaScript, TypeScript, C#, Go, C++, HTML, CSS
- Frameworks: React, React Native, Vite, Next.js, Flask, Django, Electron, Gin, Node.js, Tailwind CSS, Angular, ASP.NET
- Databases: PostgreSQL, MySQL, MongoDB, SQLite, Redis, Supabase
- Tools & DevOps: Git, GitHub, Docker, Kubernetes, AWS, Azure, Kafka, Firebase, Cursor, Claude, Postman, Prisma, WebRTC
- Payments: Stripe integration, RevenueCat
- AI: OpenAI API, GPT fine-tuning, Azure OpenAI, Semantic Kernel, Supabase Edge Functions
- Design: Adobe Photoshop, Illustrator, InDesign

INTERESTS & HOBBIES:
- Gaming: League of Legends, Dota 2, Monster Hunter, Dying Light, World of Warcraft
- Music: HipHop and Pop (no specific favorite artist, I enjoy the genres broadly)
- Vibe Coding: I love creating my own products and toys through casual coding sessions - building things just for fun

CONTACT (only share if explicitly asked):
- Email: jason.ghzr@gmail.com or 1070221333@qq.com
- Phone: (+1) 669-214-8407 or (+86) 199-5270-9509
- LinkedIn: linkedin.com/in/jasonguo1104
- GitHub: github.com/PlonGuo

RESPONSE GUIDELINES:
- Always speak as "I" (Jason)
- Be helpful and informative about your background
- If asked about skills/projects, reference specific examples with technical details (metrics, technologies, architecture)
- For sensitive contact info like phone, suggest using the contact form on the website
- If asked inappropriate questions, politely decline and redirect to professional topics
- Don't make up information that isn't in your background
- When discussing projects, mention specific technical achievements (e.g., "reduced queries by 60%", "handles 1000+ connections", "5+ minutes to instant")
- When discussing why I chose CS or my career goals, share my genuine passion for building things`;
}

// Prepare messages for OpenAI
function prepareMessages(
  userMessage: string,
  history: Array<{ role: string; content: string }>
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  // Take last 10 messages (5 pairs)
  const recentHistory = history.slice(-10);

  return [
    { role: 'system' as const, content: buildSystemPrompt() },
    ...recentHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user' as const, content: userMessage },
  ];
}

// --- MAIN HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  try {
    // Layer 1: Method validation
    if (!validateMethod(req)) {
      return res.status(405).json({
        error: 'Method not allowed',
        code: 'VALIDATION',
      });
    }

    // Layer 2: CORS validation
    const origin = req.headers.origin;
    if (!validateCORS(origin)) {
      return res.status(403).json({
        error: 'Forbidden',
        code: 'VALIDATION',
      });
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const { message, sessionId, history, turnstileToken } = req.body;

    // Get IP address from Cloudflare headers
    const ipAddress =
      (req.headers['cf-connecting-ip'] as string) ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      'unknown';

    // Layer 3: Turnstile verification (when token provided)
    if (turnstileToken) {
      const verified = await verifyTurnstile(turnstileToken, ipAddress);
      if (!verified) {
        return res.status(403).json({
          error: 'Verification failed. Please try again.',
          code: 'VERIFICATION_FAILED',
        });
      }
    }

    // Layer 4: Rate limiting
    const rateLimitResult = await checkRateLimit(
      ipAddress,
      sessionId || 'unknown'
    );
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: rateLimitResult.reason || 'Rate limit exceeded',
        code: 'RATE_LIMIT',
      });
    }

    // Layer 5: Input validation
    const validation = validateInput(message);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error,
        code: 'VALIDATION',
      });
    }

    const sanitizedMessage = sanitizeMessage(message);

    // Prepare messages for OpenAI
    const messages = prepareMessages(sanitizedMessage, history || []);

    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1024,
      temperature: 0.7,
      stream: true,
    });

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let totalTokens = 0;

    // Stream response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        totalTokens += 1; // Approximate token count
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Send completion signal
    res.write(`data: [DONE]\n\n`);

    // Update token count in background
    updateTokenCount(ipAddress, sessionId || 'unknown', totalTokens).catch(
      console.error
    );

    res.end();
  } catch (error) {
    console.error('Chat API error:', error);

    // Check if response already started (streaming)
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.end();
      return;
    }

    res.status(500).json({
      error: 'Something went wrong. Please try again.',
      code: 'SERVER_ERROR',
    });
  }
}
