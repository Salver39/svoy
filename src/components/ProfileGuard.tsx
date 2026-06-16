'use client';

// Клиентский гард на наличие/отсутствие UserProfile.
// IndexedDB читается только в браузере, поэтому проверка — на клиенте.
//
// mode='require'   → если профиля НЕТ, уводим на /onboarding (защищает табы).
// mode='forbid'    → если профиль ЕСТЬ, уводим на /today (защищает онбординг
//                    от повторного прохождения).
//
// Пока идёт асинхронная проверка — рендерим нейтральный фон, чтобы не мигнуть
// контентом до редиректа.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasUserProfile } from '@/lib/profile';

type GuardMode = 'require' | 'forbid';

export function ProfileGuard({
  mode,
  children,
}: {
  mode: GuardMode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'allowed'>('checking');

  useEffect(() => {
    let cancelled = false;

    hasUserProfile().then((exists) => {
      if (cancelled) return;

      const shouldRedirect =
        (mode === 'require' && !exists) || (mode === 'forbid' && exists);

      if (shouldRedirect) {
        router.replace(mode === 'require' ? '/onboarding' : '/today');
        return; // остаёмся в 'checking', контент не показываем до перехода
      }

      setStatus('allowed');
    });

    return () => {
      cancelled = true;
    };
  }, [mode, router]);

  if (status === 'checking') {
    // Нейтральный фон без спиннера и текста — спокойный first paint.
    return <div className="min-h-dvh bg-bg" aria-hidden="true" />;
  }

  return <>{children}</>;
}
