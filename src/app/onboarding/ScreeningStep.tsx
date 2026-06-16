'use client';

// Шаг 1: скрининг слоя 1 — GAD-2 (2 вопроса) + 1 вопрос об отношениях с едой.
// Тон «о самочувствии», не клинический gate. Сырые ответы дальше шага не
// сохраняются — наружу идёт только результат { triggered, layers } (E2.5).

import { useState } from 'react';
import {
  GAD2_QUESTIONS,
  GAD2_SCALE,
  FOOD_CONCERN_QUESTION,
  FOOD_CONCERN_SCALE,
  type Gad2Value,
  type ScreeningAnswers,
} from '@/lib/screening';
import { SCREENING_DISCLAIMER } from '@/config/safety';

function ScaleQuestion({
  text,
  scale,
  value,
  onChange,
}: {
  text: string;
  scale: { value: Gad2Value; label: string }[];
  value: Gad2Value | null;
  onChange: (v: Gad2Value) => void;
}) {
  return (
    <fieldset className="mt-6">
      <legend className="text-[16px] text-ink">{text}</legend>
      <div className="mt-3 flex flex-col gap-2">
        {scale.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={selected}
              className={`rounded-xl border px-4 py-3 text-left text-[14px] transition-colors
                ${
                  selected
                    ? 'border-accent bg-raised text-ink'
                    : 'border-line bg-surface text-muted hover:border-muted'
                }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ScreeningStep({
  onComplete,
}: {
  onComplete: (answers: ScreeningAnswers) => void;
}) {
  const [nervous, setNervous] = useState<Gad2Value | null>(null);
  const [worry, setWorry] = useState<Gad2Value | null>(null);
  const [food, setFood] = useState<Gad2Value | null>(null);

  const complete = nervous !== null && worry !== null && food !== null;

  return (
    <div>
      <h1 className="text-[22px] font-semibold text-ink">Как ты себя чувствуешь?</h1>
      <p className="mt-2 text-[14px] text-muted">{SCREENING_DISCLAIMER}</p>

      <ScaleQuestion
        text={GAD2_QUESTIONS[0].text}
        scale={GAD2_SCALE}
        value={nervous}
        onChange={setNervous}
      />
      <ScaleQuestion
        text={GAD2_QUESTIONS[1].text}
        scale={GAD2_SCALE}
        value={worry}
        onChange={setWorry}
      />
      <ScaleQuestion
        text={FOOD_CONCERN_QUESTION.text}
        scale={FOOD_CONCERN_SCALE}
        value={food}
        onChange={setFood}
      />

      <button
        type="button"
        disabled={!complete}
        onClick={() =>
          complete && onComplete({ nervous: nervous!, worry: worry!, food: food! })
        }
        className="mt-8 w-full rounded-xl bg-ink py-3 text-bg
                   transition-opacity disabled:opacity-40"
      >
        Дальше
      </button>
    </div>
  );
}
