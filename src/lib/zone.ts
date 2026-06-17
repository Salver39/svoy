// Формула зоны калорий (BACKLOG E2 AC #6-8, SPEC «Логика зоны»).
//
// BMR по Mifflin-St Jeor → ×коэффициент активности = TDEE → зона = TDEE ±15%.
// Нижняя граница = max(TDEE − 15%, защитный минимум). Защитный минимум невидим
// в UI — он просто поднимает min. Возвращаем ТОЛЬКО {min, max} без midpoint
// (SPEC AC #18: midpoint TDEE не показывается нигде).
//
// SAFETY-1 РЕШЕНО (диетолог, 2026-06-16): защитный минимум = BMR пользователя,
// а не фиксированная константа. См. config/safety.ts.
// SAFETY-4 РЕШЕНО (диетолог, 2026-06-16): при недовесе (BMI < порога) зона не
// тянет в дефицит — нижняя граница = TDEE, верхняя = TDEE+10%. Невидимо.

import { RECOVERY_BMI_THRESHOLD, RECOVERY_SURPLUS } from '@/config/safety';
import type { Sex, Zone, WorkoutIntensity } from '@/db/schema';

// Базовый множитель к BMR — ФИКСИРОВАННЫЙ для всех (R1, 2026-06-17). Раньше зависел
// от выбранного образа жизни (sedentary..very_active), но это задваивало активность
// с per-day отметкой (F8). Теперь образ жизни — только сигнал (schema.ActivitySignal),
// а база считается как «обычный день» с лёгкой повседневной активностью. 1.375 —
// щадящая сторона (анти-рестрикция: недокорм опаснее перекорма для этой аудитории).
// ⚠️ ЗНАЧЕНИЕ НА ПОДТВЕРЖДЕНИЕ ДИЕТОЛОГУ (та же зона ответственности, что SAFETY-1).
const BASE_ACTIVITY_FACTOR = 1.375;

const ZONE_SPREAD = 0.15; // ±15%

export interface ZoneInput {
  height: number; // см
  weight: number; // кг
  age: number; // лет
  sex: Sex;
}

/**
 * BMR по Mifflin-St Jeor.
 * муж: 10·вес + 6.25·рост − 5·возраст + 5
 * жен: 10·вес + 6.25·рост − 5·возраст − 161
 */
export function mifflinBMR(input: ZoneInput): number {
  const base = 10 * input.weight + 6.25 * input.height - 5 * input.age;
  return input.sex === 'male' ? base + 5 : base - 161;
}

export function tdee(input: ZoneInput): number {
  return mifflinBMR(input) * BASE_ACTIVITY_FACTOR;
}

/**
 * Считает зону. Нижняя граница поднимается до защитного минимума, если
 * TDEE−15% опускается ниже него. Защитный минимум в результат не просачивается
 * как отдельная величина — только как поднятый min.
 */
export function computeZone(input: ZoneInput): Zone {
  const t = tdee(input);

  // SAFETY-4 (recovery): при недовесе зона НЕ рекомендует дефицит — нижняя
  // граница = TDEE, верхняя = TDEE+10%. Невидимо: UI показывает диапазон как
  // обычно, без объяснений. Срабатывает только при реальном весе (пропущенный
  // вес даёт proxy BMI 21.7 → ветка не активируется). Проверяется ДО обычной
  // зоны: для недовеса дефицитный диапазон недопустим в принципе.
  if (bmi(input.height, input.weight) < RECOVERY_BMI_THRESHOLD) {
    return { min: t, max: t * (1 + RECOVERY_SURPLUS) };
  }

  const rawMin = t * (1 - ZONE_SPREAD);
  const rawMax = t * (1 + ZONE_SPREAD);
  const floor = mifflinBMR(input); // SAFETY-1: защитный минимум = BMR

  // Защитный минимум поднимает ВЕСЬ диапазон, а не только нижнюю границу.
  // Иначе у мелкого/малоактивного тела (низкий TDEE) floor мог бы превысить
  // верхнюю границу и дать инвертированную зону вроде «1500–1450» — бессмыслицу,
  // которая к тому же бьёт по самой уязвимой low-intake аудитории. Сохраняем
  // ширину полосы, сдвигая её вверх. SPEC задаёт только нижнюю границу
  // (max(TDEE−15%, safety_min)) и про инверсию молчит — это её доопределение.
  //
  // На практике при коэффициентах активности ≥1.2 нижняя граница = BMR·1.02 >
  // BMR, поэтому эта ветка почти не срабатывает — floor=BMR здесь гарантия на
  // краевые случаи (напр. если в будущем появится коэффициент <1.176).
  if (rawMin < floor) {
    const width = rawMax - rawMin;
    return { min: floor, max: floor + width };
  }

  return { min: rawMin, max: rawMax };
}

/**
 * BMR из профиля (для скрытого safety-флага в metrics.ts). Если вес пропущен
 * (опционален при срабатывании слоя 1), берём proxy-вес из роста — как в зоне.
 */
export function bmrFromProfile(p: {
  height: number;
  weight: number | null;
  age: number;
  sex: Sex;
}): number {
  const weight = p.weight ?? proxyWeightFromHeight(p.height);
  return mifflinBMR({ height: p.height, weight, age: p.age, sex: p.sex });
}

/** BMI из роста (см) и веса (кг). Общий хелпер (zone-формула + metrics). */
export function bmi(heightCm: number, weightKg: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

// BMI-серединка нормального диапазона (18.5–24.9) ≈ 21.7. Используется как
// proxy-вес, когда пользователь пропустил вопрос о весе (опционален при
// срабатывании слоя 1 — SPEC «Безопасность»). Так формула даёт зону, не
// заставляя называть вес.
const PROXY_BMI = 21.7;

/** Proxy-вес из роста по серединке нормального BMI. */
export function proxyWeightFromHeight(heightCm: number): number {
  const m = heightCm / 100;
  return PROXY_BMI * m * m;
}

// F8 (LOCKED-B): день с активностью поднимает дневную зону. Множители
// подтверждены диетологом (R1, 2026-06-17) как консервативные. Это НЕ
// burn-калькулятор: фиксированная дневная прибавка к диапазону, без «сожжено».
// Подъём только дневной (Today); недельное среднее не трогаем.
export const WORKOUT_ZONE_MULTIPLIER: Record<WorkoutIntensity, number> = {
  light: 1.08,
  strength: 1.15,
};

// Потолок прибавки (диетолог R1): +300 ккал ИЛИ +15%, что МЕНЬШЕ — защищает
// пользователей с очень высоким TDEE от чрезмерного подъёма.
const WORKOUT_RAISE_CAP_KCAL = 300;
const WORKOUT_RAISE_CAP_PCT = 0.15;

/** Поднимает зону на день с активностью по интенсивности. Прибавка к каждой
 *  границе ограничена потолком (диетолог). Для recovery-зоны (недовес) это
 *  всегда подъём вверх — защита не ослабляется (C4 диетолога). */
export function raiseZoneForWorkout(zone: Zone, intensity: WorkoutIntensity): Zone {
  const m = WORKOUT_ZONE_MULTIPLIER[intensity];
  const raise = (b: number) =>
    b + Math.min(b * (m - 1), WORKOUT_RAISE_CAP_KCAL, b * WORKOUT_RAISE_CAP_PCT);
  return { min: raise(zone.min), max: raise(zone.max) };
}

/**
 * Округление для отображения — до ближайших 25 ккал (SPEC принцип, E3 calibrate).
 * Используется ТОЛЬКО на выводе; в БД храним точное значение.
 */
export function roundForDisplay(kcal: number, step = 25): number {
  return Math.round(kcal / step) * step;
}

/**
 * Готовая строка диапазона для UI: «1700–2000». Без midpoint, без «±».
 */
export function formatZone(zone: Zone, step = 25): string {
  const lo = roundForDisplay(zone.min, step);
  const hi = roundForDisplay(zone.max, step);
  return `${lo}–${hi}`;
}
