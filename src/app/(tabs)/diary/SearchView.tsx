'use client';

// Поиск продуктов в Open Food Facts (BACKLOG E3 AC #1-2).
// Спокойные состояния: пусто / оффлайн → не ошибка, а предложение добавить
// вручную. Первичное число в результате — только калории (округлены до 25).

import { useState } from 'react';
import type { AppMode, FoodItem } from '@/db/schema';
import { searchFoods, type SearchOutcome } from '@/lib/off-api';
import { roundCalories } from '@/config/display';
import { NoResults } from './empty-states/NoResults';
import { Offline } from './empty-states/Offline';

export function SearchView({
  mode,
  onPick,
  onManualAdd,
}: {
  mode: AppMode;
  onPick: (food: FoodItem) => void;
  onManualAdd: () => void;
}) {
  const [query, setQuery] = useState('');
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null);
  const [loading, setLoading] = useState(false);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setOutcome(await searchFoods(query));
    setLoading(false);
  }

  return (
    <div>
      <form onSubmit={runSearch} className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти продукт"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink
                     placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-xl bg-ink px-4 py-3 text-bg disabled:opacity-40"
        >
          {loading ? '…' : 'Найти'}
        </button>
      </form>

      <div className="mt-4">
        {outcome?.kind === 'ok' && (
          <ul className="flex flex-col gap-2">
            {outcome.items.map((food, i) => (
              <li key={food.offId ?? i}>
                <button
                  type="button"
                  onClick={() => onPick(food)}
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3
                             text-left hover:border-muted"
                >
                  <p className="truncate text-ink">{food.name}</p>
                  {/* Мягкий режим: число калорий скрыто (E5 AC #2). */}
                  {mode === 'numeric' && (
                    <p className="mt-0.5 text-[14px] text-muted">
                      {roundCalories(food.caloriesPer100g)} ккал / 100 г
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        {outcome?.kind === 'empty' && <NoResults onManualAdd={onManualAdd} />}
        {outcome?.kind === 'offline' && <Offline onManualAdd={onManualAdd} />}
        {outcome?.kind === 'error' && <Offline onManualAdd={onManualAdd} />}
      </div>
    </div>
  );
}
