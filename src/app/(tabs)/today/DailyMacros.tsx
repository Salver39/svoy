'use client';

// Дневные Б/Ж/У числами под шкалой (numeric, Today R2). Просто факт «что записано
// за день» — БЕЗ целей/референсов/цветовой реакции (handoff §6). Скрыто, пока нет
// ни одного макроса.
//
// Под строкой сумм — КАЧЕСТВЕННЫЕ ориентиры присутствия (п.2, путь Eat4Thought):
// наблюдение, какие макросы встречаются, БЕЗ граммов-целей и оценок. Дополняют
// суммы, не заменяют. Копи — черновик (⚠️ SAFETY-3, content/macro-cues.ts).

import type { DayMacros } from '@/lib/day-macros';
import { hasMacros } from '@/lib/day-macros';
import type { MacroCue } from '@/lib/macro-cues';
import { macroCueText } from '@/content/macro-cues';

export function DailyMacros({ macros, cues = [] }: { macros: DayMacros; cues?: MacroCue[] }) {
  if (!hasMacros(macros)) return null;
  return (
    <div className="mt-4">
      <p className="text-[13.5px] text-ink">
        Белки {Math.round(macros.protein)} · Жиры {Math.round(macros.fat)} · Углеводы{' '}
        {Math.round(macros.carbs)}
        <span className="text-muted"> г за сегодня</span>
      </p>
      {/* Ориентиры присутствия. Без галочек/цвета (галочка = «достижение»);
          отсутствующие макросы сюда не попадают (lib/macro-cues.ts). */}
      {cues.length > 0 && (
        <ul className="mt-2.5 flex flex-col gap-1">
          {cues.map((c) => (
            <li key={c.key} className="flex gap-2 text-[14px] text-ink">
              <span className="text-accent" aria-hidden="true">·</span>
              <span>{macroCueText(c.key, c.regular)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
