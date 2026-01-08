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
  messages: Message[];
  isOpen: boolean;
  isLoading: boolean;
  input: string;
  sessionId: string;
  messageCount: number;
  turnstileToken: string | null;
  needsVerification: boolean;
  error: string | null;
}

// API request/response types
export interface ChatRequest {
  message: string;
  sessionId: string;
  history: Array<{ role: string; content: string }>;
  turnstileToken?: string;
}

export interface ChatError {
  error: string;
  code: 'RATE_LIMIT' | 'VALIDATION' | 'VERIFICATION_FAILED' | 'SERVER_ERROR';
  details?: string;
}

// Turnstile types
declare global {
  interface Window {
    turnstile?: {
      render: (
        element: string | HTMLElement,
        options: {
          sitekey: string;
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
