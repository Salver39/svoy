'use client';

// Today — главный экран (BACKLOG E4; расхламление R2). Закон продукта: неделя
// важнее дня, ноль красного/зелёного, нет дневного числа-итога, переключатель
// режима в шапке. Возврат после паузы — обычный экран без guilt-копи (AC #9).
//
// R2 (handoff TODAY-REDESIGN-R2.md): чище и легче БЕЗ удаления механик.
// Шапка: «итоги недели» (слева) + переключатель (справа). Недельное среднее —
// только позиция-точка на шкале; числа недели живут в шите «итоги недели». Б/Ж/У
// за день под шкалой (numeric — числами, soft — шкалой-пропорцией). Контрол
// активности уехал в Дневник; на Today активность отражают поднятая зона и
// инфо-иконка у подписи «зона на сегодня».

import { useEffect, useState } from 'react';
import type { AppMode, FoodItem, UserProfile, WorkoutIntensity } from '@/db/schema';
import { getDB } from '@/db/client';
import { getUserProfile } from '@/lib/profile';
import { getEntriesForDate, todayISO } from '@/lib/log-entry';
import { getWeeklySummary, type WeeklySummary } from '@/lib/weekly-average';
import { summarizeDay, type MealSummary } from '@/lib/day-meals';
import { summarizeDayMacros, type DayMacros } from '@/lib/day-macros';
import { raiseZoneForWorkout } from '@/lib/zone';
import { getWorkoutForDate } from '@/lib/workout';
import { cycleNoteForWeek } from '@/content/cycle-note';
import { isSoftCheckInDue, recordSoftCheckIn } from '@/lib/soft-checkin';
import { WeeklyAverage } from './WeeklyAverage';
import { DailyMacros } from './DailyMacros';
import { MacroScale } from './MacroScale';
import { DayMealsList } from './DayMealsList';
import { ModeSwitcher } from './ModeSwitcher';
import { WeeklyReportButton } from './WeeklyReportButton';
import { WeeklyReportSheet } from './WeeklyReportSheet';
import { CycleNote } from './CycleNote';
import { SoftCheckInCard } from './SoftCheckInCard';
import { NudgeBanner } from './NudgeBanner';

const EMPTY_MACROS: DayMacros = { protein: 0, fat: 0, carbs: 0 };

export default function TodayPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<AppMode>('numeric');
  const [weekly, setWeekly] = useState<WeeklySummary>({
    average: null,
    daysWithData: 0,
    macros: null,
  });
  const [meals, setMeals] = useState<MealSummary[]>([]);
  const [dayMacros, setDayMacros] = useState<DayMacros>(EMPTY_MACROS);
  const [checkInDue, setCheckInDue] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  // F8: интенсивность активности на сегодня (или null). Поднимает дневную зону.
  // Контрол отметки живёт в Дневнике; здесь только читаем факт.
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
      setDayMacros(summarizeDayMacros(entries, map));
    })();
  }, []);

  if (!profile) {
    return <div className="min-h-dvh bg-bg" aria-hidden="true" />;
  }

  const workoutActive = workout != null;

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-6 pb-8 pt-8">
      {/* Шапка: «итоги недели» (слева) балансирует переключатель режима (справа).
          F7: отдельного «Сегодня» в шапке нет — блоки ниже подписаны явно. */}
      <header className="mb-8 flex items-center justify-between">
        <WeeklyReportButton onOpen={() => setReportOpen(true)} />
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

      {/* Зона (дневной диапазон) + позиция недельного среднего. F8: в день с
          активностью показываем ПОДНЯТУЮ зону; пояснение — в инфо-иконке. */}
      <WeeklyAverage
        zone={
          profile.zone && workout
            ? raiseZoneForWorkout(profile.zone, workout)
            : profile.zone
        }
        average={weekly.average}
        daysWithData={weekly.daysWithData}
        mode={mode}
        workoutActive={workoutActive}
      />

      {/* Б/Ж/У за день под шкалой: numeric — числами, soft — шкалой-пропорцией.
          Оба скрываются сами, пока за день нет ни одного макроса. */}
      {mode === 'numeric' ? (
        <DailyMacros macros={dayMacros} />
      ) : (
        <MacroScale macros={dayMacros} />
      )}

      <div className="my-8 h-px bg-line" />

      {/* Дневной блок: приёмы за сегодня — мелкий uppercase-заголовок. */}
      <h2 className="mb-3 text-[12px] uppercase tracking-[0.07em] text-muted">сегодня</h2>
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

      {reportOpen && (
        <WeeklyReportSheet
          average={weekly.average}
          daysWithData={weekly.daysWithData}
          macros={weekly.macros}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}
