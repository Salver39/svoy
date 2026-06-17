'use client';

// Ручное «быстрое добавление» (BACKLOG E3 AC #3).
// F1 (решение A): спрашиваем ккал + Б/Ж/У в ОБОИХ режимах, включая soft —
// КБЖУ относятся к моменту добавления. Числа НЕ обязательны: пустая ккал = 0
// («пользователь намеренно не указал» — sentinel, такие записи не тянут
// недельное среднее, см. day-meals/weekly-average). Создаёт FoodItem source='custom'.

import { useState } from 'react';
import type { FoodItem } from '@/db/schema';

export function ManualEntryForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (food: FoodItem) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');

  // Обязательно только название. Числа опциональны (см. sentinel выше).
  const valid = name.trim() !== '';

  // Пустое/нечисловое/≤0 поле → не сохраняем (undefined для макро, 0 для ккал).
  function num(v: string): number | undefined {
    const n = Number(v);
    return v.trim() !== '' && n > 0 ? n : undefined;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    onSubmit({
      name: name.trim(),
      caloriesPer100g: num(kcal) ?? 0,
      protein: num(protein),
      fat: num(fat),
      carbs: num(carbs),
      source: 'custom',
    });
  }

  const fieldClass =
    'mt-1 w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink focus:border-accent focus:outline-none';

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="block">
        <span className="text-[14px] text-muted">Название</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
      </label>

      <label className="block">
        <span className="text-[14px] text-muted">Калорийность на 100 г</span>
        <input
          type="number"
          inputMode="numeric"
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
          className={fieldClass}
        />
      </label>

      {/* Б/Ж/У на 100 г — опциональны (F1). Нейтральные поля, без подсветки. */}
      <div className="grid grid-cols-3 gap-2">
        <label className="block">
          <span className="text-[14px] text-muted">Б, г</span>
          <input
            type="number"
            inputMode="decimal"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="text-[14px] text-muted">Ж, г</span>
          <input
            type="number"
            inputMode="decimal"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="text-[14px] text-muted">У, г</span>
          <input
            type="number"
            inputMode="decimal"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

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
