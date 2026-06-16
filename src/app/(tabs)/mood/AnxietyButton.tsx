'use client';

// Глобальная кнопка «тревожно» (BACKLOG E6 AC #2). Доступна на Today и Diary —
// дверь поддержки в момент пика. Монтируется один раз в (tabs)/layout и сама
// решает, показываться ли (self-gate по маршруту), чтобы не дублировать монтаж
// в каждой странице.
//
// Стиль: спокойный тёмный pill, НЕ красный и НЕ крупная акцентная заливка
// (DESIGN.md: ноль красного, акцент только мелко). Affordance высокая — кнопку
// должно быть легко найти в тревоге — но без алармового тона.

import { usePathname, useRouter } from 'next/navigation';
import { recordAnxious } from '@/lib/mood';

const VISIBLE_ON = ['/today', '/diary'];

export function AnxietyButton() {
  const pathname = usePathname();
  const router = useRouter();

  const visible = VISIBLE_ON.some((p) => pathname?.startsWith(p));
  if (!visible) return null;

  async function handle() {
    // Пишем факт «тревожно» за сегодня (метрика «% сессий с тревожно», E9),
    // но не блокируем переход, если запись не удалась.
    try {
      await recordAnxious();
    } catch {
      /* запись метрики не должна мешать поддержке */
    }
    router.push('/grounding');
  }

  return (
    <button
      type="button"
      onClick={handle}
      className="fixed bottom-20 right-5 z-20 rounded-full bg-ink px-4 py-2.5 text-[13px]
                 text-bg shadow-sm active:opacity-90"
    >
      тревожно
    </button>
  );
}
