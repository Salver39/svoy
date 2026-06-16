'use client';

// Хук текущего режима приложения (BACKLOG E5 AC #2). Читает UserProfile.mode из
// IndexedDB (только клиент). Мягкий режим скрывает числовые калории на всех
// экранах; источник истины — профиль, переключатель в шапке Today его меняет.

import { useEffect, useState } from 'react';
import type { AppMode } from '@/db/schema';
import { getUserProfile } from './profile';

export function useAppMode(): { mode: AppMode; loading: boolean } {
  const [mode, setMode] = useState<AppMode>('numeric');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getUserProfile().then((p) => {
      if (cancelled) return;
      if (p) setMode(p.mode);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { mode, loading };
}
