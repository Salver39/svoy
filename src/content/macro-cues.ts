// Копи качественных ориентиров Б/Ж/У (п.2).
//
// ⚠️ SAFETY-3 (тип) — ЧЕРНОВИК-формулировки, до ревью психолога + UX-редактора
// (см. SAFETY-MACRO-CUES-DRAFT.md). Правила: наблюдение, НЕ оценка; про
// отсутствующий макрос НЕ пишем (строка вообще не создаётся в lib/macro-cues.ts);
// запрещены «достаточно/хорошо/мало/норма/цель». Никаких галочек/цвета на рендере.

import type { MacroKey } from '@/lib/macro-cues';

export function macroCueText(key: MacroKey, regular: boolean): string {
  switch (key) {
    case 'protein':
      // Частотный вариант — черновая градация (open question специалисту).
      return regular ? 'белок встречается сегодня регулярно' : 'белок встречается сегодня';
    case 'fat':
      return 'есть источники жиров';
    case 'carbs':
      return 'есть углеводы';
  }
}
