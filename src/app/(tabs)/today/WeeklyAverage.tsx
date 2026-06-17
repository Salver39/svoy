'use client';

// Главный виджет Today (BACKLOG E4 AC #1,2,4,5).
// Решение A+C: зона-ДИАПАЗОН как спокойный якорь (без midpoint), 7-дневное
// среднее — нейтральный МАРКЕР позиции на полосе зоны. Число среднего скрыто
// по умолчанию (C — опт-ин для тех, кто хочет цифру; предпочтение в localStorage).
// Ноль красного И ноль зелёного даже если среднее вне зоны (AC #5).

import { useEffect, useState } from 'react';
import type { AppMode, Zone } from '@/db/schema';
import { roundCalories } from '@/config/display';
import { zonePosition } from '@/lib/weekly-average';
import { WORKOUT_NOTE_NUMERIC, WORKOUT_NOTE_SOFT } from '@/content/workout';

const SHOW_NUMBER_KEY = 'nimb.showWeeklyNumber';

interface Props {
  zone?: Zone;
  average: number | null;
  daysWithData: number;
  mode: AppMode;
  workoutActive?: boolean; // F8: сегодня отмечена тренировка → зона поднята
}

export function WeeklyAverage({ zone, average, daysWithData, mode, workoutActive }: Props) {
  const [showNumber, setShowNumber] = useState(false);

  useEffect(() => {
    setShowNumber(localStorage.getItem(SHOW_NUMBER_KEY) === '1');
  }, []);

  function toggleNumber() {
    const next = !showNumber;
    setShowNumber(next);
    localStorage.setItem(SHOW_NUMBER_KEY, next ? '1' : '0');
  }

  // Мягкий режим (E5 доработает): числа скрыты полностью, качественный плейсхолдер.
  if (mode === 'soft') {
    return (
      <section className="mt-1">
        <p className="text-[13px] text-muted">за эту неделю</p>
        {/* ⚠️ SAFETY-3: качественная формулировка — placeholder до ревью. */}
        <p className="mt-2 font-display text-[28px] leading-tight text-ink">
          ты в своём ритме
        </p>
        {/* F8: в soft чисел нет → подъём нормы передаёт только эта строка (заглушка). */}
        {workoutActive && (
          <p className="mt-3 text-[12.5px] leading-snug text-muted">{WORKOUT_NOTE_SOFT}</p>
        )}
        <p className="mt-3 max-w-[300px] text-[12.5px] leading-snug text-muted">
          здесь только то, что записано — не обязательно вся еда
        </p>
      </section>
    );
  }

  // Численный режим без зоны (теоретически не должно случиться) — мягкий фолбэк.
  if (!zone) {
    return (
      <section className="mt-1">
        <p className="text-[13px] text-muted">за эту неделю</p>
        <p className="mt-2 text-[15px] text-muted">зона ещё не рассчитана</p>
      </section>
    );
  }

  const hasData = average != null && daysWithData > 0;
  const pos = hasData ? zonePosition(average as number, zone) : null;

  return (
    <section className="mt-1">
      <p className="text-[13px] tracking-wide text-muted">твоя зона</p>

      <p className="mt-1.5 flex items-baseline gap-2.5 font-display text-[56px] font-medium leading-none text-ink">
        {/* en-dash, без midpoint (AC #4); округляем зону для показа (до 25) */}
        {roundCalories(zone.min)}–{roundCalories(zone.max)}
        <span className="font-sans text-[16px] font-normal text-muted">ккал</span>
      </p>

      {/* F8: поясняем, почему сегодня диапазон выше (заглушка SAFETY-3). */}
      {workoutActive && (
        <p className="mt-2 text-[12.5px] leading-snug text-muted">{WORKOUT_NOTE_NUMERIC}</p>
      )}

      {/* Полоса зоны + нейтральный маркер среднего. Никакого цвета-сигнала. */}
      <div className="mt-5 max-w-[300px]">
        <div className="relative h-1.5 rounded-full bg-surface">
          {pos != null && (
            <span
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted ring-2 ring-bg"
              style={{ left: `${pos * 100}%` }}
              aria-hidden="true"
            />
          )}
        </div>
        <p className="mt-2 text-[12px] text-muted">
          {hasData
            ? 'точка — твоё среднее за неделю'
            : 'за неделю пока нет записей'}
        </p>
      </div>

      {/* C: опт-ин число для тех, кто хочет цифру. По умолчанию скрыто. */}
      {hasData && (
        <button
          type="button"
          onClick={toggleNumber}
          className="mt-3 text-[13px] text-muted underline underline-offset-2 decoration-line"
        >
          {showNumber ? 'скрыть число' : 'показать среднее числом'}
        </button>
      )}
      {hasData && showNumber && (
        <p className="mt-1.5 text-[14px] text-ink">
          ≈ {roundCalories(average as number)} ккал/день
          <span className="text-muted"> · за {daysWithData} дн.</span>
        </p>
      )}

      {/* Caveat над недельным виджетом (AC #2, SPEC принцип 16). */}
      <p className="mt-4 max-w-[300px] text-[12.5px] leading-snug text-muted">
        здесь только то, что записано — не обязательно вся еда
      </p>
    </section>
  );
}
