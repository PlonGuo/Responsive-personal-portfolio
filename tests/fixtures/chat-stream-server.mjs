import { createServer } from 'node:http';

// Loopback-only test fixture. No model SDK, tokens, email, or product feature flags.
let requests = [];
createServer(async (request, response) => {
  const headers = { 'Access-Control-Allow-Origin': process.env.FIXTURE_ALLOWED_ORIGIN ?? 'http://127.0.0.1:3000', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  if (request.method === 'OPTIONS') { response.writeHead(204, headers).end(); return; }
  if (request.url === '/health') { response.writeHead(200).end('ok'); return; }
  if (request.url === '/reset') { requests = []; response.writeHead(204).end(); return; }
  if (request.url === '/stats') { response.writeHead(200, { ...headers, 'Content-Type': 'application/json' }).end(JSON.stringify(requests)); return; }
  if (request.url !== '/api/chat' || request.method !== 'POST') { response.writeHead(404).end(); return; }
  let raw = '';
  for await (const chunk of request) { raw += chunk; if (raw.length > 32768) { response.writeHead(413).end(); return; } }
  let body;
  try { body = JSON.parse(raw); } catch { response.writeHead(400).end(); return; }
  const state = { sessionId: body.sessionId, message: body.message, cancelled: false, done: false };
  requests.push(state);
  response.writeHead(200, { ...headers, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' });
  response.write('data: {"content":"第一段 — English"}\n\n');
  const timer = setTimeout(() => {
    response.end('data: {"content":" second"}\n\ndata: [DONE]\n\n');
    state.done = true;
  }, 3500);
  response.on('close', () => { clearTimeout(timer); state.cancelled = !state.done; });
}).listen(3219, '127.0.0.1');
