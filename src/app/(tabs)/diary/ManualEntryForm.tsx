'use client';

// Ручное «быстрое добавление» (BACKLOG E3 AC #3, MVP-cut: только название +
// ккал/100 г, без БЖУ). Создаёт FoodItem с source='custom'.

import { useState } from 'react';
import type { AppMode, FoodItem } from '@/db/schema';

export function ManualEntryForm({
  mode,
  onSubmit,
  onCancel,
}: {
  mode: AppMode;
  onSubmit: (food: FoodItem) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');

  // Мягкий режим: калорий не спрашиваем (никаких чисел на экране, E5 AC #2).
  // Храним caloriesPer100g: 0 — «без числа»; недельный виджет в soft всё равно
  // качественный, а в numeric такие записи не должны тянуть среднее вниз
  // (см. day-meals/weekly-average: 0-ккал трактуется как «без числа»).
  const soft = mode === 'soft';
  const valid = name.trim() !== '' && (soft || Number(kcal) > 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    onSubmit({
      name: name.trim(),
      caloriesPer100g: soft ? 0 : Number(kcal),
      source: 'custom',
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="block">
        <span className="text-[14px] text-muted">Название</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink
                     focus:border-accent focus:outline-none"
        />
      </label>
      {!soft && (
        <label className="block">
          <span className="text-[14px] text-muted">Калорийность на 100 г</span>
          <input
            type="number"
            inputMode="numeric"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink
                       focus:border-accent focus:outline-none"
          />
        </label>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-line px-5 py-3 text-muted"
        >
          Отмена
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
