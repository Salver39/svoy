'use client';

// Инфо-иконка у подписи зоны (Today R2). Канал для пояснений вместо постоянной
// серой строки под героем (handoff §6). Сейчас единственный контент — нота
// активности (зона сегодня выше). Подсказка появляется СТРОГО НАД иконкой:
// по центру, хвостик вниз (owner 2026-06-17). Иконка — прямая «i» в круге.

import { useState } from 'react';

export function ZoneInfoIcon({ text, label = 'почему так' }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-expanded={open}
        className="inline-flex h-[18px] w-[18px] items-center justify-center text-accent"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[18px] w-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <circle cx="12" cy="7.7" r="0.7" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute bottom-[calc(100%+10px)] left-1/2 z-10 w-[236px] -translate-x-1/2
                     rounded-[10px] bg-ink px-3 py-2.5 text-left text-[12.5px] leading-snug text-bg"
        >
          {text}
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-transparent border-t-ink"
          />
        </span>
      )}
    </span>
  );
}
