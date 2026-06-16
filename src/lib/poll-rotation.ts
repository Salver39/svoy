// Выбор и порядок опций опроса состояния (BACKLOG E5 AC #3).
// Рандомизация порядка середины — против ритуализации (один и тот же порядок
// превращается в автоматический тап). «не знаю» закреплена первой, «другое» —
// последней. MVP-cut: ротация наборов формулировок выключена (один набор) до
// SAFETY-3; рандомизация порядка активна.

import { POLL_SETS, type PollOptionSet } from '@/content/poll-options';

export interface PollOption {
  value: string;
  /** true → опция «другое» с открытым полем. */
  isOther: boolean;
}

/** Активный набор формулировок. MVP: всегда первый (ротация отключена). */
export function activePollSet(): PollOptionSet {
  return POLL_SETS[0];
}

/** Fisher–Yates: новый перемешанный массив, исходный не мутируется. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Опции в порядке показа: «не знаю» первой, середина рандомизирована,
 * «другое» последней.
 */
export function pollOptionsInOrder(set: PollOptionSet = activePollSet()): PollOption[] {
  return [
    { value: set.dontKnow, isOther: false },
    ...shuffle(set.middle).map((value) => ({ value, isOther: false })),
    { value: set.other, isOther: true },
  ];
}
