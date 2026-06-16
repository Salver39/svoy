// Минимальный Service Worker для PWA-installability.
// Сейчас он только регистрируется (без кэширования). Это нужно браузерам
// (Chrome/Edge) для показа prompt 'Add to Home Screen' и для самого
// факта установки PWA. Полноценный офлайн-shell — задача v1.1.
// См. SPEC.md → 'Out of scope для MVP'.

self.addEventListener('install', (event) => {
  // Сразу активируем новую версию без ожидания закрытия вкладок.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Берём контроль над открытыми клиентами немедленно.
  event.waitUntil(self.clients.claim());
});

// fetch-обработчика нет — все запросы идут напрямую в сеть.
// Это сознательное упрощение для MVP.

// ─── Push API (BACKLOG E8 AC #6) ──────────────────────────────────────────
// Единственный кейс push в v1: delayed-silence follow-up «как ты?» через M
// дней молчания. MVP: реальной отправки нет (нужен VAPID-backend, отложен на
// v1.1 — см. src/lib/web-push.ts WEB_PUSH_SEND_ENABLED). Обработчики готовы
// заранее, чтобы при включении backend ничего не доделывать в SW.

self.addEventListener('push', (event) => {
  // Тело — JSON { title, body }, иначе мягкие дефолты (тексты — SAFETY-3).
  let payload = { title: 'Как ты?', body: 'Короткая проверка самочувствия, если захочется.' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Невалидный payload — показываем дефолт, не падаем.
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'nimb-followup', // схлопывает дубликаты — не копим уведомления
      data: { url: '/followup' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Фокусируем уже открытую вкладку, иначе открываем новую.
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
