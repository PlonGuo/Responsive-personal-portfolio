'use client';

import { useEffect, useRef } from 'react';

interface TurnstileWidgetProps {
  siteKey: string;
  resetKey: number;
  action?: string;
  onDispose?: () => void;
  onToken: (token: string | null) => void;
}

export default function TurnstileWidget({ siteKey, resetKey, onToken, action = 'contact', onDispose }: TurnstileWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!siteKey) return;
    let widgetId: string | null = null;
    let disposed = false;
    const initialize = () => {
      if (disposed || widgetId || !container.current || !window.turnstile) return;
      widgetId = window.turnstile.render(container.current, {
        sitekey: siteKey,
        action,
        callback: onToken,
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        size: 'normal',
      });
      window.clearInterval(interval);
    };
    const interval = window.setInterval(initialize, 100);
    const deadline = window.setTimeout(() => window.clearInterval(interval), 10_000);
    initialize();
    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.clearTimeout(deadline);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      onDispose?.();
    };
  }, [siteKey, resetKey, onToken, action, onDispose]);

  return <div ref={container} />;
}
