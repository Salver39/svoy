'use client';

// Строка записи дневника (BACKLOG E3 AC #8-9).
// Свёрнуто: название + калории (округлены до 25) + грамм + индикатор источника.
// КБЖУ скрыты по умолчанию — раскрываются тапом. Правка грамм и удаление —
// в один тап из самой записи, не из глубины меню.

import { useState } from 'react';
import type { AppMode, FoodItem, LogEntry } from '@/db/schema';
import { roundCalories } from '@/config/display';

const SOURCE_LABEL: Record<FoodItem['source'], string> = {
  off: 'OFF',
  custom: 'своё',
};

export function LogEntryRow({
  entry,
  food,
  mode,
  onDelete,
  onUpdateGrams,
}: {
  entry: LogEntry;
  food: FoodItem;
  mode: AppMode;
  onDelete: () => void;
  onUpdateGrams: (grams: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [gramsDraft, setGramsDraft] = useState(String(entry.grams));

  const factor = entry.grams / 100;
  const kcal = roundCalories(food.caloriesPer100g * factor);
  // Числа калорий/КБЖУ скрыты в мягком режиме (E5 AC #2). Запись без числа
  // (caloriesPer100g 0) тоже не показывает «0 ккал» в numeric.
  const showCalories = mode === 'numeric' && food.caloriesPer100g > 0;
  const hasMacros =
    showCalories &&
    (food.protein != null || food.fat != null || food.carbs != null);

  function commitGrams() {
    const g = Number(gramsDraft);
    if (g > 0) onUpdateGrams(g);
    setEditing(false);
  }

  return (
    <li className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => hasMacros && setExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-ink">{food.name}</p>
          <p className="mt-0.5 text-[14px] text-muted">
            {showCalories && <>{kcal} ккал · </>}
            {entry.grams} г
            <span className="ml-2 rounded bg-raised px-1.5 py-0.5 text-[12px] text-muted">
              {SOURCE_LABEL[food.source]}
            </span>
          </p>
        </button>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            aria-label="Изменить количество"
            className="text-[14px] text-muted"
          >
            Правка
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Удалить запись"
            className="text-[14px] text-muted"
          >
            Удалить
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={gramsDraft}
            onChange={(e) => setGramsDraft(e.target.value)}
            className="w-24 rounded-lg border border-line bg-raised px-3 py-2 text-ink
                       focus:border-accent focus:outline-none"
          />
          <span className="text-[14px] text-muted">г</span>
          <button
            type="button"
            onClick={commitGrams}
            className="rounded-lg bg-ink px-3 py-2 text-[14px] text-bg"
          >
            Сохранить
          </button>
        </div>
      )}

      {/* КБЖУ скрыты по умолчанию (Eikey 2021); видны только при раскрытии. */}
      {expanded && hasMacros && (
        <dl className="mt-3 flex gap-4 text-[12px] text-muted">
          {food.protein != null && (
            <div>
              <dt className="inline">Б </dt>
              <dd className="inline">{Math.round(food.protein * factor)} г</dd>
            </div>
          )}
          {food.fat != null && (
            <div>
              <dt className="inline">Ж </dt>
              <dd className="inline">{Math.round(food.fat * factor)} г</dd>
            </div>
          )}
          {food.carbs != null && (
            <div>
              <dt className="inline">У </dt>
              <dd className="inline">{Math.round(food.carbs * factor)} г</dd>
            </div>
          )}
        </dl>
      )}
    </li>
  );
}
