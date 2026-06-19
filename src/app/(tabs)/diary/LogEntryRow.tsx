'use client';

// Строка записи дневника (BACKLOG E3 AC #8-9).
// numeric: название + калории (округлены до 25) + Б/Ж/У + грамм + источник.
// F1 (решение A): КБЖУ показываются сразу, без раскрывашки. В soft числа в
// списке записей скрыты (числа прячутся ПОСЛЕ логирования). Правка грамм и
// удаление — в один тап из самой записи, не из глубины меню.

import { useState } from 'react';
import type { AppMode, FoodItem, LogEntry } from '@/db/schema';
import { roundCalories } from '@/config/display';
import { MacroGrams } from './MacroGrams';
import { BrandTag } from './BrandTag';

// Читаемая подпись источника (F10): «OFF» непонятно. Нейтрально, без оценки.
const SOURCE_LABEL: Record<FoodItem['source'], string> = {
  off: 'база продуктов',
  custom: 'вручную',
};

export function LogEntryRow({
  entry,
  food,
  mode,
  readOnly,
  onDelete,
  onUpdateGrams,
}: {
  entry: LogEntry;
  food: FoodItem;
  mode: AppMode;
  readOnly?: boolean; // прошлые дни — только просмотр (фидбэк 2026-06-19)
  onDelete: () => void;
  onUpdateGrams: (grams: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [gramsDraft, setGramsDraft] = useState(String(entry.grams));

  const factor = entry.grams / 100;
  const kcal = roundCalories(food.caloriesPer100g * factor);
  // Числа калорий/КБЖУ скрыты в мягком режиме (E5 AC #2). Запись без числа
  // (caloriesPer100g 0) тоже не показывает «0 ккал» в numeric.
  const showCalories = mode === 'numeric' && food.caloriesPer100g > 0;

  function commitGrams() {
    const g = Number(gramsDraft);
    if (g > 0) onUpdateGrams(g);
    setEditing(false);
  }

  return (
    <li className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-ink">{food.name}</p>
          <p className="mt-0.5 text-[14px] text-muted">
            {showCalories && <>{kcal} ккал · </>}
            {entry.grams} г
            <span className="ml-2 rounded bg-raised px-1.5 py-0.5 text-[12px] text-muted">
              {SOURCE_LABEL[food.source]}
            </span>
          </p>
          {/* Бренд отдельным чипом (F2/F10): раньше был вклеен в name. */}
          {food.brand && (
            <div className="mt-1">
              <BrandTag brand={food.brand} />
            </div>
          )}
          {/* F1: КБЖУ сразу в numeric, без раскрывашки. В soft скрыто. */}
          {showCalories && (
            <MacroGrams
              protein={food.protein}
              fat={food.fat}
              carbs={food.carbs}
              factor={factor}
              className="mt-0.5 text-[12px] text-muted"
            />
          )}
        </div>
        {!readOnly && (
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
        )}
      </div>

      {!readOnly && editing && (
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
    </li>
  );
}
