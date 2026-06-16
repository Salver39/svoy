'use client';

// Переключатель режима в шапке Today (BACKLOG E4 AC #6, SPEC AC #6).
// «с числами / без чисел», один тап, не зарыт в Settings. Меняет UserProfile.mode
// в IndexedDB и не теряет историю LogEntry (E5 AC #1).
// Запись ModeSwitch для метрики частоты переключений — E9 (recordModeSwitch).

import type { AppMode } from '@/db/schema';
import { getDB } from '@/db/client';
import { recordModeSwitch } from '@/lib/events';

interface Props {
  profileId: number;
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}

const OPTIONS: { value: AppMode; label: string }[] = [
  { value: 'numeric', label: 'с числами' },
  { value: 'soft', label: 'без чисел' },
];

export function ModeSwitcher({ profileId, mode, onChange }: Props) {
  async function select(next: AppMode) {
    if (next === mode) return;
    await getDB().userProfile.update(profileId, { mode: next });
    await recordModeSwitch(mode, next);
    onChange(next);
  }

  return (
    <div className="flex rounded-full bg-surface p-[3px]" role="group" aria-label="Режим отображения">
      {OPTIONS.map((opt) => {
        const active = opt.value === mode;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => select(opt.value)}
            className={`rounded-full px-3.5 py-[9px] text-[12px] transition-colors ${
              active ? 'bg-raised text-ink shadow-sm' : 'text-muted'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
