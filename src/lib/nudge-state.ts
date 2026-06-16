// Доступ к синглтону NudgeState (BACKLOG E8). Одна строка на устройство держит
// время последнего adaptive nudge и последнего 30-day follow-up — отсюда локи.
//
// MVP: эти функции пишутся/читаются, но adaptive nudge и follow-up не
// показываются (фиче-флаги в config/nudge.ts). Запись произойдёт только когда
// флаги включат на v1.1 — инфраструктура к этому моменту уже протестирована.

import { getDB } from '@/db/client';
import type { NudgeState } from '@/db/schema';
import { ADAPTIVE_NUDGE_INTERVAL_DAYS } from '@/config/nudge';

const DAY_MS = 86_400_000;

/** Возвращает синглтон NudgeState, создавая пустую строку при первом обращении. */
export async function getNudgeState(): Promise<NudgeState> {
  const db = getDB();
  const existing = await db.nudgeState.toCollection().first();
  if (existing) return existing;
  const id = await db.nudgeState.add({});
  return { id };
}

/** Патчит синглтон NudgeState (по его id). */
async function patchNudgeState(patch: Partial<NudgeState>): Promise<void> {
  const state = await getNudgeState();
  if (state.id != null) {
    await getDB().nudgeState.update(state.id, patch);
  }
}

/** Заперт ли adaptive nudge: с последнего показа прошло меньше интервала. */
export async function isAdaptiveNudgeLocked(): Promise<boolean> {
  const { lastAdaptiveNudgeAt } = await getNudgeState();
  if (!lastAdaptiveNudgeAt) return false;
  const ageDays = (Date.now() - new Date(lastAdaptiveNudgeAt).getTime()) / DAY_MS;
  return ageDays < ADAPTIVE_NUDGE_INTERVAL_DAYS;
}

/** Фиксирует показ adaptive nudge → запускает лок на ADAPTIVE_NUDGE_INTERVAL_DAYS. */
export async function recordAdaptiveNudgeShown(): Promise<void> {
  await patchNudgeState({ lastAdaptiveNudgeAt: new Date().toISOString() });
}

/** Уже показывали 30-day follow-up? (одноразовый экран). */
export async function wasFollowup30Shown(): Promise<boolean> {
  const { lastFollowup30At } = await getNudgeState();
  return lastFollowup30At != null;
}

/** Фиксирует показ 30-day follow-up. */
export async function recordFollowup30Shown(): Promise<void> {
  await patchNudgeState({ lastFollowup30At: new Date().toISOString() });
}

/**
 * Сброс лока adaptive nudge после возврата в численный режим (BACKLOG E8 AC #3:
 * «после переключения обратно в численный режим — clock reset без немедленного
 * повтора»). Сброс именно лока, не немедленный показ — следующий показ ждёт
 * срабатывания сигнала, как обычно.
 */
export async function resetAdaptiveNudgeLock(): Promise<void> {
  await patchNudgeState({ lastAdaptiveNudgeAt: undefined });
}
