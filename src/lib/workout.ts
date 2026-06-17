// Data-layer для отметки тренировки на день (F8, LOCKED-B). Одна запись на
// календарный день: setWorkoutForDate делает upsert (find → update | add), а не
// add, чтобы повторная отметка/смена интенсивности не плодила дубли. Подъём зоны
// считается в lib/zone.ts; здесь только хранение факта.

import { getDB } from '@/db/client';
import type { WorkoutDay, WorkoutIntensity } from '@/db/schema';

/** Отметка тренировки за конкретный день (или undefined, если её нет). */
export async function getWorkoutForDate(dateISO: string): Promise<WorkoutDay | undefined> {
  return getDB().workoutDays.where('date').equals(dateISO).first();
}

/** Ставит/меняет отметку тренировки на день (одна запись на день). */
export async function setWorkoutForDate(
  dateISO: string,
  intensity: WorkoutIntensity,
): Promise<void> {
  const existing = await getWorkoutForDate(dateISO);
  if (existing?.id != null) {
    await getDB().workoutDays.update(existing.id, { intensity });
  } else {
    await getDB().workoutDays.add({ date: dateISO, intensity });
  }
}

/** Снимает отметку тренировки с дня. */
export async function clearWorkoutForDate(dateISO: string): Promise<void> {
  const existing = await getWorkoutForDate(dateISO);
  if (existing?.id != null) {
    await getDB().workoutDays.delete(existing.id);
  }
}
