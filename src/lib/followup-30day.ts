// 30-day delayed-effect follow-up (BACKLOG E8 AC #5).
//
// Зачем: Aslanova 2024 — EAT-26 рос через ~месяц ПОСЛЕ прекращения трекинга.
// Одноразовый экран самопроверки (GAD-2 vs baseline + self-rated app influence)
// ловит этот отложенный эффект. Ответ хранится локально (FollowupResponse).
//
// MVP: FOLLOWUP_30DAY_ENABLED=false → isFollowup30Due() всегда false. Детект
// дня вычислим и тестируем; экран — заглушка (см. app/followup/page.tsx).
// Активация — v1.1 (пилот не достигает 30 дней; текст — SAFETY-3).

import { getDB } from '@/db/client';
import { getUserProfile } from './profile';
import { wasFollowup30Shown, recordFollowup30Shown } from './nudge-state';
import { FOLLOWUP_30DAY_ENABLED, FOLLOWUP_DAY } from '@/config/nudge';

const DAY_MS = 86_400_000;

/**
 * Сколько дней пользователь с продуктом. Старт = ранняя LogEntry.date, иначе
 * screeningDate (BACKLOG E8 AC #7 / E9 retention: «от самой ранней LogEntry или
 * screeningDate»). 0, если профиля нет.
 */
export async function daysSinceStart(): Promise<number> {
  const db = getDB();
  let startMs: number | null = null;

  const firstLog = await db.logEntries.orderBy('date').first();
  if (firstLog) {
    startMs = new Date(firstLog.date).getTime();
  } else {
    const profile = await getUserProfile();
    if (profile?.screeningDate) startMs = new Date(profile.screeningDate).getTime();
  }

  if (startMs == null) return 0;
  return Math.floor((Date.now() - startMs) / DAY_MS);
}

/**
 * Пора ли показать одноразовый 30-day follow-up.
 * MVP: флаг выключен → false. Полная логика: флаг && достигнут день && ещё не показан.
 */
export async function isFollowup30Due(): Promise<boolean> {
  if (!FOLLOWUP_30DAY_ENABLED) return false;
  if (await wasFollowup30Shown()) return false;
  return (await daysSinceStart()) >= FOLLOWUP_DAY;
}

/**
 * Сохраняет ответ follow-up локально и помечает экран показанным (одноразовость).
 * gad2Score — сумма выбранных пунктов GAD-2; influence — self-rated (−2..+2).
 */
export async function recordFollowupResponse(
  gad2Score: number,
  selfRatedInfluence: number
): Promise<void> {
  await getDB().followupResponses.add({
    date: new Date().toISOString(),
    gad2Score,
    selfRatedInfluence,
  });
  await recordFollowup30Shown();
}
