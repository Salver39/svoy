'use client';

// Today — главный экран (BACKLOG E4). Закон продукта: неделя важнее дня,
// ноль красного/зелёного, нет дневного числа-итога, переключатель режима в шапке.
// Возврат после паузы — обычный экран без guilt-копи (AC #9): мы просто не
// добавляем никаких «давно не виделись» / «продолжишь?».

import { useEffect, useState } from 'react';
import type { AppMode, FoodItem, UserProfile } from '@/db/schema';
import { getDB } from '@/db/client';
import { getUserProfile } from '@/lib/profile';
import { getEntriesForDate, todayISO } from '@/lib/log-entry';
import { getWeeklySummary, type WeeklySummary } from '@/lib/weekly-average';
import { summarizeDay, type MealSummary } from '@/lib/day-meals';
import { cycleNoteForWeek } from '@/content/cycle-note';
import { isSoftCheckInDue, recordSoftCheckIn } from '@/lib/soft-checkin';
import { WeeklyAverage } from './WeeklyAverage';
import { DayMealsList } from './DayMealsList';
import { ModeSwitcher } from './ModeSwitcher';
import { CycleNote } from './CycleNote';
import { SoftCheckInCard } from './SoftCheckInCard';
import { NudgeBanner } from './NudgeBanner';

export default function TodayPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<AppMode>('numeric');
  const [weekly, setWeekly] = useState<WeeklySummary>({ average: null, daysWithData: 0 });
  const [meals, setMeals] = useState<MealSummary[]>([]);
  const [checkInDue, setCheckInDue] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await getUserProfile();
      if (p) {
        setProfile(p);
        setMode(p.mode);
        // Чек-ин состояния — только в мягком режиме и не чаще раза в 7 дней.
        if (p.mode === 'soft') setCheckInDue(await isSoftCheckInDue());
      }
      setWeekly(await getWeeklySummary());

      const entries = await getEntriesForDate(todayISO());
      const ids = [...new Set(entries.map((e) => e.foodItemId))];
      const items = await getDB().foodItems.bulkGet(ids);
      const map = new Map<number, FoodItem>();
      items.forEach((it) => {
        if (it?.id != null) map.set(it.id, it);
      });
      setMeals(summarizeDay(entries, map));
    })();
  }, []);

  if (!profile) {
    return <div className="min-h-dvh bg-bg" aria-hidden="true" />;
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-6 pb-8 pt-8">
      <header className="mb-8 flex items-center justify-between">
        <span className="text-[15px] text-muted">Сегодня</span>
        {profile.id != null && (
          <ModeSwitcher profileId={profile.id} mode={mode} onChange={setMode} />
        )}
      </header>

      <WeeklyAverage
        zone={profile.zone}
        average={weekly.average}
        daysWithData={weekly.daysWithData}
        mode={mode}
      />

      <div className="my-8 h-px bg-line" />

      <DayMealsList meals={meals} mode={mode} />

      {/* Ambient: чек-ин состояния (soft, ≤1/нед) ИЛИ текст про цикличность —
          не оба сразу, чтобы низ экрана оставался спокойным. */}
      {mode === 'soft' && checkInDue ? (
        <SoftCheckInCard
          onResolved={async (state) => {
            await recordSoftCheckIn(state);
            setCheckInDue(false);
          }}
        />
      ) : (
        <CycleNote text={cycleNoteForWeek()} />
      )}

      {/* Adaptive nudge (E8). MVP: ничего не рендерит (фиче-флаг выключен) —
          проводка на месте для активации на v1.1. */}
      {profile.id != null && mode === 'numeric' && (
        <NudgeBanner profileId={profile.id} onSwitchToSoft={() => setMode('soft')} />
      )}
    </div>
  );
}
