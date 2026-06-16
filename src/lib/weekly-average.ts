// Скользящее 7-дневное среднее (BACKLOG E4 AC #1, SPEC принцип 4).
// Неделя важнее дня: считаем среднесуточную энергию за последние 7 дней,
// чтобы убрать дневной счётчик-мишень (Hahn 2021b compensatory restriction).
//
// Среднее берётся по дням С ДАННЫМИ, не по 7 календарным: пропущенный день не
// должен «занижать» среднее и читаться как провал (SPEC принцип 16 — мы не
// патологизируем недо-логирование; caveat «не обязательно вся еда»).

import { getDB } from '@/db/client';
import { todayISO } from './log-entry';
import type { Zone } from '@/db/schema';

const WINDOW_DAYS = 7;

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface WeeklySummary {
  /** Среднесуточная энергия по дням с данными; null — данных за окно нет. */
  average: number | null;
  /** Сколько из последних 7 дней содержат хотя бы одну запись. */
  daysWithData: number;
}

export async function getWeeklySummary(): Promise<WeeklySummary> {
  const db = getDB();
  const start = isoDaysAgo(WINDOW_DAYS - 1); // включая сегодня = 7 дней
  const end = todayISO();

  const entries = await db.logEntries
    .where('date')
    .between(start, end, true, true)
    .toArray();

  if (entries.length === 0) return { average: null, daysWithData: 0 };

  const ids = [...new Set(entries.map((e) => e.foodItemId))];
  const foods = await db.foodItems.bulkGet(ids);
  const per100 = new Map<number, number>();
  foods.forEach((f) => {
    if (f?.id != null) per100.set(f.id, f.caloriesPer100g);
  });

  const perDay = new Map<string, number>();
  for (const e of entries) {
    const c = per100.get(e.foodItemId) ?? 0;
    // Записи «без числа» (caloriesPer100g 0 — залогированы в мягком режиме)
    // не участвуют в численном среднем: иначе тянут его вниз и читаются как
    // недоедание. Это согласуется с принципом «не патологизируем недо-лог».
    if (c <= 0) continue;
    perDay.set(e.date, (perDay.get(e.date) ?? 0) + (c * e.grams) / 100);
  }

  const totals = [...perDay.values()];
  if (totals.length === 0) return { average: null, daysWithData: 0 };
  const average = totals.reduce((a, b) => a + b, 0) / totals.length;
  return { average, daysWithData: totals.length };
}

/**
 * Позиция среднего внутри зоны, 0..1 (clamp). Для нейтрального маркера на полосе.
 * Вне зоны — прижимается к краю, но БЕЗ цветовой реакции (SPEC принцип 3/5).
 */
export function zonePosition(average: number, zone: Zone): number {
  if (zone.max <= zone.min) return 0.5;
  const t = (average - zone.min) / (zone.max - zone.min);
  return Math.max(0, Math.min(1, t));
}
