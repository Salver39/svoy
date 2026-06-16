'use client';

// Daily mood-чекин (BACKLOG E6 AC #1). Один раз в день, опционально, 1 тап.
// НЕ привязан к приёму пищи (food×mood-развязка, см. lib/mood.ts).
//
// DESIGN.md: БЕЗ ЭМОДЗИ и без цветовой валентности (ноль красного/зелёного).
// Настроение — монохромные линейные лица одного цвета (--ink), различаются
// только кривизной рта. Это настроение (эмоция), а не оценка еды — валентная
// шкала здесь допустима, но кодируется формой, не цветом.

import type { Mood } from '@/db/schema';

interface MoodOption {
  value: Mood;
  label: string;
  /** Кривизна рта: + улыбка, 0 прямая, − грусть. Только форма, не цвет. */
  curve: number;
}

const MOODS: MoodOption[] = [
  { value: 'bad', label: 'плохо', curve: -4 },
  { value: 'low', label: 'не очень', curve: -2 },
  { value: 'neutral', label: 'нормально', curve: 0 },
  { value: 'good', label: 'неплохо', curve: 2 },
  { value: 'great', label: 'хорошо', curve: 4 },
];

/** Линейное лицо. Монохром (currentColor), различается кривой рта. */
export function MoodFace({ curve, size = 28 }: { curve: number; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="0.6" fill="currentColor" stroke="none" />
      <path d={`M8.5 ${15 - curve / 2} Q12 ${15 + curve} 15.5 ${15 - curve / 2}`} />
    </svg>
  );
}

export function moodLabel(value: Mood): string {
  return MOODS.find((m) => m.value === value)?.label ?? '';
}

export function moodCurve(value: Mood): number {
  return MOODS.find((m) => m.value === value)?.curve ?? 0;
}

interface Props {
  /** Настроение уже отмечено сегодня — показываем подтверждение, не спрашиваем повторно. */
  todayMood: Mood | null;
  onPick: (mood: Mood) => void;
}

export function CheckInSheet({ todayMood, onPick }: Props) {
  if (todayMood) {
    return (
      <section className="rounded-2xl bg-surface px-4 py-4" aria-label="Настроение сегодня">
        <p className="text-[13px] text-muted">настроение на сегодня отмечено</p>
        <div className="mt-2 flex items-center gap-2 text-ink">
          <MoodFace curve={moodCurve(todayMood)} />
          <span className="text-[15px]">{moodLabel(todayMood)}</span>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-surface px-4 py-4" aria-label="Чек-ин настроения">
      <p className="text-[13px] text-muted">как настроение сегодня?</p>
      <div className="mt-3 flex justify-between">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => onPick(m.value)}
            aria-label={m.label}
            className="flex flex-col items-center gap-1.5 rounded-xl px-1.5 py-1 text-muted
                       transition-colors hover:text-ink active:text-ink"
          >
            <MoodFace curve={m.curve} />
            <span className="text-[11px]">{m.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
