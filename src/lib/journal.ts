// Счётчик ведения дневника (BACKLOG E6 AC #5, SPEC принцип 6).
//
// КУМУЛЯТИВНЫЙ, не streak: считаем число РАЗНЫХ дней, в которые есть хоть одна
// запись еды. Пропуск дня НЕ обнуляет счётчик (в отличие от gamified-стриков за
// дефицит, которые SPEC прямо запрещает). Без обвязки достижений и без шейминга —
// просто тихий факт «ты ведёшь дневник N дней».

import { getDB } from '@/db/client';

/** Количество различных дней (YYYY-MM-DD), в которые есть записи в дневнике. */
export async function getJournalDayCount(): Promise<number> {
  // logEntries.date — это уже 'YYYY-MM-DD' (день без времени, см. log-entry.ts).
  const days = new Set<string>();
  await getDB().logEntries.orderBy('date').eachKey((date) => {
    days.add(date as string);
  });
  return days.size;
}
