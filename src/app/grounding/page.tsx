'use client';

// Экран заземления (BACKLOG E6 AC #2). Приходим сюда по кнопке «тревожно» с
// Today/Diary. Полноэкранный спокойный экран вне (tabs) — без нижнего бара,
// ничего не требует, выход в любой момент. Дыхание 4-7-8 + одна поддерживающая
// фраза. Все тексты — SAFETY-3 placeholder (см. content/supporting-texts.ts).

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BREATH_478,
  GROUNDING_INTRO,
  GROUNDING_OUTRO,
  SUPPORTING_PHRASES,
} from '@/content/supporting-texts';

type Phase = 'inhale' | 'hold' | 'exhale';

const PHASE_SEQUENCE: { phase: Phase; seconds: number; label: string }[] = [
  { phase: 'inhale', seconds: BREATH_478.inhale, label: BREATH_478.inhaleLabel },
  { phase: 'hold', seconds: BREATH_478.hold, label: BREATH_478.holdLabel },
  { phase: 'exhale', seconds: BREATH_478.exhale, label: BREATH_478.exhaleLabel },
];

export default function GroundingPage() {
  const router = useRouter();
  // Одна фраза на заход — ротация, чтобы не превращалась в заученный ритуал.
  // Рандом выбираем ТОЛЬКО после mount: иначе SSR и клиент берут разные фразы
  // → hydration mismatch. SSR и первый клиентский рендер детерминированно [0].
  const [phrase, setPhrase] = useState(SUPPORTING_PHRASES[0]);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setPhrase(
      SUPPORTING_PHRASES[Math.floor(Math.random() * SUPPORTING_PHRASES.length)]
    );
  }, []);

  // Метка фазы синхронизирована с CSS-анимацией круга (тот же 4-7-8 цикл).
  // Это текст, не движение — работает и при prefers-reduced-motion как подсказка.
  useEffect(() => {
    const current = PHASE_SEQUENCE[step % PHASE_SEQUENCE.length];
    const t = setTimeout(
      () => setStep((s) => s + 1),
      current.seconds * 1000
    );
    return () => clearTimeout(t);
  }, [step]);

  const label = PHASE_SEQUENCE[step % PHASE_SEQUENCE.length].label;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-10 pt-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="self-start text-[14px] text-muted underline decoration-line underline-offset-4"
      >
        назад
      </button>

      <p className="mt-8 max-w-[320px] text-[15px] leading-relaxed text-muted">
        {GROUNDING_INTRO}
      </p>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="relative flex h-60 w-60 items-center justify-center">
          <div
            className="nimb-breath h-60 w-60 rounded-full bg-surface"
            aria-hidden="true"
          />
          <span
            className="absolute text-[18px] text-ink"
            aria-live="polite"
          >
            {label}
          </span>
        </div>

        <p className="max-w-[300px] text-center font-display text-[22px] leading-snug text-ink">
          {phrase}
        </p>
      </div>

      <p className="mt-6 text-center text-[13px] text-muted">{GROUNDING_OUTRO}</p>
    </div>
  );
}
