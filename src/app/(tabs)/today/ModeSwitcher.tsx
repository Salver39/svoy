'use client';

// Переключатель режима в шапке Today (BACKLOG E4 AC #6, SPEC AC #6).
// «с числами / без чисел», один тап, не зарыт в Settings. Меняет UserProfile.mode
// в IndexedDB и не теряет историю LogEntry (E5 AC #1).
// Запись ModeSwitch для метрики частоты переключений — E9 (recordModeSwitch).

import type { AppMode, UserProfile, Zone } from '@/db/schema';
import { getDB } from '@/db/client';
import { recordModeSwitch } from '@/lib/events';
import { computeZone, proxyWeightFromHeight } from '@/lib/zone';

interface Props {
  profile: UserProfile;
  mode: AppMode;
  // zone передаётся, только когда переключение в numeric впервые посчитало её
  // (F6) — чтобы родитель обновил стейт и виджет перерисовался сразу.
  onChange: (mode: AppMode, zone?: Zone) => void;
}

const OPTIONS: { value: AppMode; label: string }[] = [
  { value: 'numeric', label: 'с числами' },
  { value: 'soft', label: 'без чисел' },
];

export function ModeSwitcher({ profile, mode, onChange }: Props) {
  async function select(next: AppMode) {
    if (next === mode) return;
    const update: Partial<Pick<UserProfile, 'mode' | 'zone'>> = { mode: next };

    // F6: при переходе в numeric гарантируем наличие зоны. Если онбординг был
    // пройден в soft до фикса (zone отсутствует в БД), считаем её здесь из полей
    // профиля — иначе виджет показал бы «зона ещё не рассчитана».
    if (next === 'numeric' && !profile.zone) {
      const weight = profile.weight ?? proxyWeightFromHeight(profile.height);
      update.zone = computeZone({
        height: profile.height,
        weight,
        age: profile.age,
        sex: profile.sex,
        activity: profile.activity,
      });
    }

    if (profile.id != null) {
      await getDB().userProfile.update(profile.id, update);
    }
    await recordModeSwitch(mode, next);
    onChange(next, update.zone);
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
