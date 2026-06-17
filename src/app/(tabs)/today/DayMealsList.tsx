'use client';

// Список приёмов за сегодня на Today (BACKLOG E4 AC #3).
// Per-meal ккал (округлено до 25). НЕТ суммарного числа за день (SPEC принцип 2).
// Добавление живёт в Диарии — «+ добавить» уводит на /diary.

import Link from 'next/link';
import type { AppMode } from '@/db/schema';
import { MEAL_LABEL } from '@/lib/meals';
import type { MealSummary } from '@/lib/day-meals';

interface Props {
  meals: MealSummary[];
  mode: AppMode;
}

export function DayMealsList({ meals, mode }: Props) {
  return (
    <section>
      <ul>
        {meals.map((m) => (
          <li
            key={m.meal}
            className="flex items-center justify-between border-t border-line py-3.5 first:border-t-0"
          >
            <span className="text-[16px] text-ink">{MEAL_LABEL[m.meal]}</span>

            {m.count > 0 && mode === 'numeric' && m.kcalKnown ? (
              <span className="text-[15px] text-muted tabular-nums">{m.kcal} ккал</span>
            ) : m.count > 0 ? (
              // мягкий режим ИЛИ запись без числа: нейтральная отметка «есть запись»
              <span className="text-[14px] text-muted">отмечено</span>
            ) : (
              <Link href="/diary" className="flex items-center gap-1.5 py-3 -my-3 text-[14px] text-muted">
                <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                добавить
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
