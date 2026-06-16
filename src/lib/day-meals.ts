// Группировка приёмов за сегодня для Today (BACKLOG E4 AC #3).
// Показываем per-meal ккал (округлено до 25). НЕТ суммарного числа за день
// (SPEC принцип 2 — дневной счётчик-число это поверхность compensatory
// restriction).

import { roundCalories } from '@/config/display';
import { MEALS } from './meals';
import type { FoodItem, LogEntry, Meal } from '@/db/schema';

export interface MealSummary {
  meal: Meal;
  count: number; // сколько записей в приёме
  kcal: number; // суммарные ккал приёма, округлено до 25 (0 если пусто)
  kcalKnown: boolean; // есть ли хотя бы одна запись с числом (>0); иначе «отмечено»
}

export function summarizeDay(
  entries: LogEntry[],
  foods: Map<number, FoodItem>,
): MealSummary[] {
  const raw: Record<Meal, { kcal: number; count: number; known: boolean }> = {
    breakfast: { kcal: 0, count: 0, known: false },
    lunch: { kcal: 0, count: 0, known: false },
    dinner: { kcal: 0, count: 0, known: false },
    snack: { kcal: 0, count: 0, known: false },
  };

  for (const e of entries) {
    const food = foods.get(e.foodItemId);
    if (!food) continue;
    raw[e.meal].count += 1;
    // Записи «без числа» (caloriesPer100g 0, мягкий режим) считаются как факт
    // приёма, но не дают «0 ккал» — иначе в numeric это читается как осуждение.
    if (food.caloriesPer100g > 0) {
      raw[e.meal].kcal += (food.caloriesPer100g * e.grams) / 100;
      raw[e.meal].known = true;
    }
  }

  return MEALS.map((meal) => ({
    meal,
    count: raw[meal].count,
    kcal: roundCalories(raw[meal].kcal),
    kcalKnown: raw[meal].known,
  }));
}
