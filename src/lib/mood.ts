// Data-layer для mood-чекина и факта «тревожно» (BACKLOG E6 AC #1-4).
//
// Закон продукта: mood развязан от приёмов пищи (food×mood-развязка — связь
// настроения с конкретной едой создаёт павловскую поверхность «съел X →
// было плохо → избегаю X», SPEC принципы / Dakanalis 2023). Поэтому здесь нет
// никакой ссылки на LogEntry — только дата.
//
// Одна строка на календарный день. Mood-чекин и нажатие «тревожно» апдейтят
// одну и ту же строку (upsert по дню), чтобы метрика «% сессий с тревожно»
// и история настроения жили в одном месте без дубликатов за день.

import { getDB } from '@/db/client';
import type { MoodCheckIn, Mood } from '@/db/schema';
import { todayISO } from './log-entry';

/** День строкой 'YYYY-MM-DD' из ISO-datetime записи. */
function dayOf(isoDatetime: string): string {
  return isoDatetime.slice(0, 10);
}

/** Сегодняшний mood-чекин (mood и/или anxious), если уже есть. */
export async function getTodayMoodCheckIn(): Promise<MoodCheckIn | undefined> {
  const today = todayISO();
  // Индекс на date — datetime; берём последний и сверяем день (записей за день ≤1).
  const last = await getDB().moodCheckIns.orderBy('date').last();
  return last && dayOf(last.date) === today ? last : undefined;
}

/** Уже отмечал(и) настроение сегодня? (anxious-only строка mood-чекином не считается) */
export async function hasMoodToday(): Promise<boolean> {
  const row = await getTodayMoodCheckIn();
  return row?.mood != null;
}

/** Upsert сегодняшней строки: применяет patch к существующей или создаёт новую. */
async function upsertToday(
  patch: Partial<Pick<MoodCheckIn, 'mood' | 'anxious'>>
): Promise<number> {
  const db = getDB();
  const existing = await getTodayMoodCheckIn();
  if (existing?.id != null) {
    await db.moodCheckIns.update(existing.id, patch);
    return existing.id;
  }
  return db.moodCheckIns.add({
    date: new Date().toISOString(),
    mood: patch.mood ?? null,
    anxious: patch.anxious ?? false,
  });
}

/** Записывает настроение за сегодня (один чек-ин в день, перезапись допустима). */
export async function recordMood(mood: Mood): Promise<number> {
  return upsertToday({ mood });
}

/** Отмечает факт нажатия «тревожно» за сегодня (не трогает mood). */
export async function recordAnxious(): Promise<number> {
  return upsertToday({ anxious: true });
}

/** Вся история чек-инов, новые сверху (для timeline на Mood-табе). */
export async function getMoodHistory(): Promise<MoodCheckIn[]> {
  return getDB().moodCheckIns.orderBy('date').reverse().toArray();
}
