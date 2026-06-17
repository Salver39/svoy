'use client';

// Отметка активности на день (F8, LOCKED-B; SAFETY-3 reviewed 2026-06-17).
// Два уровня-утверждения про СОБСТВЕННЫЙ опыт активности (без слов
// тренировка/силовая/кардио/спорт — специалист: компенсаторный фрейм запрещён).
// Тап по неактивному — ставит, по активному — снимает. НЕ фитнес-дашборд: без
// длительности/«сожжено»/стриков. Активный вариант на --surface-raised.

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
    <div className="mt-5">
      <p className="mb-2 text-[13px] text-muted">{WORKOUT_MARK_LABEL}</p>
      <div className="flex flex-col gap-2" role="group" aria-label={WORKOUT_MARK_LABEL}>
        {OPTIONS.map((opt) => {
          const active = intensity === opt;
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : opt)}
              className={`rounded-xl px-4 py-2.5 text-left text-[14px] transition-colors ${
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
