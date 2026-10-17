import type { ChatState } from '../../src/types/chat';
import type { UIErrorCode } from '../i18n/errors';
import { createStore } from './store';

export type Theme = 'light' | 'dark';
export interface ContactForm { name: string; email: string; subject: string; message: string }
export interface SessionState {
  chat: ChatState;
  contact: {
    formData: ContactForm;
    status: 'idle' | 'loading' | 'success' | 'error';
    errorCode: UIErrorCode | null;
    verificationVersion: number;
  };
  theme: Theme;
}
export function createSessionState(sessionId: string): SessionState {
  return {
    chat: { isOpen: false, input: '', sessionId,
      messageCount: 0, turnstileToken: null, needsVerification: false, localError: null },
    contact: { formData: { name: '', email: '', subject: '', message: '' }, status: 'idle', errorCode: null, verificationVersion: 0 },
    theme: 'light',
  };
}
const serverSnapshot = createSessionState('');
Object.freeze(serverSnapshot.chat);
Object.freeze(serverSnapshot.contact.formData);
Object.freeze(serverSnapshot.contact);
Object.freeze(serverSnapshot);
export const getServerSnapshot = () => serverSnapshot;

let browserSession: ReturnType<typeof createStore<SessionState>> | undefined;
export function getBrowserSession() {
  if (typeof window === 'undefined') throw new Error('Visitor sessions are browser-only');
  if (!browserSession) {
    const state = createSessionState(crypto.randomUUID());
    state.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    browserSession = createStore(state);
  }
  return browserSession;
}
