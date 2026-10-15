'use client';

import { useRef } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { THEME_BOOTSTRAP } from '../../lib/client/theme';

export default function ThemeBootstrap() {
  const inserted = useRef(false);
  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    // Insert only into the initial HTML head, before body content can paint.
    // Client language navigation renders no script and keeps the live theme.
    return <script id="theme-bootstrap" dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />;
  });
  return null;
}
