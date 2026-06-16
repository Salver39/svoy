// Хелперы доступа к UserProfile. Только клиент (IndexedDB недоступна на сервере).

import { getDB } from '@/db/client';
import type { UserProfile } from '@/db/schema';

/**
 * Возвращает первый (и единственный в v1) UserProfile или undefined,
 * если онбординг ещё не пройден.
 */
export async function getUserProfile(): Promise<UserProfile | undefined> {
  const db = getDB();
  return db.userProfile.toCollection().first();
}

/** Есть ли сохранённый профиль (онбординг пройден). */
export async function hasUserProfile(): Promise<boolean> {
  const db = getDB();
  return (await db.userProfile.count()) > 0;
}
