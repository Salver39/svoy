'use client';

// Mood-таб (BACKLOG E6 AC #1,4,5): daily чек-ин + timeline истории + счётчик
// ведения дневника. Кнопка «тревожно» здесь НЕ дублируется — она глобальная и
// живёт на Today/Diary (см. AnxietyButton в (tabs)/layout).

import { useEffect, useState } from 'react';
import type { MoodCheckIn, Mood } from '@/db/schema';
import { getMoodHistory, getTodayMoodCheckIn, recordMood } from '@/lib/mood';
import { getJournalDayCount } from '@/lib/journal';
import { CheckInSheet, MoodFace, moodLabel, moodCurve } from './CheckInSheet';

/** Падежи слова «день» для счётчика. */
function pluralDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дня';
  return 'дней';
}

const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

function formatDay(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export default function MoodPage() {
  const [todayMood, setTodayMood] = useState<Mood | null>(null);
  const [history, setHistory] = useState<MoodCheckIn[]>([]);
  const [journalDays, setJournalDays] = useState(0);
  const [loaded, setLoaded] = useState(false);

  async function refresh() {
    const [today, hist, days] = await Promise.all([
      getTodayMoodCheckIn(),
      getMoodHistory(),
      getJournalDayCount(),
    ]);
    setTodayMood(today?.mood ?? null);
    setHistory(hist);
    setJournalDays(days);
    setLoaded(true);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handlePick(mood: Mood) {
    await recordMood(mood);
    await refresh();
  }

  if (!loaded) {
    return <div className="min-h-dvh bg-bg" aria-hidden="true" />;
  }

  return (
    <div className="mx-auto max-w-md px-6 pb-8 pt-8">
      <h1 className="text-[20px] font-semibold text-ink">Настроение</h1>

      {/* Счётчик ведения дневника — кумулятивный, не streak, без gamified-обвязки. */}
      {journalDays > 0 && (
        <p className="mt-4 text-[14px] text-muted">
          дневник ведётся{' '}
          <span className="text-ink">
            {journalDays} {pluralDays(journalDays)}
          </span>
        </p>
      )}

      <div className="mt-6">
        <CheckInSheet todayMood={todayMood} onPick={handlePick} />
      </div>

      {history.length > 0 && (
        <section className="mt-8" aria-label="История настроения">
          <p className="text-[13px] text-muted">история</p>
          <ul className="mt-3 flex flex-col">
            {history.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-3 border-b border-line py-3 last:border-b-0"
              >
                <span className="w-24 shrink-0 text-[13px] text-muted">
                  {formatDay(row.date)}
                </span>
                {row.mood ? (
                  <span className="flex items-center gap-2 text-ink">
                    <MoodFace curve={moodCurve(row.mood)} size={22} />
                    <span className="text-[14px]">{moodLabel(row.mood)}</span>
                  </span>
                ) : (
                  <span className="text-[14px] text-muted">—</span>
                )}
                {row.anxious && (
                  <span className="ml-auto rounded-full bg-raised px-2.5 py-1 text-[12px] text-muted">
                    тревожно
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
