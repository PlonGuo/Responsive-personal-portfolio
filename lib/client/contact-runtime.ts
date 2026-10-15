import { getUIErrorCode } from '../i18n/errors';
import { getBrowserSession, type SessionState } from './session';
import type { Store } from './store';

export function createContactRuntime(store: Store<SessionState>, fetcher: typeof fetch = fetch) {
  let resetTimer: ReturnType<typeof setTimeout> | undefined;
  return {
    async submit(token: string) {
      const contact = store.getSnapshot().contact;
      if (!token || contact.status === 'loading') return;
      clearTimeout(resetTimer);
      const formData = contact.formData;
      store.setState(previous => ({ ...previous, contact: { ...previous.contact, status: 'loading', errorCode: null } }));
      try {
        const response = await fetcher('/api/send-email', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, turnstileToken: token }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || body.success !== true) {
          store.setState(previous => ({ ...previous, contact: { ...previous.contact,
            status: 'error', errorCode: getUIErrorCode(response.status, body.code),
          } }));
        } else {
          store.setState(previous => ({ ...previous, contact: { ...previous.contact, status: 'success', errorCode: null,
            formData: previous.contact.formData === formData ? { name: '', email: '', subject: '', message: '' } : previous.contact.formData,
          } }));
        }
      } catch {
        console.error('Contact request could not be completed');
        store.setState(previous => ({ ...previous, contact: { ...previous.contact, status: 'error', errorCode: 'generic' } }));
      } finally {
        store.setState(previous => ({ ...previous, contact: { ...previous.contact, verificationVersion: previous.contact.verificationVersion + 1 } }));
        resetTimer = setTimeout(() => {
          store.setState(previous => ({ ...previous, contact: { ...previous.contact, status: 'idle', errorCode: null } }));
        }, 3000);
      }
    },
  };
}
let browserRuntime: ReturnType<typeof createContactRuntime> | undefined;
export function getContactRuntime() { return browserRuntime ??= createContactRuntime(getBrowserSession()); }
