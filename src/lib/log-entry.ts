// Data-layer для записей дневника (BACKLOG E3 AC #4-6).
// Главное: блок логирования в будущие даты — на уровне data layer, не только
// UI (SPEC AC #3, Eikey 2021 pre-logging tomorrow). Защита здесь, потому что
// бэкенда нет — это последний рубеж перед IndexedDB.

import { getDB } from '@/db/client';
import type { LogEntry, Meal } from '@/db/schema';

/** Локальная сегодняшняя дата в формате 'YYYY-MM-DD' (без UTC-сдвига). */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Дата строкой 'YYYY-MM-DD' указывает на будущее относительно сегодня? */
export function isFutureDate(dateISO: string): boolean {
  return dateISO > todayISO();
}

/** Сдвигает дату 'YYYY-MM-DD' на delta дней (локально, без UTC-сдвига). */
export function shiftDateISO(dateISO: string, delta: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export class FutureDateError extends Error {
  constructor() {
    super('Логирование в будущие даты запрещено.');
    this.name = 'FutureDateError';
  }
}

/**
 * Добавляет запись в дневник. Отклоняет будущие даты (бросает FutureDateError).
 * Возвращает id созданной записи.
 */
export async function addLogEntry(entry: Omit<LogEntry, 'id'>): Promise<number> {
  if (isFutureDate(entry.date)) {
    throw new FutureDateError();
  }
  return getDB().logEntries.add(entry as LogEntry);
}

/** Все записи за конкретный день. */
export async function getEntriesForDate(dateISO: string): Promise<LogEntry[]> {
  return getDB().logEntries.where('date').equals(dateISO).toArray();
}

/** Удаляет запись дневника по id. */
export async function deleteLogEntry(id: number): Promise<void> {
  return getDB().logEntries.delete(id);
}

/** Меняет количество грамм у записи. */
export async function updateLogEntryGrams(id: number, grams: number): Promise<number> {
  return getDB().logEntries.update(id, { grams });
}

/** Группирует записи по приёму пищи. */
export function groupByMeal(entries: LogEntry[]): Record<Meal, LogEntry[]> {
  const groups: Record<Meal, LogEntry[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };
  for (const e of entries) groups[e.meal].push(e);
  return groups;
}
