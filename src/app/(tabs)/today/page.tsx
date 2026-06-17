'use client';

// Today — главный экран (BACKLOG E4). Закон продукта: неделя важнее дня,
// ноль красного/зелёного, нет дневного числа-итога, переключатель режима в шапке.
// Возврат после паузы — обычный экран без guilt-копи (AC #9): мы просто не
// добавляем никаких «давно не виделись» / «продолжишь?».

import { useEffect, useState } from 'react';
import type { AppMode, FoodItem, UserProfile, WorkoutIntensity } from '@/db/schema';
import { getDB } from '@/db/client';
import { getUserProfile } from '@/lib/profile';
import { getEntriesForDate, todayISO } from '@/lib/log-entry';
import { getWeeklySummary, type WeeklySummary } from '@/lib/weekly-average';
import { summarizeDay, type MealSummary } from '@/lib/day-meals';
import { raiseZoneForWorkout } from '@/lib/zone';
import { getWorkoutForDate, setWorkoutForDate } from '@/lib/workout';
import { cycleNoteForWeek } from '@/content/cycle-note';
import { isSoftCheckInDue, recordSoftCheckIn } from '@/lib/soft-checkin';
import { WeeklyAverage } from './WeeklyAverage';
import { DayMealsList } from './DayMealsList';
import { ModeSwitcher } from './ModeSwitcher';
import { WorkoutMark } from './WorkoutMark';
import { CycleNote } from './CycleNote';
import { SoftCheckInCard } from './SoftCheckInCard';
import { NudgeBanner } from './NudgeBanner';

export default function TodayPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<AppMode>('numeric');
  const [weekly, setWeekly] = useState<WeeklySummary>({ average: null, daysWithData: 0 });
  const [meals, setMeals] = useState<MealSummary[]>([]);
  const [checkInDue, setCheckInDue] = useState(false);
  // F8: интенсивность тренировки на сегодня (или null). Поднимает дневную зону.
  const [workout, setWorkout] = useState<WorkoutIntensity | null>(null);

  useEffect(() => {
    (async () => {
      const p = await getUserProfile();
      if (p) {
        setProfile(p);
        setMode(p.mode);
        // Чек-ин состояния — только в мягком режиме и не чаще раза в 7 дней.
        if (p.mode === 'soft') setCheckInDue(await isSoftCheckInDue());
      }
      const w = await getWorkoutForDate(todayISO());
      if (w) setWorkout(w.intensity);
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
      {/* F7: убрали отдельное «Сегодня» из шапки — оно стояло над НЕДЕЛЬНЫМ
          виджетом и читалось как его подпись. Шапка несёт только переключатель
          режима; недельный и дневной блоки ниже подписаны явно. */}
      <header className="mb-8 flex items-center justify-end">
        {profile.id != null && (
          <ModeSwitcher
            profile={profile}
            mode={mode}
            onChange={(next, zone) => {
              setMode(next);
              // F6: если переключение посчитало зону — прокинуть её в стейт,
              // чтобы WeeklyAverage перерисовался с диапазоном сразу.
              if (zone) setProfile((prev) => (prev ? { ...prev, zone } : prev));
            }}
          />
        )}
      </header>

      {/* Недельный блок: зона + среднее за 7 дней (свои подписи внутри виджета).
          F8: в тренировочный день показываем ПОДНЯТУЮ зону (numeric) / строку (soft). */}
      <WeeklyAverage
        zone={
          profile.zone && workout
            ? raiseZoneForWorkout(profile.zone, workout)
            : profile.zone
        }
        average={weekly.average}
        daysWithData={weekly.daysWithData}
        mode={mode}
        workoutActive={workout != null}
      />

      {/* F8: отметка активности на день — поднимает зону выше. Разовое действие:
          после выбора блок блокируется до завтра (без отмены). */}
      <WorkoutMark
        intensity={workout}
        onChange={async (next) => {
          await setWorkoutForDate(todayISO(), next);
          setWorkout(next);
        }}
      />

      <div className="my-8 h-px bg-line" />

      {/* Дневной блок: приёмы за сегодня — явный заголовок отделяет от недельного. */}
      <h2 className="mb-3 text-[15px] text-muted">Сегодня</h2>
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
