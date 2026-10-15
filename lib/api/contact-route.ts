import { isAllowedOrigin } from '../../src/api/security';
import { createContactHandler, type ContactServices } from './contact';
import { errorResponse, JsonBodyError, readJson, requestHeaders } from './http';

export function createContactRoute(services: ContactServices) {
  const handle = createContactHandler(services);
  return async (request: Request): Promise<Response> => {
    const headers = requestHeaders(request);
    let body: unknown;
    if (request.method === 'POST' && isAllowedOrigin(headers.origin)) {
      try { body = await readJson(request); }
      catch (error) {
        const status = error instanceof JsonBodyError ? error.status : 400;
        return errorResponse(status, 'VALIDATION', error instanceof JsonBodyError ? error.message : 'Invalid request', {
          Vary: 'Origin', 'Access-Control-Allow-Origin': headers.origin,
        });
      }
    }
    const result = await handle({ method: request.method, headers, body });
    if (result.status === 405) result.headers.Allow = 'POST, OPTIONS';
    return result.body ? Response.json(result.body, { status: result.status, headers: result.headers })
      : new Response(null, { status: result.status, headers: result.headers });
  };
}
