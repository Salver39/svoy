// Качественные ориентиры Б/Ж/У (п.2, путь Eat4Thought — рефлексия вместо чисел).
// НЕ нормы и НЕ цели: только наблюдение, какие макросы ВСТРЕЧАЮТСЯ за день.
//
// Правила (SAFETY-MACRO-CUES-DRAFT.md):
//  - Только присутствие. Про отсутствующий макрос НЕ сообщаем (принцип 16: не
//    патологизируем недо-лог; absence-строка читается как пробел/вина).
//  - Наблюдение, не оценка. Никаких «достаточно/хорошо/мало».
//  - Дневные суммы в граммах остаются отдельно (ориентиры ИХ дополняют).
//  - Только numeric (рендерится из DailyMacros, который живёт под numeric-веткой).
// Копи — в content/macro-cues.ts (⚠️ черновик до SAFETY-3-ревью).

import type { FoodItem, LogEntry, Meal } from '@/db/schema';

export type MacroKey = 'protein' | 'fat' | 'carbs';

export interface MacroCue {
  key: MacroKey;
  /** Встречается в ≥2 приёмах за день → частотный вариант копи (черновая градация,
   *  open question специалисту: не читается ли «регулярно» как скоринг). */
  regular: boolean;
}

const MACRO_KEYS: MacroKey[] = ['protein', 'fat', 'carbs'];

// ЧЕРНОВИК-пороги присутствия (г/день): отсекают следовые количества, чтобы
// «есть источники жиров» не появлялось от 0.4 г. Конкретные значения — open
// question специалисту (SAFETY-MACRO-CUES-DRAFT.md), здесь консервативно малые.
const PRESENCE_THRESHOLD_G: Record<MacroKey, number> = {
  protein: 5,
  fat: 3,
  carbs: 5,
};

// «Регулярно» — макрос встречается минимум в стольких приёмах за день.
const REGULAR_MEAL_COUNT = 2;

/**
 * Ориентиры присутствия макросов за день. Возвращает ТОЛЬКО присутствующие
 * макросы (отсутствующие молчат). Порядок фиксирован: белки, жиры, углеводы.
 */
export function macroCuesForDay(
  entries: LogEntry[],
  foods: Map<number, FoodItem>,
): MacroCue[] {
  const totals: Record<MacroKey, number> = { protein: 0, fat: 0, carbs: 0 };
  const mealsWith: Record<MacroKey, Set<Meal>> = {
    protein: new Set(),
    fat: new Set(),
    carbs: new Set(),
  };

  for (const e of entries) {
    const food = foods.get(e.foodItemId);
    if (!food) continue;
    const factor = e.grams / 100;
    for (const k of MACRO_KEYS) {
      const per100 = food[k];
      if (per100 != null && per100 > 0) {
        totals[k] += per100 * factor;
        mealsWith[k].add(e.meal);
      }
    }
  }

  const cues: MacroCue[] = [];
  for (const k of MACRO_KEYS) {
    if (totals[k] >= PRESENCE_THRESHOLD_G[k]) {
      cues.push({ key: k, regular: mealsWith[k].size >= REGULAR_MEAL_COUNT });
    }
  }
  return cues;
}
