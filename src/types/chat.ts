import type { UIErrorCode } from '../../lib/i18n/errors';

// Message types
export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

// Chat state types
export interface ChatState {
  isOpen: boolean;
  input: string;
  sessionId: string;
  messageCount: number;
  turnstileToken: string | null;
  needsVerification: boolean;
  // Model messages, status and errors belong to SDK Chat, not the session store.
  localError: UIErrorCode | null;
}

// Turnstile types
declare global {
  interface Window {
    turnstile?: {
      render: (
        element: string | HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark';
          size?: 'normal' | 'compact';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}
