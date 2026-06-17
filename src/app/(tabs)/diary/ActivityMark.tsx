'use client';

// Отметка активности на день (F8, LOCKED-B; SAFETY-3 reviewed 2026-06-17).
// R2: контрол ПЕРЕЕХАЛ с Today в Дневник (handoff §2.5). Механика не менялась —
// разовое действие, лок на день. На Today факт активности теперь отражают только
// поднятая зона и инфо-иконка (ZoneInfoIcon).
//
// Два уровня-утверждения про СОБСТВЕННЫЙ опыт активности (без слов
// тренировка/силовая/кардио/спорт — специалист: компенсаторный фрейм запрещён).
//
// Поведение: исходно — кнопка-аффорданс «+ отметить активность». Тап раскрывает
// два уровня. Тап по уровню = коммит: выбор СОХРАНЯЕТСЯ и БЛОКИРУЕТСЯ до завтра
// без отмены (owner: «закрывать сразу, без отмены»). На след. день записи за новую
// дату нет → блок снова показывает кнопку. НЕ фитнес-дашборд: без длительности/
// «сожжено»/стриков. Заголовок «активность сегодня» виден всегда (E1–E3).

import { useState } from 'react';
import type { WorkoutIntensity } from '@/db/schema';
import {
  WORKOUT_MARK_LABEL,
  WORKOUT_ADD_LABEL,
  WORKOUT_INTENSITY_LABEL,
} from '@/content/workout';

const OPTIONS: WorkoutIntensity[] = ['light', 'strength'];

export function ActivityMark({
  intensity,
  onChange,
}: {
  intensity: WorkoutIntensity | null;
  onChange: (next: WorkoutIntensity) => void;
}) {
  // Локальное раскрытие списка уровней до коммита. После коммита intensity != null
  // и блок переходит в locked-состояние независимо от этого флага.
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-line px-4 py-3.5">
      <p className="mb-2.5 text-[13px] text-muted">{WORKOUT_MARK_LABEL}</p>

      {intensity ? (
        // Locked: выбор сделан на сегодня — read-only до завтра, без отмены.
        <div className="rounded-xl bg-raised px-4 py-2.5 text-[14px] text-ink shadow-sm">
          {WORKOUT_INTENSITY_LABEL[intensity]}
        </div>
      ) : open ? (
        // Выбор уровня. Тап по любому варианту коммитит и блокирует.
        <div className="flex flex-col gap-2" role="group" aria-label={WORKOUT_MARK_LABEL}>
          {OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className="rounded-xl border border-line px-4 py-2.5 text-left text-[14px] text-muted transition-colors"
            >
              {WORKOUT_INTENSITY_LABEL[opt]}
            </button>
          ))}
        </div>
      ) : (
        // Исходно: кнопка-аффорданс раскрывает варианты.
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[14px] text-muted transition-colors"
        >
          {WORKOUT_ADD_LABEL}
        </button>
      )}
    </div>
  );
}
