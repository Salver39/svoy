'use client';

// Отметка тренировки на день (F8, LOCKED-B). Минимальная поверхность: подпись +
// две интенсивности (лёгкая / силовая) как чипы. Тап по неактивной — ставит, по
// активной — снимает. НЕ фитнес-дашборд: без длительности, без «сожжено», без
// стриков. Активный чип на --surface-raised (как переключатель режима), иконок нет.

import type { WorkoutIntensity } from '@/db/schema';
import { WORKOUT_MARK_LABEL, WORKOUT_INTENSITY_LABEL } from '@/content/workout';

const OPTIONS: WorkoutIntensity[] = ['light', 'strength'];

export function WorkoutMark({
  intensity,
  onChange,
}: {
  intensity: WorkoutIntensity | null;
  onChange: (next: WorkoutIntensity | null) => void;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
      {/* ⚠️ копи — заглушка до ревью специалиста (SAFETY-3). */}
      <span className="text-[13px] text-muted">{WORKOUT_MARK_LABEL}</span>
      <div className="flex gap-2" role="group" aria-label="Интенсивность тренировки">
        {OPTIONS.map((opt) => {
          const active = intensity === opt;
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : opt)}
              className={`rounded-full px-3.5 py-[7px] text-[13px] transition-colors ${
                active
                  ? 'bg-raised text-ink shadow-sm'
                  : 'border border-line text-muted'
              }`}
            >
              {WORKOUT_INTENSITY_LABEL[opt]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
