export interface NormalizedChatInput {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  sessionId: string;
  turnstileToken?: string;
}

const suspiciousPatterns = [
  /ignore\s+(previous|above|all)\s+instructions/i,
  /disregard\s+(previous|prior|all)\s+instructions/i,
  /you\s+are\s+now/i, /new\s+instructions/i, /system\s*:\s*/i, /\[system\]/i, /forget\s+everything/i,
];
const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,200}$/.test(value);
function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function parseLegacyChat(value: unknown): NormalizedChatInput | null {
  const body = record(value);
  if (!body || typeof body.message !== 'string' || !body.message.trim() || body.message.length > 1000
    || suspiciousPatterns.some(pattern => pattern.test(body.message as string))) return null;
  const sessionId = body.sessionId === undefined ? 'unknown' : body.sessionId;
  if (!validId(sessionId)) return null;
  const rawHistory = body.history === undefined ? [] : body.history;
  if (!Array.isArray(rawHistory) || rawHistory.length > 10) return null;
  const history: NormalizedChatInput['history'] = [];
  for (const value of rawHistory) {
    const item = record(value);
    if (!item || (item.role !== 'user' && item.role !== 'assistant') || typeof item.content !== 'string' || item.content.length > 8000) return null;
    history.push({ role: item.role, content: item.content });
  }
  const token = body.turnstileToken;
  if (token !== undefined && (typeof token !== 'string' || token.length > 2048)) return null;
  return { message: body.message, sessionId, history, ...(typeof token === 'string' && token && { turnstileToken: token }) };
}

export function parseUIChat(value: unknown): NormalizedChatInput | null {
  const body = record(value);
  if (!body || !validId(body.sessionId) || (body.trigger !== undefined && body.trigger !== 'submit-message')
    || !Array.isArray(body.messages) || !body.messages.length || body.messages.length > 11) return null;
  const ids = new Set<string>();
  const messages: NormalizedChatInput['history'] = [];
  for (const value of body.messages) {
    const item = record(value);
    if (!item || !validId(item.id) || ids.has(item.id) || (item.role !== 'user' && item.role !== 'assistant')
      || !Array.isArray(item.parts) || !item.parts.length) return null;
    ids.add(item.id);
    let content = '';
    for (const value of item.parts) {
      const part = record(value);
      if (!part || part.type !== 'text' || typeof part.text !== 'string') return null;
      content += part.text;
    }
    messages.push({ role: item.role, content });
  }
  const last = messages.pop()!;
  if (last.role !== 'user') return null;
  return parseLegacyChat({ message: last.content, history: messages, sessionId: body.sessionId, turnstileToken: body.turnstileToken });
}
