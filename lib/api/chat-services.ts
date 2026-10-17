import 'server-only';
import { getAdminClient } from '../supabase/admin';
import { startGeneration } from '../chat/model-runtime';
import { createChatLimiter } from './chat-rate-limit';
import type { ChatServices } from './chat-route';
import { verifyTurnstile } from '../../src/api/security';

export const chatServices: ChatServices = {
  ...createChatLimiter(getAdminClient),
  // The current chatbot widget sends no action; contact tokens carry 'contact'.
  verify: (token, ip, hostname) => verifyTurnstile(token, ip, { action: '', hostname }),
  start: startGeneration,
};
