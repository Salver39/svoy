// Операционные метрики уровня 1 (BACKLOG E9, SPEC «Метрики → Уровень 1»).
//
// Считаются ON-DEMAND при экспорте (AC #4) — никаких агрегатов в реальном
// времени, чтобы не плодить код и состояние. Метрики НЕ показываются юзеру в
// MVP (AC #2): только попадают в JSON-экспорт. Пороги «зелёный/жёлтый/красный»
// не зашиты — сырьё для калибровки на первых 10-30 пилотных (AC #5).
//
// Retention здесь — НЕ KPI (SPEC принцип 9: retention поощряет ту обсессию,
// что мы лечим). Это диагностический срез для пилота, не цель оптимизации.

import { getDB } from '@/db/client';
import { getUserProfile } from './profile';
import { daysSinceStart } from './followup-30day';
import { getWeeklySummary } from './weekly-average';
import { bmrFromProfile, bmi as computeBmi } from './zone';
import {
  SAFETY_FLAG_BMR_FRACTION,
  SCREENING_BMI_SIGNAL,
  SCREENING_BMI_SIGNAL_STRONG,
} from '@/config/safety';

export interface Level1Metrics {
  /** День строкой старта (ранняя LogEntry или screeningDate), null если нет данных. */
  startDate: string | null;
  daysSinceStart: number;
  retained30: boolean; // >= 30 дней с данными в продукте
  retained90: boolean; // >= 90 дней

  anxietyTaps: number; // число дней с нажатой кнопкой «тревожно»

  softCheckIns: number; // всего показанных чек-инов состояния
  dontKnowCount: number; // из них пропущено/«не знаю» (state === null)
  dontKnowRate: number | null; // доля; null если чек-инов не было

  currentMode: 'numeric' | 'soft' | null;
  everUsedSoft: boolean; // был ли soft когда-либо (текущий или в истории переключений)
  modeSwitchCount: number;
  modeSwitchesPerDay: number; // частота; 0 при нулевом стаже

  appOpens: number;
  opensWithoutLog: number; // опены в дни без единой LogEntry
  openWithoutLogRate: number | null; // доля; null если опенов не было

  // SAFETY-1 (диетолог 2026-06-16): скрытый риск-флаг. НЕ показывается юзеру —
  // только в аналитике для пилота. Никаких предупреждений/цветов (принцип 5).
  bmr: number | null; // BMR пользователя; null если нет профиля
  weeklyAvgIntake: number | null; // 7-дневное среднее потребление (как на Today)
  belowBmr75Flag: boolean; // среднее < 75% BMR → потенциально рискованный паттерн

  // Слой 2 скрининга (SAFETY-2) — analytics-only сигналы, НЕ триггеры решения.
  bmi: number | null; // null если вес не указан (без веса BMI не оценить)
  bmiUnder18_5: boolean; // мягкий сигнал; решения по нему НЕ принимаются
  bmiUnder17_5: boolean; // более сильный сигнал (психолог 2026-06-16)
  // GAD-2≥cutoff и «высокий балл по еде» НЕ дублируются здесь — они едут в
  // экспорте через userProfile.screeningResult (gad2AtCutoff / foodConcernHigh).
}

/** Считает все метрики уровня 1 из текущего состояния IndexedDB. */
export async function computeMetrics(): Promise<Level1Metrics> {
  const db = getDB();
  const [profile, moods, checkIns, switches, opens, logs, days, weekly] = await Promise.all([
    getUserProfile(),
    db.moodCheckIns.toArray(),
    db.softStateCheckIns.toArray(),
    db.modeSwitches.toArray(),
    db.appOpenEvents.toArray(),
    db.logEntries.toArray(),
    daysSinceStart(),
    getWeeklySummary(),
  ]);

  // Старт = ранняя LogEntry.date, иначе screeningDate (как в daysSinceStart).
  const firstLog = logs.reduce<string | null>(
    (min, e) => (min === null || e.date < min ? e.date : min),
    null
  );
  const startDate = firstLog ?? profile?.screeningDate?.slice(0, 10) ?? null;

  const anxietyTaps = moods.filter((m) => m.anxious).length;

  const dontKnowCount = checkIns.filter((c) => c.state === null).length;
  const dontKnowRate = checkIns.length === 0 ? null : dontKnowCount / checkIns.length;

  const everUsedSoft = profile?.mode === 'soft' || switches.some((s) => s.to === 'soft');
  const modeSwitchesPerDay = days > 0 ? switches.length / days : 0;

  // Опены без лога: день опена (YYYY-MM-DD) не встречается среди дней с LogEntry.
  const loggedDays = new Set(logs.map((e) => e.date));
  const opensWithoutLog = opens.filter((o) => !loggedDays.has(o.date.slice(0, 10))).length;
  const openWithoutLogRate = opens.length === 0 ? null : opensWithoutLog / opens.length;

  // Скрытый safety-флаг (SAFETY-1): 7-дневное среднее ниже 75% BMR. Считается
  // здесь же, on-demand при экспорте — как и остальные метрики уровня 1.
  const bmr = profile ? bmrFromProfile(profile) : null;
  const weeklyAvgIntake = weekly.average;
  const belowBmr75Flag =
    bmr !== null &&
    weeklyAvgIntake !== null &&
    weeklyAvgIntake < SAFETY_FLAG_BMR_FRACTION * bmr;

  // BMI-сигнал слоя 2 (SAFETY-2): только при реальном весе — без него оценить
  // нельзя (proxy-вес дал бы фиксированный BMI 21.7 и никогда не сработал бы).
  const bmi =
    profile && profile.weight != null
      ? computeBmi(profile.height, profile.weight)
      : null;
  const bmiUnder18_5 = bmi !== null && bmi < SCREENING_BMI_SIGNAL;
  const bmiUnder17_5 = bmi !== null && bmi < SCREENING_BMI_SIGNAL_STRONG;

  return {
    startDate,
    daysSinceStart: days,
    retained30: days >= 30,
    retained90: days >= 90,
    anxietyTaps,
    softCheckIns: checkIns.length,
    dontKnowCount,
    dontKnowRate,
    currentMode: profile?.mode ?? null,
    everUsedSoft,
    modeSwitchCount: switches.length,
    modeSwitchesPerDay,
    appOpens: opens.length,
    opensWithoutLog,
    openWithoutLogRate,
    bmr,
    weeklyAvgIntake,
    belowBmr75Flag,
    bmi,
    bmiUnder18_5,
    bmiUnder17_5,
  };
}
