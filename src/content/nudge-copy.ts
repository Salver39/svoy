// Тексты adaptive nudge и 30-day follow-up (BACKLOG E8).
//
// ✅ SAFETY-3: формулировки ниже прошли ревью специалиста (психолог + UX writer)
// 2026-06-16. В MVP ничего из этого не показывается (фиче-флаги в config/nudge.ts),
// активация — v1.1; тексты уже отревьюированы.
//
// Правила копи (SPEC принципы 5, 6, 11; gender-neutral memory):
//  - Приглашение, не давление: «хочешь попробовать», не «тебе нужно».
//  - Никакого шейминга за паттерн использования. Off-ramp — это успех, не провал.
//  - Gender-neutral: настоящее время, безличное, без рода.

// ─── Adaptive nudge (мягкая фраза на Today) ───────────────────────────────

/** Заголовок баннера-приглашения в режим без чисел. SAFETY-3. */
export const ADAPTIVE_NUDGE_TITLE = 'Хочешь на время скрыть числа?';

/** Подпись под заголовком. SAFETY-3. */
export const ADAPTIVE_NUDGE_BODY =
  'Можно на время скрыть калории и отмечать состояние. Числа вернутся в любой момент.';

/** Кнопка принятия. SAFETY-3. */
export const ADAPTIVE_NUDGE_ACCEPT = 'Попробовать';

/** Кнопка отказа — без негативной окраски. SAFETY-3. */
export const ADAPTIVE_NUDGE_DISMISS = 'Не сейчас';

// ─── 30-day follow-up (одноразовый экран самопроверки) ────────────────────
//
// BACKLOG E8 AC #5: 1-2 пункта GAD-2 (сравнение с baseline скрининга) +
// 1 пункт self-rated app influence (Aslanova 2024 r=.653). Шкалы — параметры,
// не зашиты в текст.

/** Вступление экрана follow-up. SAFETY-3. */
export const FOLLOWUP_INTRO =
  'Пара коротких вопросов о самочувствии. Ответы остаются на устройстве.';

/** Пункты GAD-2 (за последние 2 недели). SAFETY-3: валидированная русская адаптация
 *  (психолог 2026-06-16, держим близко к оригиналу — валидность важнее tone of voice). */
export const FOLLOWUP_GAD2_ITEMS: readonly string[] = [
  'Как часто за последние две недели тебя беспокоили нервозность, тревога или ощущение напряжения?',
  'Как часто за последние две недели не удавалось остановить или контролировать беспокойство?',
];

/** Варианты ответа GAD-2 (0-3). SAFETY-3. */
export const FOLLOWUP_GAD2_OPTIONS: readonly { label: string; value: number }[] = [
  { label: 'Совсем нет', value: 0 },
  { label: 'Несколько дней', value: 1 },
  { label: 'Больше половины дней', value: 2 },
  { label: 'Почти каждый день', value: 3 },
];

/** Self-rated app influence — помогает или мешает. SAFETY-3. */
export const FOLLOWUP_INFLUENCE_QUESTION =
  'Как сейчас ощущается взаимодействие с приложением?';

/** Шкала влияния (−2 мешает … +2 помогает). SAFETY-3. */
export const FOLLOWUP_INFLUENCE_OPTIONS: readonly { label: string; value: number }[] = [
  { label: 'Мешает', value: -2 },
  { label: 'Скорее мешает', value: -1 },
  { label: 'Нейтрально', value: 0 },
  { label: 'Скорее помогает', value: 1 },
  { label: 'Помогает', value: 2 },
];

/** Завершение экрана follow-up. SAFETY-3. */
export const FOLLOWUP_OUTRO = 'Ответы сохранены на устройстве.';

// ─── Delayed-silence push (через M дней молчания) ─────────────────────────

/** Заголовок единственного push-уведомления v1. SAFETY-3. Отправка — v1.1. */
export const PUSH_FOLLOWUP_TITLE = 'Можно заглянуть на минуту';

/** Тело push. SAFETY-3. */
export const PUSH_FOLLOWUP_BODY = 'Небольшой чек-ин, если будет удобно.';
