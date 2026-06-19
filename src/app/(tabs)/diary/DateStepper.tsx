'use client';

// Переключатель даты для Дневника (фидбэк 2026-06-19: нужна история прошлых дней).
// Прошлые дни — только просмотр (решение владельца), поэтому вперёд за «сегодня»
// двигаться нельзя (и future-date запрещён в data layer). Тон спокойный, без
// guilt-копи при возврате назад (принцип 15 graceful return).

import { shiftDateISO, todayISO } from '@/lib/log-entry';

const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function label(dateISO: string): string {
  const today = todayISO();
  if (dateISO === today) return 'сегодня';
  if (dateISO === shiftDateISO(today, -1)) return 'вчера';
  const [, m, d] = dateISO.split('-').map(Number);
  return `${d} ${MONTHS_GEN[m - 1]}`;
}

export function DateStepper({
  date,
  onChange,
}: {
  date: string;
  onChange: (next: string) => void;
}) {
  const canGoNext = date < todayISO(); // вперёд только до сегодня включительно

  return (
    <div className="mt-1 flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(shiftDateISO(date, -1))}
        aria-label="Предыдущий день"
        className="-my-2 py-2 text-[18px] leading-none text-muted"
      >
        ‹
      </button>
      <span className="min-w-[7ch] text-center text-[14px] text-muted">{label(date)}</span>
      <button
        type="button"
        onClick={() => canGoNext && onChange(shiftDateISO(date, 1))}
        disabled={!canGoNext}
        aria-label="Следующий день"
        className="-my-2 py-2 text-[18px] leading-none text-muted disabled:opacity-30"
      >
        ›
      </button>
    </div>
  );
}
