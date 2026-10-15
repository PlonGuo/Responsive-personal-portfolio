'use client';

import { useLayoutEffect, useRef } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { applyTheme, THEME_BOOTSTRAP } from '../../lib/client/theme';
import { getBrowserSession } from '../../lib/client/session';
import type { Locale } from '../../lib/i18n/locales';

export default function ThemeBootstrap({ locale }: { locale: Locale }) {
  const inserted = useRef(false);
  useLayoutEffect(() => {
    // A locale commit can apply the server's light root attribute. Restore the
    // live preference before paint, without rereading a changed saved value.
    applyTheme(getBrowserSession().getSnapshot().theme, false);
  }, [locale]);
  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    // Insert only into the initial HTML head, before body content can paint.
    // Client language navigation renders no script and keeps the live theme.
    return <script id="theme-bootstrap" dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />;
  });
  return null;
}
