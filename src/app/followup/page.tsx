'use client';

// 30-day delayed-effect follow-up (BACKLOG E8 AC #5). Вне (tabs): полноэкранный
// одноразовый экран самопроверки — 1-2 пункта GAD-2 + self-rated app influence.
// Ловит отложенный рост тревоги после периода трекинга (Aslanova 2024).
//
// MVP: FOLLOWUP_30DAY_ENABLED=false → экран не показывается, редирект на /today.
// Сюда же ведёт notificationclick из sw.js (delayed-silence push) — на v1.1.
// Тексты — SAFETY-3 placeholder (content/nudge-copy.ts).

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FOLLOWUP_30DAY_ENABLED } from '@/config/nudge';
import { recordFollowupResponse } from '@/lib/followup-30day';
import {
  FOLLOWUP_INTRO,
  FOLLOWUP_GAD2_ITEMS,
  FOLLOWUP_GAD2_OPTIONS,
  FOLLOWUP_INFLUENCE_QUESTION,
  FOLLOWUP_INFLUENCE_OPTIONS,
  FOLLOWUP_OUTRO,
} from '@/content/nudge-copy';

export default function FollowupPage() {
  const router = useRouter();
  const [gad2, setGad2] = useState<(number | null)[]>(() =>
    FOLLOWUP_GAD2_ITEMS.map(() => null)
  );
  const [influence, setInfluence] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  // MVP-гейт: выключенный фиче-флаг → экрана нет, тихо уводим на Today.
  useEffect(() => {
    if (!FOLLOWUP_30DAY_ENABLED) router.replace('/today');
  }, [router]);

  if (!FOLLOWUP_30DAY_ENABLED) {
    return <div className="min-h-dvh bg-bg" aria-hidden="true" />;
  }

  const complete = gad2.every((v) => v != null) && influence != null;

  async function submit() {
    if (!complete) return;
    const score = gad2.reduce<number>((sum, v) => sum + (v ?? 0), 0);
    await recordFollowupResponse(score, influence as number);
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6">
        <p className="text-center text-[15px] leading-relaxed text-ink">{FOLLOWUP_OUTRO}</p>
        <button
          type="button"
          onClick={() => router.replace('/today')}
          className="mt-6 rounded-full bg-surface px-5 py-2.5 text-[13px] text-ink"
        >
          Закрыть
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-10 pt-8">
      <p className="max-w-[330px] text-[15px] leading-relaxed text-muted">{FOLLOWUP_INTRO}</p>

      <div className="mt-8 flex flex-col gap-7">
        {FOLLOWUP_GAD2_ITEMS.map((item, i) => (
          <fieldset key={i}>
            <legend className="text-[14px] leading-snug text-ink">{item}</legend>
            <div className="mt-3 flex flex-col gap-1.5">
              {FOLLOWUP_GAD2_OPTIONS.map((opt) => {
                const active = gad2[i] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setGad2((prev) => prev.map((v, j) => (j === i ? opt.value : v)))
                    }
                    className={`rounded-xl px-4 py-2.5 text-left text-[13.5px] transition-colors ${
                      active ? 'bg-raised text-ink shadow-sm' : 'bg-surface text-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        <fieldset>
          <legend className="text-[14px] leading-snug text-ink">
            {FOLLOWUP_INFLUENCE_QUESTION}
          </legend>
          <div className="mt-3 flex flex-col gap-1.5">
            {FOLLOWUP_INFLUENCE_OPTIONS.map((opt) => {
              const active = influence === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setInfluence(opt.value)}
                  className={`rounded-xl px-4 py-2.5 text-left text-[13.5px] transition-colors ${
                    active ? 'bg-raised text-ink shadow-sm' : 'bg-surface text-muted'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!complete}
        className="mt-8 rounded-full bg-raised px-5 py-3 text-[14px] text-ink shadow-sm disabled:opacity-40"
      >
        Готово
      </button>
    </div>
  );
}
