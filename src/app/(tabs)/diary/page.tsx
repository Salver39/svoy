'use client';

// Дневник дня (BACKLOG E3). 4 приёма, записи за сегодня, добавление через поиск
// или вручную. Намеренно НЕТ суммарного числа за день и за приём (SPEC принцип
// 2: дневной счётчик-число не показываем — это поверхность compensatory
// restriction). Каждая запись показывает только свои калории.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FoodItem, LogEntry, Meal } from '@/db/schema';
import { getDB } from '@/db/client';
import { cacheFoodItem } from '@/lib/off-api';
import {
  addLogEntry,
  deleteLogEntry,
  getEntriesForDate,
  groupByMeal,
  todayISO,
  updateLogEntryGrams,
} from '@/lib/log-entry';
import { MEALS, MEAL_LABEL } from '@/lib/meals';
import { useAppMode } from '@/lib/soft-mode';
import { LogEntryRow } from './LogEntryRow';
import { SearchView } from './SearchView';
import { ManualEntryForm } from './ManualEntryForm';
import { PortionStep } from './PortionStep';
import { UndoSnackbar } from './UndoSnackbar';

const UNDO_TIMEOUT_MS = 6000;

export default function DiaryPage() {
  const date = todayISO();
  const { mode } = useAppMode(); // soft → числа калорий скрыты на всех экранах
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [foods, setFoods] = useState<Map<number, FoodItem>>(new Map());
  const [addingMeal, setAddingMeal] = useState<Meal | null>(null);
  const [manualMode, setManualMode] = useState(false);
  // Выбранный продукт, ждущий ввода порции (F3): грамм задаём при выборе.
  const [pendingFood, setPendingFood] = useState<FoodItem | null>(null);
  // Снимок последней удалённой записи для undo (F3).
  const [undoEntry, setUndoEntry] = useState<Omit<LogEntry, 'id'> | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(async () => {
    const list = await getEntriesForDate(date);
    const ids = [...new Set(list.map((e) => e.foodItemId))];
    const items = await getDB().foodItems.bulkGet(ids);
    const map = new Map<number, FoodItem>();
    items.forEach((it) => {
      if (it?.id) map.set(it.id, it);
    });
    setEntries(list);
    setFoods(map);
  }, [date]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Чистим таймер undo при размонтировании.
  useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

  async function addFood(food: FoodItem, meal: Meal, grams: number) {
    const foodItemId = await cacheFoodItem(food);
    await addLogEntry({ date, meal, foodItemId, grams });
    setAddingMeal(null);
    setManualMode(false);
    setPendingFood(null);
    await reload();
  }

  function armUndo(snapshot: Omit<LogEntry, 'id'>) {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoEntry(snapshot);
    undoTimer.current = setTimeout(() => setUndoEntry(null), UNDO_TIMEOUT_MS);
  }

  async function handleUndo() {
    if (!undoEntry) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    await addLogEntry(undoEntry);
    setUndoEntry(null);
    await reload();
  }

  const grouped = groupByMeal(entries);

  return (
    <div className="mx-auto max-w-md px-6 pb-8 pt-8">
      <h1 className="text-[22px] font-semibold text-ink">Дневник</h1>
      <p className="mt-1 text-[14px] text-muted">сегодня</p>

      <div className="mt-6 flex flex-col gap-6">
        {MEALS.map((meal) => (
          <section key={meal}>
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-medium text-ink">
                {MEAL_LABEL[meal]}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setAddingMeal(meal);
                  setManualMode(false);
                  setPendingFood(null);
                }}
                className="py-3 -my-2 text-[14px] text-muted"
              >
                + добавить
              </button>
            </div>

            {grouped[meal].length > 0 && (
              <ul className="mt-3 flex flex-col gap-2">
                {grouped[meal].map((entry) => {
                  const food = entry.id != null ? foods.get(entry.foodItemId) : undefined;
                  if (!food) return null;
                  return (
                    <LogEntryRow
                      key={entry.id}
                      entry={entry}
                      food={food}
                      mode={mode}
                      onDelete={async () => {
                        if (entry.id != null) {
                          // Снимок до удаления — для undo (F3).
                          armUndo({
                            date: entry.date,
                            meal: entry.meal,
                            foodItemId: entry.foodItemId,
                            grams: entry.grams,
                          });
                          await deleteLogEntry(entry.id);
                          await reload();
                        }
                      }}
                      onUpdateGrams={async (grams) => {
                        if (entry.id != null) {
                          await updateLogEntryGrams(entry.id, grams);
                          await reload();
                        }
                      }}
                    />
                  );
                })}
              </ul>
            )}

            {addingMeal === meal && (
              <div className="mt-3 rounded-2xl border border-line p-4">
                {pendingFood ? (
                  // Шаг порции: грамм при выборе, явный «Добавить» (F3).
                  <PortionStep
                    food={pendingFood}
                    mode={mode}
                    onConfirm={(grams) => addFood(pendingFood, meal, grams)}
                    onBack={() => setPendingFood(null)}
                  />
                ) : manualMode ? (
                  <ManualEntryForm
                    onSubmit={(food) => setPendingFood(food)}
                    onCancel={() => setManualMode(false)}
                  />
                ) : (
                  <SearchView
                    onPick={(food) => setPendingFood(food)}
                    onManualAdd={() => setManualMode(true)}
                  />
                )}
                {/* В шаге порции выход — через «Назад»; «Закрыть» не дублируем. */}
                {!pendingFood && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingMeal(null);
                      setManualMode(false);
                    }}
                    className="mt-3 text-[14px] text-muted"
                  >
                    Закрыть
                  </button>
                )}
              </div>
            )}
          </section>
        ))}
      </div>

      {undoEntry && <UndoSnackbar onUndo={handleUndo} />}
    </div>
  );
}
