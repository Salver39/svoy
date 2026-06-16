// Универсальный текст про цикличность аппетита (BACKLOG E4 AC #8, SPEC принцип 10).
// Появляется периодически (ротация по неделе). Cycle-данные НЕ собираются —
// текст универсальный, не привязан к фазе (phase detection недостоверен).
//
// ✅ SAFETY-3: формулировки прошли ревью специалиста (психолог + UX writer)
// 2026-06-16. Описывают вариативность без оценки и без слов о теле.

export const CYCLE_NOTES: string[] = [
  'Аппетит меняется день ото дня.',
  'Сегодня может ощущаться не так, как вчера.',
  'Потребности не всегда одинаковы.',
];

/** Номер ISO-недели — для стабильной ротации в течение недели. */
function weekIndex(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return Math.floor(days / 7);
}

/** Текст недели (детерминированно ротируется раз в неделю). */
export function cycleNoteForWeek(date = new Date()): string {
  return CYCLE_NOTES[weekIndex(date) % CYCLE_NOTES.length];
}
