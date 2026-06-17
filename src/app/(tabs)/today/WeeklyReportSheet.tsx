'use client';

// «Итоги недели» — нижний шит поверх затемнения (Today R2, паттерн как mood-шит).
// Здесь и ТОЛЬКО здесь живут недельные числа: среднее ккал/день + средние Б/Ж/У/день
// за 7 дней + caveat «только записанное» (handoff §4). Закрытие — тап по затемнению,
// по «крестику» нет: достаточно фона (как у mood). Ноль красного/зелёного, без целей.

import { useEffect } from 'react';
import { roundCalories } from '@/config/display';
import type { WeeklyMacros } from '@/lib/weekly-average';

interface Props {
  average: number | null;
  daysWithData: number;
  macros: WeeklyMacros | null;
  onClose: () => void;
}

const MACRO_ROWS: { key: keyof WeeklyMacros; label: string }[] = [
  { key: 'protein', label: 'Белки' },
  { key: 'fat', label: 'Жиры' },
  { key: 'carbs', label: 'Углеводы' },
];

export function WeeklyReportSheet({ average, daysWithData, macros, onClose }: Props) {
  // Esc закрывает (десктоп/доступность); фон всё равно тапается.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const hasData = average != null && daysWithData > 0;

  return (
    <div
      className="fixed inset-0 z-30 flex items-end bg-ink/30"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="итоги недели"
    >
      <div
        className="w-full rounded-t-[22px] bg-bg px-6 pb-8 pt-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-line" aria-hidden="true" />

        <h3 className="font-display text-[22px] font-medium text-ink">итоги недели</h3>
        <p className="mt-1 text-[12.5px] text-muted">за последние 7 дней · только записанное</p>

        {hasData ? (
          <>
            <p className="mt-4 font-display text-[34px] font-medium leading-none text-ink">
              ≈ {roundCalories(average as number)}{' '}
              <span className="font-sans text-[14px] font-normal text-muted">ккал/день</span>
            </p>
            <p className="mt-1.5 text-[12.5px] text-muted">в среднем по дням с записями</p>
          </>
        ) : (
          <p className="mt-4 text-[15px] text-muted">за неделю пока нет записей</p>
        )}

        {macros && (
          <div className="mt-5">
            {MACRO_ROWS.map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center justify-between border-t border-line py-2.5 text-[14px] text-ink"
              >
                <span>{label}</span>
                <span className="text-muted">≈ {Math.round(macros[key])} г/день</span>
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 text-[12px] leading-snug text-muted">
          это то, что записано — не обязательно вся еда
        </p>
      </div>
    </div>
  );
}
