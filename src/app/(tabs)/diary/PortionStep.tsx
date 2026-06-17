'use client';

// Шаг порции (F3): грамм задаётся ПРИ выборе продукта, а не дефолтом 100 с
// последующей правкой. Один явный «Добавить», введённое не теряется. В numeric
// показываем ккал+Б/Ж/У для выбранной порции (момент добавления, F1).

import { useState } from 'react';
import type { AppMode, FoodItem } from '@/db/schema';
import { roundCalories } from '@/config/display';
import { MacroGrams } from './MacroGrams';

const DEFAULT_GRAMS = 100;

export function PortionStep({
  food,
  mode,
  onConfirm,
  onBack,
}: {
  food: FoodItem;
  mode: AppMode;
  onConfirm: (grams: number) => void;
  onBack: () => void;
}) {
  const [grams, setGrams] = useState(String(DEFAULT_GRAMS));
  const g = Number(grams);
  const valid = g > 0;
  const factor = g / 100;
  const showCalories = mode === 'numeric' && food.caloriesPer100g > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (valid) onConfirm(g);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div>
        <p className="text-ink">{food.name}</p>
        {food.brand && <p className="mt-0.5 text-[13px] text-muted">{food.brand}</p>}
        {showCalories && (
          <p className="mt-1 text-[14px] text-muted">
            {roundCalories(food.caloriesPer100g * factor)} ккал
          </p>
        )}
        {showCalories && (
          <MacroGrams
            protein={food.protein}
            fat={food.fat}
            carbs={food.carbs}
            factor={factor}
          />
        )}
      </div>

      <label className="block">
        <span className="text-[14px] text-muted">Сколько грамм</span>
        <input
          type="number"
          inputMode="numeric"
          autoFocus
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          className="mt-1 w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink
                     focus:border-accent focus:outline-none"
        />
      </label>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-line px-5 py-3 text-muted"
        >
          Назад
        </button>
        <button
          type="submit"
          disabled={!valid}
          className="flex-1 rounded-xl bg-ink py-3 text-bg disabled:opacity-40"
        >
          Добавить
        </button>
      </div>
    </form>
  );
}
