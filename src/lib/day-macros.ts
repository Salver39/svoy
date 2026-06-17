// Дневные суммы Б/Ж/У за сегодня (Today R2 — расхламление).
// numeric показывает их числами под шкалой, soft — пропорцией (доля по граммам).
// СОЗНАТЕЛЬНО без целей/референсов: только факт «что записано за день» (handoff §6 —
// макро-цели это tracker-поверхность и отдельный safety-вопрос, в R2 не закладываем).
//
// Макросы у FoodItem опциональны (protein/fat/carbs?). Суммируем то, что есть;
// записи без какого-то макроса просто не вносят вклад в его сумму.

import type { FoodItem, LogEntry } from '@/db/schema';

export interface DayMacros {
  protein: number; // г за день
  fat: number; // г за день
  carbs: number; // г за день
}

export function summarizeDayMacros(
  entries: LogEntry[],
  foods: Map<number, FoodItem>,
): DayMacros {
  let protein = 0;
  let fat = 0;
  let carbs = 0;
  for (const e of entries) {
    const food = foods.get(e.foodItemId);
    if (!food) continue;
    const factor = e.grams / 100;
    if (food.protein != null) protein += food.protein * factor;
    if (food.fat != null) fat += food.fat * factor;
    if (food.carbs != null) carbs += food.carbs * factor;
  }
  return { protein, fat, carbs };
}

/** Есть ли хоть один ненулевой макрос — иначе блок Б/Ж/У не показываем. */
export function hasMacros(m: DayMacros): boolean {
  return m.protein > 0 || m.fat > 0 || m.carbs > 0;
}
