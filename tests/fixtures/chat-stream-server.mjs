import { createServer } from 'node:http';
import { createChatRoute } from '../../lib/api/chat-route.ts';
import { createChatV2Route } from '../../lib/api/chat-v2-route.ts';

// Loopback-only HTTP fixture using the product adapters and injected services.
// No model credentials, external database, email, or product feature flags.
let requests = [];
let quotaCount = 0;
let providerCalls = 0;
let settlements = 0;
const headers = { 'Access-Control-Allow-Origin': process.env.FIXTURE_ALLOWED_ORIGIN ?? 'http://127.0.0.1:3000',
  'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const usage = { attempts: [{ provider: 'deepseek', inputTokens: 23, outputTokens: 7, totalTokens: 30 }], termination: 'complete' };
function services(protocol, compatibility, sessionId) {
  return {
    verify: async () => true,
    admit: async (ipKey, requestId) => compatibility && ++quotaCount > 30 ? { status: 'limited' }
      : { status: 'allowed', permit: { ipKey, requestId, windowId: 'fixture-window' } },
    settle: async () => { if (compatibility) settlements++; },
    start: async (input, signal) => {
      if (compatibility) providerCalls++;
      const state = { protocol, sessionId, message: input.message, messageCount: input.history.length + 1,
        cancelled: false, done: false };
      requests.push(state);
      let finish;
      const outcome = new Promise(resolve => { finish = resolve; });
      const text = (async function* () {
        try {
          if (compatibility) { yield 'compat reply'; state.done = true; return; }
          yield '第一段 — English';
          await new Promise(resolve => {
            const abort = () => { clearTimeout(timer); resolve(); };
            const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 3500);
            if (signal.aborted) abort();
            else signal.addEventListener('abort', abort, { once: true });
          });
          if (!signal.aborted) { yield ' second'; state.done = true; }
        } finally {
          state.cancelled = !state.done;
          finish({ ...usage, termination: state.cancelled ? 'aborted' : 'complete' });
        }
      })();
      return { text, outcome };
    },
  };
}
const handlers = Object.fromEntries([false, true].flatMap(compat => ['legacy', 'v2'].map(protocol => {
  const path = `${compat ? '/compat' : ''}/api/chat${protocol === 'v2' ? '/v2' : ''}`;
  return [path, { protocol, compat }];
})));

createServer(async (request, response) => {
  if (request.url === '/health') { response.writeHead(200).end('ok'); return; }
  if (request.url === '/reset' || request.url === '/compat/reset') {
    requests = []; quotaCount = 0; providerCalls = 0; settlements = 0; response.writeHead(204).end(); return;
  }
  if (request.url === '/stats' || request.url === '/compat/stats') {
    response.writeHead(200, { ...headers, 'Content-Type': 'application/json' })
      .end(JSON.stringify(request.url === '/stats' ? requests : { requests, quotaCount, providerCalls, settlements })); return;
  }
  if (request.url === '/legacy-client') {
    response.writeHead(200, { 'Content-Type': 'text/html' }).end(`<!doctype html><title>Legacy client fixture</title><pre id="reply"></pre><script>
      window.documentMarker = crypto.randomUUID();
      window.sendLegacy = async (message, sessionId = 'old-tab') => {
        const response = await fetch('/compat/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, sessionId, history: [] }) });
        if (!response.ok) return response.status;
        const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let text = ''; let complete = false;
        while (true) { const {done, value} = await reader.read(); if(done) break; buffer += decoder.decode(value, {stream:true});
          let boundary; while ((boundary=buffer.indexOf('\\n\\n')) >= 0) { const line=buffer.slice(0,boundary); buffer=buffer.slice(boundary+2);
            if (!line.startsWith('data: ')) continue; const data=line.slice(6);
            if (data==='[DONE]') complete=true; else text+=JSON.parse(data).content ?? '';
          }
        }
        document.querySelector('#reply').textContent=text; return complete ? 200 : 500;
      };
    </script>`); return;
  }
  const target = handlers[request.url];
  if (!target) { response.writeHead(404).end(); return; }
  let raw = '';
  for await (const chunk of request) { raw += chunk; if (Buffer.byteLength(raw) > 32768) { response.writeHead(413).end(); return; } }
  const abort = new AbortController();
  let reader;
  let ended = false;
  response.on('close', () => { if (!ended) { abort.abort(); void reader?.cancel().catch(() => {}); } });
  try {
    const webRequest = new Request(`http://127.0.0.1:3219${request.url}`, { method: request.method,
      headers: request.headers, signal: abort.signal, ...(raw && { body: raw }) });
    const sessionId = raw ? JSON.parse(raw).sessionId : undefined;
    const handle = (target.protocol === 'v2' ? createChatV2Route : createChatRoute)(services(target.protocol, target.compat, sessionId));
    const result = await handle(webRequest);
    response.writeHead(result.status, Object.fromEntries(result.headers));
    reader = result.body?.getReader();
    if (reader) while (!abort.signal.aborted) {
      const { done, value } = await reader.read(); if (done) break; response.write(value);
    }
    ended = true; response.end();
  } catch {
    if (!response.headersSent) response.writeHead(500);
    ended = true; response.end();
  } finally { reader?.releaseLock(); }
}).listen(3219, '127.0.0.1');
