'use client';

// Шаг 3: профиль. Рост / возраст / пол / активность — всегда. Вес — опционален
// при срабатывании слоя 1 (SPEC «Безопасность»: вопрос о весе сам триггерный).
// Если вес пропущен, формула берёт proxy по серединке нормального BMI.

import type { Sex, ActivitySignal, AppMode } from '@/db/schema';
import type { ProfileDraft } from './types';

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'female', label: 'Женский' },
  { value: 'male', label: 'Мужской' },
];

// Образ жизни — СИГНАЛ о человеке, НЕ влияет на расчёт зоны (R1). Сами тренировки
// учитываются per-day на Today (F8), поэтому здесь — только частота активности.
const ACTIVITY_OPTIONS: { value: ActivitySignal; label: string }[] = [
  { value: 'none', label: 'Почти нет' },
  { value: 'sometimes', label: 'Иногда' },
  { value: 'regular', label: 'Регулярно' },
];

function NumberField({
  label,
  value,
  onChange,
  optional,
  suffix,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  optional?: boolean;
  suffix?: string;
}) {
  return (
    <label className="mt-4 block">
      <span className="text-[14px] text-muted">
        {label}
        {optional && <span className="text-muted/70"> — можно пропустить</span>}
      </span>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          value={value ?? ''}
          onChange={(e) =>
            onChange(e.target.value === '' ? null : Number(e.target.value))
          }
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink
                     focus:border-accent focus:outline-none"
        />
        {suffix && <span className="text-[14px] text-muted">{suffix}</span>}
      </div>
    </label>
  );
}

export function ProfileStep({
  draft,
  mode,
  triggered,
  onChange,
  onNext,
  onBack,
}: {
  draft: ProfileDraft;
  mode: AppMode;
  triggered: boolean;
  onChange: (p: ProfileDraft) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  // Вес обязателен только для численного режима без срабатывания скрининга.
  const weightRequired = mode === 'numeric' && !triggered;
  const weightOptional = !weightRequired;

  const complete =
    draft.height !== null &&
    draft.age !== null &&
    draft.sex !== null &&
    (weightOptional || draft.weight !== null);

  const set = (patch: Partial<ProfileDraft>) => onChange({ ...draft, ...patch });

  return (
    <div>
      <h1 className="text-[22px] font-semibold text-ink">Немного о тебе</h1>
      <p className="mt-2 text-[14px] text-muted">
        Это нужно, чтобы подобрать спокойный диапазон. Данные остаются на твоём
        устройстве.
      </p>

      <NumberField
        label="Рост"
        value={draft.height}
        onChange={(v) => set({ height: v })}
        suffix="см"
      />
      <NumberField
        label="Возраст"
        value={draft.age}
        onChange={(v) => set({ age: v })}
        suffix="лет"
      />
      <NumberField
        label="Вес"
        value={draft.weight}
        onChange={(v) => set({ weight: v })}
        optional={weightOptional}
        suffix="кг"
      />

      <fieldset className="mt-6">
        <legend className="text-[14px] text-muted">Пол</legend>
        <div className="mt-2 flex gap-2">
          {SEX_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set({ sex: opt.value })}
              aria-pressed={draft.sex === opt.value}
              className={`flex-1 rounded-xl border px-4 py-3 text-[14px] transition-colors
                ${
                  draft.sex === opt.value
                    ? 'border-accent bg-raised text-ink'
                    : 'border-line bg-surface text-muted'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-6 block">
        <span className="text-[14px] text-muted">Физическая активность</span>
        <select
          value={draft.activity}
          onChange={(e) => set({ activity: e.target.value as ActivitySignal })}
          className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink
                     focus:border-accent focus:outline-none"
        >
          {ACTIVITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

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
          disabled={!complete}
          onClick={() => complete && onNext()}
          className="flex-1 rounded-xl bg-ink py-3 text-bg
                     transition-opacity disabled:opacity-40"
        >
          Дальше
        </button>
      </div>
    </div>
  );
}
