'use client';

// Пишет один AppOpenEvent на загрузку приложения (BACKLOG E9). Смонтирован в
// (tabs)/layout внутри ProfileGuard — значит опен считается только у
// онбордингнутых пользователей (открытие без профиля = онбординг, не реальный
// «open»). Рендерит null; дедуп — в lib/events.ts.

import { useEffect } from 'react';
import { recordAppOpen } from '@/lib/events';

export function AppOpenTracker() {
  useEffect(() => {
    recordAppOpen();
  }, []);
  return null;
}
