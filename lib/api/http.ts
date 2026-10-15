export function requestHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => { headers[key] = value; });
  return headers;
}

export function errorResponse(status: number, code: string, error: string, headers?: HeadersInit): Response {
  return Response.json({ error, code }, { status, headers });
}

export class JsonBodyError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function readJson(request: Request, maxBytes = 32768): Promise<unknown> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new JsonBodyError(415, 'Content-Type must be application/json');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new JsonBodyError(400, 'Invalid JSON body');
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new JsonBodyError(413, 'Request body too large');
      }
      chunks.push(value);
    }
    const raw = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { raw.set(chunk, offset); offset += chunk.length; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw));
  } catch (error) {
    if (error instanceof JsonBodyError) throw error;
    throw new JsonBodyError(400, 'Invalid JSON body');
  } finally { reader.releaseLock(); }
}
