'use client';
import { useCallback, useSyncExternalStore } from 'react';
import { getBrowserSession, getServerSnapshot, type SessionState } from '../../lib/client/session';
const subscribe = (listener: () => void) => getBrowserSession().subscribe(listener);
export function useSession<K extends keyof SessionState>(key: K): SessionState[K] {
  const snapshot = useCallback(() => getBrowserSession().getSnapshot()[key], [key]);
  const serverSnapshot = useCallback(() => getServerSnapshot()[key], [key]);
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
