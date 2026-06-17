'use client';

// Поиск продуктов в Open Food Facts (BACKLOG E3 AC #1-2).
// Спокойные состояния: пусто / оффлайн → не ошибка, а предложение добавить
// вручную. В результате видны ккал + Б/Ж/У на 100 г — это «момент добавления»,
// КБЖУ показываем в ОБОИХ режимах, включая soft (F1, решение A). Числа скрываются
// только ПОСЛЕ логирования (недельный виджет, список записей в soft).
//
// F4: живой поиск по мере ввода (debounce + отмена предыдущего запроса), без
// кнопки «Найти». Бережём rate-limit OFF: запрос только после паузы в наборе и
// от MIN_CHARS символов; устаревшие ответы отбрасываются по reqId.

import { useEffect, useRef, useState } from 'react';
import type { FoodItem } from '@/db/schema';
import { searchFoods, type SearchOutcome } from '@/lib/off-api';
import { roundCalories } from '@/config/display';
import { MacroGrams } from './MacroGrams';
import { BrandTag } from './BrandTag';
import { NoResults } from './empty-states/NoResults';
import { Offline } from './empty-states/Offline';

const MIN_CHARS = 2; // короче — не ищем (шум + лишняя нагрузка на OFF)
const DEBOUNCE_MS = 400;

export function SearchView({
  onPick,
  onManualAdd,
}: {
  onPick: (food: FoodItem) => void;
  onManualAdd: () => void;
}) {
  const [query, setQuery] = useState('');
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    const q = query.trim();
    // Короткий/пустой ввод: отменяем текущий запрос и прячем результат.
    if (q.length < MIN_CHARS) {
      abortRef.current?.abort();
      reqIdRef.current += 1; // инвалидируем ответ запроса «на лету»
      setOutcome(null);
      setLoading(false);
      return;
    }

    const handle = setTimeout(async () => {
      abortRef.current?.abort(); // вытесняем предыдущий запрос
      const controller = new AbortController();
      abortRef.current = controller;
      const id = ++reqIdRef.current;
      setLoading(true);
      const result = await searchFoods(q, { signal: controller.signal });
      if (id !== reqIdRef.current) return; // устаревший ответ — игнорируем
      setOutcome(result);
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle); // новый ввод — сбрасываем debounce
  }, [query]);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Найти продукт"
        aria-label="Поиск продукта"
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink
                   placeholder:text-muted focus:border-accent focus:outline-none"
      />

      <div className="mt-4">
        {loading && outcome == null && (
          <p className="text-[14px] text-muted">…</p>
        )}
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
                  {/* Бренд отдельным чипом (F2): брендовое явно отличается от
                      generic, у которого чипа нет. */}
                  {food.brand && (
                    <div className="mt-1">
                      <BrandTag brand={food.brand} />
                    </div>
                  )}
                  {/* Момент добавления: ккал + Б/Ж/У на 100 г в обоих режимах (F1). */}
                  <p className="mt-1 text-[14px] text-muted">
                    {roundCalories(food.caloriesPer100g)} ккал / 100 г
                  </p>
                  <MacroGrams
                    protein={food.protein}
                    fat={food.fat}
                    carbs={food.carbs}
                  />
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
