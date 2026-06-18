'use client';

// Дневные Б/Ж/У шкалой (soft, Today R2). Полоски = ДОЛЯ ПО ГРАММАМ от суммы Б+Ж+У
// за день (owner 2026-06-17): пропорция «состава записанного», сумма = 100%. БЕЗ
// нормы-референса (это была бы скрытая цель — handoff §6 отложил отдельным safety-
// вопросом). Ноль красного/зелёного. Скрыто, пока нет ни одного макроса.
//
// Подпись «за сегодня» обязательна: шкала рендерится сразу под блоком
// WeeklyAverage («за эту неделю») и без неё читается как недельная (фидбэк
// 2026-06-18). Владелец: оба режима — за день; numeric DailyMacros уже подписан
// «г за сегодня», soft теперь симметрично.

import type { DayMacros } from '@/lib/day-macros';
import { hasMacros } from '@/lib/day-macros';

const ROWS: { key: keyof DayMacros; label: string }[] = [
  { key: 'protein', label: 'Белки' },
  { key: 'fat', label: 'Жиры' },
  { key: 'carbs', label: 'Углеводы' },
];

export function MacroScale({ macros }: { macros: DayMacros }) {
  if (!hasMacros(macros)) return null;
  const total = macros.protein + macros.fat + macros.carbs;

  return (
    <section className="mt-5 max-w-[300px]" aria-label="состав записанного за сегодня">
      <p className="mb-3 text-[13px] text-muted">за сегодня</p>
      <div className="flex flex-col gap-2.5">
        {ROWS.map(({ key, label }) => {
        const pct = total > 0 ? (macros[key] / total) * 100 : 0;
        return (
          <div key={key} className="flex items-center gap-2.5">
            <span className="w-[62px] text-[13px] text-muted">{label}</span>
            <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-accent/55"
                style={{ width: `${pct}%` }}
                aria-hidden="true"
              />
            </span>
          </div>
          );
        })}
      </div>
    </section>
  );
}
