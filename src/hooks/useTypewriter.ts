'use client';

import { useEffect, useState } from 'react';

function initialState(lines: readonly string[]) {
  return { source: lines, index: 0, text: lines[0] ?? '', deleting: false };
}

export function useTypewriter(lines: readonly string[], reduced = false): string {
  const [state, setState] = useState(() => initialState(lines));
  const current = state.source === lines ? state : initialState(lines);
  const { text, index, deleting } = current;

  useEffect(() => {
    if (reduced || !lines.length) return;
    const fullText = lines[index] ?? lines[0];
    const delay = !deleting && text === fullText ? 2000 : deleting ? 50 : 100;
    const timer = setTimeout(() => {
      setState(previous => {
        const active = previous.source === lines ? previous : initialState(lines);
        if (!active.deleting && active.text === fullText) return { ...active, deleting: true };
        if (active.deleting && !active.text) return {
          ...active, index: (active.index + 1) % lines.length, deleting: false,
        };
        return {
          ...active,
          text: active.deleting ? active.text.slice(0, -1) : fullText.slice(0, active.text.length + 1),
        };
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [lines, reduced, text, index, deleting]);

  return reduced ? lines[0] ?? '' : text;
}
