'use client';

// Ambient чек-ин состояния для мягкого режима (BACKLOG E5, mass-облегчённая
// версия). Спокойная карточка на Today, не чаще раза в 7 дней, не привязана к
// еде. «не знаю» первой, середина рандомизирована (poll-rotation), «другое» —
// открытое поле всегда видимо (не под троеточием). Можно пропустить («позже»).
//
// ⚠️ SAFETY-3: формулировки опций и интро — placeholder до ревью специалиста.

import { useEffect, useState } from 'react';
import { POLL_INTRO } from '@/content/poll-options';
import { pollOptionsInOrder } from '@/lib/poll-rotation';

const INTRO_SEEN_KEY = 'nimb.softCheckInIntroSeen';

interface Props {
  /** Ответ (строка) или пропуск (null). Родитель пишет запись и прячет карточку. */
  onResolved: (state: string | null) => void;
}

export function SoftCheckInCard({ onResolved }: Props) {
  // Порядок фиксируется один раз на показ (не дёргается при ререндере).
  const [ordered] = useState(() => pollOptionsInOrder());
  const [introSeen, setIntroSeen] = useState(true); // считаем виденным до чтения LS
  const [otherText, setOtherText] = useState('');

  useEffect(() => {
    setIntroSeen(localStorage.getItem(INTRO_SEEN_KEY) === '1');
  }, []);

  const pills = ordered.filter((o) => !o.isOther);
  const other = ordered.find((o) => o.isOther);

  function resolve(state: string | null) {
    localStorage.setItem(INTRO_SEEN_KEY, '1');
    onResolved(state);
  }

  return (
    <section className="mt-7 rounded-2xl bg-surface px-4 py-4" aria-label="Как ты сейчас">
      <p className="text-[13px] text-muted">как ты сейчас?</p>
      {!introSeen && (
        <p className="mt-1 max-w-[300px] text-[12.5px] leading-snug text-muted">
          {POLL_INTRO}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {pills.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => resolve(opt.value)}
            className="rounded-full border border-line bg-raised px-3.5 py-2 text-[13px] text-ink"
          >
            {opt.value}
          </button>
        ))}
      </div>

      {other && (
        <div className="mt-2.5 flex items-center gap-2">
          <input
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder={other.value}
            aria-label={other.value}
            className="w-full rounded-lg border border-line bg-raised px-3 py-2 text-[14px]
                       text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            disabled={otherText.trim() === ''}
            onClick={() => resolve(otherText.trim())}
            className="shrink-0 rounded-lg bg-ink px-3 py-2 text-[13px] text-bg disabled:opacity-40"
          >
            готово
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => resolve(null)}
        className="mt-3 text-[13px] text-muted underline decoration-line underline-offset-2"
      >
        позже
      </button>
    </section>
  );
}
