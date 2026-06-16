// Dexie-клиент. Инстанцируется лениво и только в браузере —
// IndexedDB не существует на сервере (SSR), импорт типов остаётся безопасным.

import Dexie, { type Table } from 'dexie';
import type {
  UserProfile,
  FoodItem,
  LogEntry,
  MoodCheckIn,
  SoftStateCheckIn,
  NudgeState,
  AppOpenEvent,
  ModeSwitch,
  FollowupResponse,
} from './schema';

export class NimbDB extends Dexie {
  userProfile!: Table<UserProfile, number>;
  foodItems!: Table<FoodItem, number>;
  logEntries!: Table<LogEntry, number>;
  moodCheckIns!: Table<MoodCheckIn, number>;
  softStateCheckIns!: Table<SoftStateCheckIn, number>;
  nudgeState!: Table<NudgeState, number>;
  appOpenEvents!: Table<AppOpenEvent, number>;
  modeSwitches!: Table<ModeSwitch, number>;
  followupResponses!: Table<FollowupResponse, number>;

  constructor() {
    super('nimb-db');

    // Версия 1 — каркас E1. Сохранена для апгрейд-пути пользователей,
    // открывавших ранний build (в т.ч. разработчиков с локальной IndexedDB).
    this.version(1).stores({
      userProfile: '++id',
      foodItems: '++id, name, barcode, offId',
      logEntries: '++id, date, meal, foodItemId, [date+meal]',
      moodCheckIns: '++id, date, logEntryId',
    });

    // Версия 2 — единый bump на все MVP-эпики (E2-E9), чтобы не плодить v3/v4.
    // Изменения:
    //  - moodCheckIns: убран индекс logEntryId (поле удалено из MoodCheckIn).
    //  - добавлены таблицы nudgeState (E8), appOpenEvents/modeSwitches (E9),
    //    followupResponses (E8).
    //  - новое поле UserProfile.webPushFollowupConsent индекса не требует —
    //    Dexie хранит его без объявления в stores().
    this.version(2)
      .stores({
        userProfile: '++id',
        foodItems: '++id, name, barcode, offId',
        logEntries: '++id, date, meal, foodItemId, [date+meal]',
        moodCheckIns: '++id, date',
        nudgeState: '++id',
        appOpenEvents: '++id, date',
        modeSwitches: '++id, date',
        followupResponses: '++id, date',
      })
      .upgrade(async (tx) => {
        // Чистим мёртвое поле logEntryId в существующих mood-записях.
        // На пустой БД (пилот / новый пользователь) тело не выполняется.
        await tx
          .table('moodCheckIns')
          .toCollection()
          .modify((m: Record<string, unknown>) => {
            delete m.logEntryId;
          });
      });

    // Версия 3 — мягкий режим (E5). Чек-ин состояния развязан от приёмов пищи
    // (см. SoftStateCheckIn в schema.ts), поэтому это отдельная таблица, а не
    // поле LogEntry. Прежнее поле LogEntry.pollState удалено как мёртвое —
    // оно не индексировалось, апгрейд существующих записей не требуется.
    this.version(3).stores({
      userProfile: '++id',
      foodItems: '++id, name, barcode, offId',
      logEntries: '++id, date, meal, foodItemId, [date+meal]',
      moodCheckIns: '++id, date',
      softStateCheckIns: '++id, date',
      nudgeState: '++id',
      appOpenEvents: '++id, date',
      modeSwitches: '++id, date',
      followupResponses: '++id, date',
    });
  }
}

let _db: NimbDB | null = null;

export function getDB(): NimbDB {
  if (typeof window === 'undefined') {
    throw new Error(
      'getDB() вызван на сервере. БД доступна только в client-компонентах.'
    );
  }
  if (!_db) {
    _db = new NimbDB();
  }
  return _db;
}
