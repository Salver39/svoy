'use client';

// Главный виджет Today (BACKLOG E4; расхламление R2).
// Зона-ДИАПАЗОН как спокойный якорь (без midpoint) + 7-дневное среднее как
// нейтральный МАРКЕР позиции на полосе зоны. Ноль красного И ноль зелёного даже
// если среднее вне зоны (AC #5).
//
// R2: число недельного среднего ушло в «итоги недели» (нижний шит) — здесь только
// позиция-точка. Пояснение про активность ушло в инфо-иконку у подписи зоны
// (ZoneInfoIcon), caveat «только записанное» — в шит. На главном чисто.

import type { AppMode, Zone } from '@/db/schema';
import { roundCalories } from '@/config/display';
import { zonePosition } from '@/lib/weekly-average';
import { WORKOUT_NOTE_NUMERIC, WORKOUT_NOTE_SOFT } from '@/content/workout';
import { ZoneInfoIcon } from './ZoneInfoIcon';

interface Props {
  zone?: Zone;
  average: number | null;
  daysWithData: number;
  mode: AppMode;
  workoutActive?: boolean; // F8: сегодня отмечена активность → зона поднята
}

export function WeeklyAverage({ zone, average, daysWithData, mode, workoutActive }: Props) {
  // Мягкий режим: числа скрыты полностью, качественный плейсхолдер.
  if (mode === 'soft') {
    return (
      <section className="mt-1">
        <div className="flex items-center gap-2">
          <p className="text-[13px] text-muted">за эту неделю</p>
          {/* ⚠️ SAFETY-3: нота активности — единственный сигнал подъёма в soft. */}
          {workoutActive && <ZoneInfoIcon text={WORKOUT_NOTE_SOFT} />}
        </div>
        {/* ⚠️ SAFETY-3: качественная формулировка — placeholder до ревью. */}
        <p className="mt-2 font-display text-[28px] leading-tight text-ink">ты в своём ритме</p>
      </section>
    );
  }

  // Численный режим без зоны (теоретически не должно случиться) — мягкий фолбэк.
  if (!zone) {
    return (
      <section className="mt-1">
        <p className="text-[13px] text-muted">зона на сегодня</p>
        <p className="mt-2 text-[15px] text-muted">зона ещё не рассчитана</p>
      </section>
    );
  }

  const hasData = average != null && daysWithData > 0;
  const pos = hasData ? zonePosition(average as number, zone) : null;

  return (
    <section className="mt-1">
      <div className="flex items-center gap-2">
        {/* «на сегодня» — день≠неделя: диапазон дневной, маркер недельный. */}
        <p className="text-[13px] tracking-wide text-muted">зона на сегодня</p>
        {/* F8: почему сегодня диапазон выше — в подсказке над иконкой, не строкой. */}
        {workoutActive && <ZoneInfoIcon text={WORKOUT_NOTE_NUMERIC} />}
      </div>

      <p className="mt-1.5 flex items-baseline gap-2.5 font-display text-[56px] font-medium leading-none text-ink">
        {/* en-dash, без midpoint (AC #4); округляем зону для показа (до 25) */}
        {roundCalories(zone.min)}–{roundCalories(zone.max)}
        <span className="font-sans text-[16px] font-normal text-muted">ккал</span>
      </p>

      {/* Полоса зоны + нейтральный маркер недельного среднего. Никакого цвета-сигнала. */}
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
          {hasData ? 'точка — среднее за неделю в твоей зоне' : 'за неделю пока нет записей'}
        </p>
      </div>
    </section>
  );
}
