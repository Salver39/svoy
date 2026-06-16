// Блок-карточка ресурсов поддержки (BACKLOG E2 AC #4, E7 AC #1).
// Показывается в потоке сработавшего скрининга и в Settings.
// Тон спокойный, без алармизма, без «обратись срочно».
//
// Контакты — реальные, проверенные по первоисточникам (см. content/resources.ts).
// ✅ SAFETY-3: рамка карточки прошла ревью специалиста (психолог + UX writer)
// 2026-06-16 — без оценки состояния и без прямого упоминания еды.
//
// Дисклеймер «не медицинское изделие» здесь НЕ дублируется — он живёт одним
// источником (content/legal.ts) и показывается рядом: в онбординге-футере и
// в настройках (см. MEDICAL_DISCLAIMER).

import { HELP_RESOURCES } from '@/content/resources';

export function ResourcesCard() {
  return (
    <aside
      className="rounded-2xl border border-line bg-surface p-4 text-[14px]
                 text-muted"
      aria-label="Ресурсы поддержки"
    >
      <p className="font-medium text-ink">Если хочется поговорить</p>
      <p className="mt-1">
        Иногда бывает полезно поговорить с кем-то о том, что происходит.
      </p>
      <ul className="mt-3 space-y-3">
        {HELP_RESOURCES.map((r) => {
          const external = r.href.startsWith('http');
          return (
            <li key={r.name}>
              <a
                href={r.href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className="block rounded-xl py-1 -my-1 hover:text-ink
                           focus-visible:outline focus-visible:outline-2
                           focus-visible:outline-line"
              >
                <span className="font-medium text-ink">{r.name}</span>
                <span className="mt-0.5 block">{r.detail}</span>
                <span className="mt-0.5 block tabular-nums">{r.contact}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
