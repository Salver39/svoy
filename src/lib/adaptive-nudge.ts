// Adaptive nudge: чтение поведенческих сигналов из Dexie и решение, показывать
// ли мягкое приглашение в режим без чисел (BACKLOG E8 AC #1-3).
//
// MVP: ADAPTIVE_NUDGE_ENABLED=false → shouldShowAdaptiveNudge() всегда false.
// Сигналы тем не менее вычислимы и тестируемы — инфраструктура собирает данные
// для пилотной калибровки порогов (config/nudge.ts). Активация — v1.1 + SAFETY-3.
//
// Сигналы — черновые гипотезы (AC #2), пороги в config/nudge.ts. Любой
// сработавший сигнал делает nudge кандидатом; финальный показ ещё гейтится
// флагом и локом (lib/nudge-state.ts).

import { getDB } from '@/db/client';
import { ADAPTIVE_NUDGE_ENABLED, NUDGE_SIGNALS } from '@/config/nudge';
import { isAdaptiveNudgeLocked } from './nudge-state';

const DAY_MS = 86_400_000;

export interface NudgeSignals {
  anxietyTaps: number;
  openWithoutLogRatio: number;
  dontKnowRatio: number;
}

/** ISO-граница окна сигналов (windowDays назад от сейчас). */
function windowStartISO(): string {
  return new Date(Date.now() - NUDGE_SIGNALS.windowDays * DAY_MS).toISOString();
}

/**
 * Считывает сырые сигналы за окно. Пустые источники → нейтральные нули
 * (например, appOpenEvents не пишутся до E9 → ratio 0). Ничего не показывает,
 * только агрегирует.
 */
export async function evaluateSignals(): Promise<NudgeSignals> {
  const db = getDB();
  const since = windowStartISO();
  const sinceDay = since.slice(0, 10);

  // Сигнал 1: нажатия «тревожно» в окне (MoodCheckIn.anxious === true).
  const moods = await db.moodCheckIns.where('date').aboveOrEqual(since).toArray();
  const anxietyTaps = moods.filter((m) => m.anxious).length;

  // Сигнал 2: доля «не знаю»/пропуск в чек-инах состояния (state === null).
  const checkIns = await db.softStateCheckIns.where('date').aboveOrEqual(since).toArray();
  const dontKnowRatio =
    checkIns.length === 0
      ? 0
      : checkIns.filter((c) => c.state === null).length / checkIns.length;

  // Сигнал 3: доля открытий без логирования в тот же день.
  // appOpenEvents пишет E9; до него массив пуст → ratio 0 (нейтрально).
  const opens = await db.appOpenEvents.where('date').aboveOrEqual(since).toArray();
  let openWithoutLogRatio = 0;
  if (opens.length > 0) {
    const loggedDays = new Set(
      (await db.logEntries.where('date').aboveOrEqual(sinceDay).toArray()).map((e) => e.date)
    );
    const opensWithoutLog = opens.filter((o) => !loggedDays.has(o.date.slice(0, 10))).length;
    openWithoutLogRatio = opensWithoutLog / opens.length;
  }

  return { anxietyTaps, openWithoutLogRatio, dontKnowRatio };
}

/** Сработал ли хотя бы один сигнал относительно порогов config/nudge.ts. */
export function anySignalTriggered(s: NudgeSignals): boolean {
  return (
    s.anxietyTaps >= NUDGE_SIGNALS.anxietyTapsThreshold ||
    s.openWithoutLogRatio >= NUDGE_SIGNALS.openWithoutLogRatio ||
    s.dontKnowRatio >= NUDGE_SIGNALS.dontKnowRatio
  );
}

/**
 * Финальное решение: показывать ли adaptive nudge.
 * MVP: ADAPTIVE_NUDGE_ENABLED=false → ранний возврат false, БД даже не читаем.
 * Полная логика (v1.1): флаг && !лок && сработал сигнал.
 */
export async function shouldShowAdaptiveNudge(): Promise<boolean> {
  if (!ADAPTIVE_NUDGE_ENABLED) return false;
  if (await isAdaptiveNudgeLocked()) return false;
  const signals = await evaluateSignals();
  return anySignalTriggered(signals);
}
