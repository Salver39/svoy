// Логика двухслойного скрининга (BACKLOG E2 AC #1-2, #9).
//
// Слой 1 (явный): GAD-2 (2 вопроса о самочувствии) + 1 вопрос об отношениях
// с едой. Тон консьюмерский, не клинический.
// Слой 2 (скрытый): поведенческие триггеры в обычных шагах онбординга. В MVP
// сигналы НЕ выносят решений — пороги не откалиброваны (TODO SAFETY-2).
//
// ВАЖНО: сырые ответы НЕ сохраняются в UserProfile — только результат
// { triggered, layers } (slim, см. SPEC «Модель данных»).
//
// SAFETY-2 РЕШЕНО (специалист, 2026-06-16): формулировки ниже — финальные.
//  - GAD-2: смягчённые под консьюмер, но близкие к валидированной версии. Даны
//    в «ты»/безличном настоящем — единый голос приложения + gender-neutral
//    (прошедшее «ты» потребовало бы рода «чувствовал/а»; см. правило gender-neutral).
//  - Вопрос о еде: оставлено упоминание «вес» по решению специалиста (озабоченность
//    весом — валидированный ранний сигнал РПП). Это осознанное исключение из
//    принципа 11 «никогда о теле» ТОЛЬКО для одноразового скрининг-вопроса.
//  - Пороги: GAD-2 сумма ≥3, вопрос о еде ≥2 (Часто/Почти постоянно) — подтверждены.

import { GAD2_CUTOFF, LAYER2_PLACEHOLDER } from '@/config/safety';
import type { ScreeningResult, ScreeningLayer } from '@/db/schema';

// Шкала GAD-2: стандартные 4 градации, баллы 0-3.
export type Gad2Value = 0 | 1 | 2 | 3;

export const GAD2_SCALE: { value: Gad2Value; label: string }[] = [
  { value: 0, label: 'Никогда' },
  { value: 1, label: 'Несколько дней' },
  { value: 2, label: 'Больше половины дней' },
  { value: 3, label: 'Почти каждый день' },
];

// Два вопроса GAD-2 (SAFETY-2 финал, 2026-06-16). «ты»/безличное настоящее —
// gender-neutral и в голосе приложения; смысл валидированного GAD-2 сохранён.
export const GAD2_QUESTIONS: { id: 'nervous' | 'worry'; text: string }[] = [
  {
    id: 'nervous',
    text: 'За последние 2 недели — как часто ты чувствуешь тревогу, напряжение или что трудно расслабиться?',
  },
  {
    id: 'worry',
    text: 'За последние 2 недели — как часто не получается остановить беспокойство или отпустить тревожные мысли?',
  },
];

// Вопрос об отношениях с едой (часть слоя 1). SAFETY-2 финал: своя шкала
// (Никогда/Иногда/Часто/Почти постоянно), порог срабатывания ≥2. Упоминание
// «вес» оставлено по решению специалиста (осознанное исключение из принципа 11
// для одноразового скрининга — см. шапку файла).
export const FOOD_CONCERN_SCALE: { value: Gad2Value; label: string }[] = [
  { value: 0, label: 'Никогда' },
  { value: 1, label: 'Иногда' },
  { value: 2, label: 'Часто' },
  { value: 3, label: 'Почти постоянно' },
];

export const FOOD_CONCERN_QUESTION = {
  id: 'food' as const,
  text: 'Как часто мысли о еде, весе или калориях занимают слишком много места в голове и мешают спокойно заниматься другими делами?',
};

export interface ScreeningAnswers {
  nervous: Gad2Value;
  worry: Gad2Value;
  food: Gad2Value;
}

/**
 * Сигналы слоя 2 (поведенческие). Собираются из обычных шагов онбординга.
 * В MVP не влияют на результат (пороги не откалиброваны) — собираем для
 * будущей калибровки на пилоте.
 */
export interface Layer2Signals {
  // Заполняется в E2.4 по мере добавления вопросов профиля.
  // Примеры будущих сигналов: нереальная цель похудения, очень низкий BMI.
  [key: string]: unknown;
}

/**
 * Считает результат скрининга. Слой 1: GAD-2 сумма ≥ cutoff ИЛИ заметная
 * сложность с едой (food ≥ 2). Слой 2: placeholder, в MVP отключён.
 */
export function scoreScreening(
  answers: ScreeningAnswers,
  layer2?: Layer2Signals,
): ScreeningResult {
  const layers: ScreeningLayer[] = [];

  const gad2Sum = answers.nervous + answers.worry;
  const gad2AtCutoff = gad2Sum >= GAD2_CUTOFF;
  const foodConcernHigh = answers.food >= 2;
  const layer1 = gad2AtCutoff || foodConcernHigh;
  if (layer1) layers.push('layer1');

  // Слой 2 в MVP не выносит решений (LAYER2_PLACEHOLDER.enabled === false).
  if (LAYER2_PLACEHOLDER.enabled && layer2 && evaluateLayer2(layer2)) {
    layers.push('layer2');
  }

  // Goal-free сигналы слоя 2 — производные булевы для локальной аналитики
  // (SAFETY-2, психолог): собираем, но решений по ним не принимаем.
  return { triggered: layers.length > 0, layers, gad2AtCutoff, foodConcernHigh };
}

// Placeholder-оценка слоя 2. TODO(SAFETY-2): реальные пороги.
function evaluateLayer2(_signals: Layer2Signals): boolean {
  return false;
}
