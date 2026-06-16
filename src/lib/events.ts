// Сырые операционные события для метрик пилота (BACKLOG E9).
//
// Local-first: события живут только в IndexedDB, уходят лишь в ручной экспорт
// (SPEC принцип 7). Никаких агрегатов в реальном времени — считаем on-demand
// при экспорте (E9 AC #4). Здесь только запись сырья.

import { getDB } from '@/db/client';
import type { AppMode } from '@/db/schema';

// Дедуп: один AppOpenEvent на загрузку приложения, не на каждую навигацию между
// табами. (tabs)/layout монтируется раз за загрузку, но React StrictMode в dev
// дважды вызывает effect — module-level guard защищает от двойной записи.
let appOpenRecorded = false;

/** Пишет факт открытия приложения (раз на загрузку). «Открытие» = старт сессии. */
export async function recordAppOpen(): Promise<void> {
  if (appOpenRecorded) return;
  appOpenRecorded = true;
  await getDB().appOpenEvents.add({ date: new Date().toISOString() });
}

/** Пишет переключение режима (ручное или через nudge) — для метрики частоты. */
export async function recordModeSwitch(from: AppMode, to: AppMode): Promise<void> {
  if (from === to) return;
  await getDB().modeSwitches.add({
    date: new Date().toISOString(),
    from,
    to,
  });
}
