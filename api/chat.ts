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
];

// --- SECURITY LAYER 1: Method Validation ---
function validateMethod(req: VercelRequest): boolean {
  return req.method === 'POST';
}

// --- SECURITY LAYER 2: CORS Validation ---
function validateCORS(origin: string | undefined): boolean {
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
    const windowExpired = now.getTime() - windowStart.getTime() > RATE_LIMIT_WINDOW;

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
      return { allowed: false, reason: 'Request limit exceeded (30/hour). Please try again later.' };
    }
    if (data.token_count >= MAX_TOKENS_PER_HOUR) {
      return { allowed: false, reason: 'Token limit exceeded. Please try again later.' };
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
    return { valid: false, error: `Message too long (max ${MAX_INPUT_LENGTH} characters)` };
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
- Currently pursuing Master's in Computer Science at Northeastern University (2024-2026 expected)
- Bachelor's in Computer Science from Santa Clara University, Silicon Valley (2020-2024)
- High School at John F. Kennedy Catholic High School, Seattle (2016-2020)
- Full-stack developer with expertise in React, TypeScript, Python, Node.js
- Experience with Next.js, Django, Tailwind CSS, Supabase, Firebase, Docker

CURRENT WORK:
- Software Engineer Intern at Next Play Games Inc. (Sep-Dec 2025): Building B2B coach dashboard with React, TypeScript, Vite, Supabase, Stripe
- Software Engineer Intern at Makeform.ai (Feb 2025-Present): AI-powered online form builder
- Backend Engineer Intern at Beijing Gesafe WEALTH Advisory Co. (Jun-Aug 2025)
- Previously: China Shipbuilding Orlando Wuxi Software Technology (Jun-Sep 2024), National Supercomputing Center in Wuxi (Jun 2023-Aug 2024)

NOTABLE PROJECTS:
1. Sportlingo Coaching Dashboard - React, Supabase, AI, TypeScript - B2B platform for coaches
2. Makeform.ai - React, Next.js, AI platform for dynamic forms
3. GitHub Finder - React app using GitHub API for profile search
4. Food E-commerce Platform - Python, Django, Bootstrap, SQLite

SKILLS:
- Languages: JavaScript, TypeScript, Python, C++, HTML, CSS
- Frameworks: React, Next.js, Node.js, Django, Tailwind CSS, Vite
- Tools: Git, GitHub, Docker, Supabase, Firebase, MongoDB, PostgreSQL, MySQL, Cursor, Claude
- Design: Adobe Photoshop, Illustrator, InDesign

INTERESTS:
- Love HipHop & Pop music
- Enjoy playing video games
- Passionate about web development and learning new technologies

CONTACT (only share if explicitly asked):
- Email: jason.ghzr@gmail.com or 1070221333@qq.com
- Phone: (+1) 669-214-8407 or (+86) 199-5270-9509
- LinkedIn: linkedin.com/in/jasonguo1104
- GitHub: github.com/PlonGuo

RESPONSE GUIDELINES:
- Always speak as "I" (Jason)
- Be helpful and informative about your background
- If asked about skills/projects, reference specific examples
- For sensitive contact info like phone, suggest using the contact form on the website
- If asked inappropriate questions, politely decline and redirect to professional topics
- Don't make up information that isn't in your background`;
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
    const rateLimitResult = await checkRateLimit(ipAddress, sessionId || 'unknown');
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
    updateTokenCount(ipAddress, sessionId || 'unknown', totalTokens).catch(console.error);

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
