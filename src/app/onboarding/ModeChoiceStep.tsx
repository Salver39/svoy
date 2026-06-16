'use client';

// Шаг 2: выбор режима. Численный — дефолт (SPEC принцип 8). При срабатывании
// скрининга мягкий режим РЕКОМЕНДУЕТСЯ, но НЕ навязывается — пользователь
// решает сам (BACKLOG E2 AC #4, никакого принудительного редиректа).

import type { AppMode } from '@/db/schema';
import { ResourcesCard } from '@/components/ResourcesCard';

const OPTIONS: { mode: AppMode; title: string; desc: string }[] = [
  {
    mode: 'numeric',
    title: 'С числами',
    desc: 'Зона калорий как спокойный диапазон. Без обратного отсчёта и без «превысил».',
  },
  {
    mode: 'soft',
    title: 'Без чисел',
    desc: 'Никаких калорий на экране. Только мягкие отметки о состоянии. Часто спокойнее.',
  },
];

export function ModeChoiceStep({
  triggered,
  value,
  onChange,
  onNext,
  onBack,
}: {
  triggered: boolean;
  value: AppMode;
  onChange: (m: AppMode) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h1 className="text-[22px] font-semibold text-ink">Как тебе удобнее?</h1>
      {triggered && (
        <p className="mt-2 text-[14px] text-muted">
          По ответам кажется, что режим без чисел может быть спокойнее. Но выбор
          за тобой — можно поменять в любой момент.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {OPTIONS.map((opt) => {
          const selected = value === opt.mode;
          const recommended = triggered && opt.mode === 'soft';
          return (
            <button
              key={opt.mode}
              type="button"
              onClick={() => onChange(opt.mode)}
              aria-pressed={selected}
              className={`rounded-2xl border p-4 text-left transition-colors
                ${
                  selected
                    ? 'border-accent bg-raised'
                    : 'border-line bg-surface hover:border-muted'
                }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink">{opt.title}</span>
                {recommended && (
                  <span className="rounded-full border border-line bg-raised px-2 py-0.5 text-[12px] text-muted">
                    рекомендуем
                  </span>
                )}
              </div>
              <p className="mt-1 text-[14px] text-muted">{opt.desc}</p>
            </button>
          );
        })}
      </div>

      {triggered && (
        <div className="mt-6">
          <ResourcesCard />
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-line px-5 py-3 text-muted"
        >
          Назад
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded-xl bg-ink py-3 text-bg"
        >
          Дальше
        </button>
      </div>
    </div>
  );
}
