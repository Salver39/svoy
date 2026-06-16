'use client';

// Нижняя навигация (4 таба). Палитра Mocha Taupe (DESIGN.md): активный таб —
// акцентный stroke + основной текст, остальные нейтральные. Линейные иконки,
// без эмодзи. Тач-таргет ≥44px.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

function Leaf() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M5 19c0-7 5-12 14-13 0 8-5 13-14 13z" />
      <path d="M5 19c2-4 5-7 9-9" />
    </svg>
  );
}
function Bowl() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
      <path d="M4 11h16a8 8 0 0 1-16 0z" />
      <path d="M9 7c0-1 .5-2 1-2.5M13 7c0-1 .5-2 1-2.5" />
    </svg>
  );
}
function Heart() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round">
      <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
    </svg>
  );
}
function Gear() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    </svg>
  );
}

const tabs: { href: string; label: string; icon: ReactNode }[] = [
  { href: '/today', label: 'Сегодня', icon: <Leaf /> },
  { href: '/diary', label: 'Дневник', icon: <Bowl /> },
  { href: '/mood', label: 'Настроение', icon: <Heart /> },
  { href: '/settings', label: 'Настройки', icon: <Gear /> },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 z-10 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)]"
      aria-label="Основная навигация"
    >
      <ul className="grid grid-cols-4">
        {tabs.map((tab) => {
          const active = pathname?.startsWith(tab.href) ?? false;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-1.5 px-1 py-2.5
                            text-[12px] transition-colors
                            ${active ? 'text-ink [&_svg]:stroke-accent' : 'text-muted'}`}
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
