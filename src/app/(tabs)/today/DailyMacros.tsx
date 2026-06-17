'use client';

// Дневные Б/Ж/У числами под шкалой (numeric, Today R2). Просто факт «что записано
// за день» — БЕЗ целей/референсов/цветовой реакции (handoff §6). Скрыто, пока нет
// ни одного макроса.

import type { DayMacros } from '@/lib/day-macros';
import { hasMacros } from '@/lib/day-macros';

export function DailyMacros({ macros }: { macros: DayMacros }) {
  if (!hasMacros(macros)) return null;
  return (
    <p className="mt-4 text-[13.5px] text-ink">
      Белки {Math.round(macros.protein)} · Жиры {Math.round(macros.fat)} · Углеводы{' '}
      {Math.round(macros.carbs)}
      <span className="text-muted"> г за сегодня</span>
    </p>
  );
}
