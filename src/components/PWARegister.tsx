'use client';

// Регистрирует Service Worker на стороне браузера.
// Помещается в корневой layout, рендерит null. Проверяет поддержку,
// не падает на старых браузерах, не блокирует SSR.

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Регистрируем только в production. В dev-режиме Next.js собственный
    // HMR конфликтует с SW и страница начинает странно перегружаться.
    if (process.env.NODE_ENV !== 'production') return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch((err) => {
        console.error('SW registration failed:', err);
      });
  }, []);

  return null;
}
