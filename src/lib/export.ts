// JSON-экспорт локальных данных (BACKLOG E7 AC #3, SPEC принцип 7 / AC #11).
//
// Local-first: данные живут только на устройстве; экспорт — про приватность и
// переносимость, не про синк. Скачивается файлом через браузер (Blob + <a download>).
// FoodItem экспортируем только source==='custom' — off-записи это кэш справочника
// Open Food Facts, не данные пользователя. В E9 payload расширится агрегатами.

import { getDB } from '@/db/client';
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
} from '@/db/schema';
import { computeMetrics, type Level1Metrics } from './metrics';

export interface ExportPayload {
  app: 'svoy';
  schemaVersion: number;
  exportedAt: string;
  userProfile: UserProfile | null;
  foodItems: FoodItem[]; // только custom
  logEntries: LogEntry[];
  moodCheckIns: MoodCheckIn[];
  softStateCheckIns: SoftStateCheckIn[];
  nudgeState: NudgeState[];
  // E9: сырые операционные события + агрегаты. Метрики НЕ показываются юзеру в
  // приложении (нет дашборда) — только здесь, для анализа пилота.
  appOpenEvents: AppOpenEvent[];
  modeSwitches: ModeSwitch[];
  followupResponses: FollowupResponse[];
  metrics: Level1Metrics;
}

/** Собирает полный снимок пользовательских данных из IndexedDB. */
export async function buildExportPayload(): Promise<ExportPayload> {
  const db = getDB();
  const [
    userProfile,
    customFood,
    logEntries,
    moodCheckIns,
    softStateCheckIns,
    nudgeState,
    appOpenEvents,
    modeSwitches,
    followupResponses,
    metrics,
  ] = await Promise.all([
    db.userProfile.toCollection().first(),
    // source не индексируется → фильтруем в памяти, не через .where().
    db.foodItems.filter((f) => f.source === 'custom').toArray(),
    db.logEntries.toArray(),
    db.moodCheckIns.toArray(),
    db.softStateCheckIns.toArray(),
    db.nudgeState.toArray(),
    db.appOpenEvents.toArray(),
    db.modeSwitches.toArray(),
    db.followupResponses.toArray(),
    computeMetrics(), // агрегаты считаются on-demand здесь (E9 AC #4)
  ]);

  return {
    app: 'svoy',
    schemaVersion: 3, // соответствует Dexie this.version(3) в db/client.ts
    exportedAt: new Date().toISOString(),
    userProfile: userProfile ?? null,
    foodItems: customFood,
    logEntries,
    moodCheckIns,
    softStateCheckIns,
    nudgeState,
    appOpenEvents,
    modeSwitches,
    followupResponses,
    metrics,
  };
}

/** Собирает payload и инициирует скачивание JSON-файла в браузере. */
export async function exportDataToFile(): Promise<void> {
  const payload = await buildExportPayload();
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = `svoy-export-${payload.exportedAt.slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
