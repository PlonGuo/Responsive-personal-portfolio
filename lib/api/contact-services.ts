import 'server-only';
import { createHash } from 'node:crypto';
import { Resend } from 'resend';
import { getAdminClient } from '../supabase/admin';
import { verifyTurnstile } from '../../src/api/security';
import type { ContactServices } from './contact';

export const contactServices: ContactServices = {
  verify: (token, ip, hostname) => verifyTurnstile(token, ip, { action: 'contact', hostname }),
  async limit(ip) {
    const { data, error } = await getAdminClient().rpc('consume_contact_rate_limit', {
      p_ip_key: createHash('sha256').update(ip).digest('hex'),
    }).abortSignal(AbortSignal.timeout(10_000));
    if (error || typeof data !== 'boolean') return 'unavailable';
    return data ? 'allowed' : 'limited';
  },
  async send(email) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('Mail service unavailable');
    const { error } = await new Resend(key).emails.send({
      from: 'Portfolio Contact <onboarding@resend.dev>',
      to: 'jason.ghzr@gmail.com',
      ...email,
    });
    if (error) throw new Error('Mail delivery failed');
  },
};
