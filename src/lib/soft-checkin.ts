// Кадэнс и запись чек-ина состояния мягкого режима (BACKLOG E5, переосмыслено
// после mass-ревью: не привязан к приёму, максимум раз в 7 дней).
//
// Лёгкость намеренная: тревожная mass-аудитория получает спокойный ambient-
// вопрос изредка, а не анкету после каждой еды (Wallace 2025 logging burden +
// уход от клинического тона). Cooldown стартует и при ответе, и при пропуске —
// чтобы карточка не возвращалась в той же неделе.

import { getDB } from '@/db/client';

const COOLDOWN_DAYS = 7;

/** Последний показ чек-ина (ответ или пропуск) старше COOLDOWN_DAYS? */
export async function isSoftCheckInDue(): Promise<boolean> {
  const last = await getDB()
    .softStateCheckIns.orderBy('date')
    .last();
  if (!last) return true;

  const lastMs = new Date(last.date).getTime();
  const ageDays = (Date.now() - lastMs) / 86_400_000;
  return ageDays >= COOLDOWN_DAYS;
}

/**
 * Записывает чек-ин. state = выбранное состояние, либо null если пропущен.
 * Оба варианта запускают cooldown; null нужен для метрики под-репорта (E9).
 */
export async function recordSoftCheckIn(state: string | null): Promise<number> {
  return getDB().softStateCheckIns.add({
    date: new Date().toISOString(),
    state,
  });
}
