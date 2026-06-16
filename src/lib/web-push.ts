// Web Push — единственный кейс push в v1: delayed-silence follow-up через M
// дней молчания (BACKLOG E8 AC #6). M в config/nudge.ts.
//
// MVP: WEB_PUSH_SEND_ENABLED=false. Реальной подписки/отправки нет — для этого
// нужен backend (VAPID-сервер), который архитектурно отложен на v1.1. Здесь —
// поддержка-детект, запись согласия в UserProfile и проводка к SW.
//
// РЕШЕНИЕ ПОЛЬЗОВАТЕЛЯ (минимальная поверхность): тумблер opt-in в Settings в
// MVP НЕ монтируется — контрол, который ничего не отправляет, не показываем.
// Флаг UserProfile.webPushFollowupConsent и эти функции готовы к v1.1.

import { getDB } from '@/db/client';
import { WEB_PUSH_SEND_ENABLED } from '@/config/nudge';

/** Браузер поддерживает Web Push (SW + PushManager + Notification). */
export function isWebPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/** Текущее состояние согласия из профиля. */
export async function getFollowupConsent(): Promise<boolean> {
  const profile = await getDB().userProfile.toCollection().first();
  return profile?.webPushFollowupConsent ?? false;
}

/** Пишет согласие на delayed-silence push в UserProfile. */
export async function setFollowupConsent(consent: boolean): Promise<void> {
  const db = getDB();
  const profile = await db.userProfile.toCollection().first();
  if (profile?.id != null) {
    await db.userProfile.update(profile.id, { webPushFollowupConsent: consent });
  }
}

/**
 * Запрашивает разрешение браузера на уведомления и подписывает на push.
 * MVP: WEB_PUSH_SEND_ENABLED=false → no-op, возвращает false (нет VAPID/backend).
 * v1.1: запросит Notification.permission и оформит PushManager.subscribe().
 */
export async function enableFollowupPush(): Promise<boolean> {
  if (!WEB_PUSH_SEND_ENABLED) return false;
  if (!isWebPushSupported()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  // TODO(v1.1): PushManager.subscribe({ applicationServerKey: VAPID_PUBLIC })
  // и передать подписку на backend, который через M дней молчания шлёт пуш.
  await setFollowupConsent(true);
  return true;
}
