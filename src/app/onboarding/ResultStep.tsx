'use client';

// Шаг 4: результат. Численный режим → зона как диапазон (без midpoint, без «±»).
// Мягкий режим → подтверждение без чисел. При срабатывании скрининга — карточка
// ресурсов (BACKLOG E2 AC #4). Кнопка завершает онбординг и сохраняет профиль.

import type { AppMode } from '@/db/schema';
import { ResourcesCard } from '@/components/ResourcesCard';

export function ResultStep({
  mode,
  triggered,
  zoneLabel,
  saving,
  onFinish,
  onBack,
}: {
  mode: AppMode;
  triggered: boolean;
  zoneLabel: string | null; // готовая строка «1700–2000» или null для soft
  saving: boolean;
  onFinish: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h1 className="text-[22px] font-semibold text-ink">Готово</h1>

      {mode === 'numeric' && zoneLabel ? (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <p className="text-[14px] text-muted">Твоя спокойная зона на день</p>
          <p className="mt-2 flex items-baseline gap-2 font-display text-[44px] font-medium leading-none text-ink">
            {zoneLabel}
            <span className="font-sans text-[16px] font-normal text-muted">ккал</span>
          </p>
          <p className="mt-3 text-[14px] text-muted">
            Это диапазон, а не потолок. Считаем вверх, без обратного отсчёта.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <p className="text-ink">Режим без чисел</p>
          <p className="mt-2 text-[14px] text-muted">
            Калории показывать не будем. Будем мягко отмечать состояние — сытость,
            энергию, вкус. Переключить режим можно в любой момент.
          </p>
        </div>
      )}

      {triggered && (
        <div className="mt-6">
          <ResourcesCard />
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="rounded-xl border border-line px-5 py-3 text-muted
                     disabled:opacity-40"
        >
          Назад
        </button>
        <button
          type="button"
          onClick={onFinish}
          disabled={saving}
          className="flex-1 rounded-xl bg-ink py-3 text-bg
                     transition-opacity disabled:opacity-40"
        >
          {saving ? 'Сохраняем…' : 'Начать'}
        </button>
      </div>
    </div>
  );
}
