'use client';

// Универсальный текст про цикличность аппетита (BACKLOG E4 AC #8).
// Спокойная карточка, акцентная иконка (единственный акцент-цвет на экране кроме
// активного таба). Текст — placeholder, ротация по неделе. SAFETY-3.

interface Props {
  text: string;
}

export function CycleNote({ text }: Props) {
  return (
    <div className="mt-7 flex items-start gap-2.5 rounded-2xl bg-surface px-4 py-3.5">
      <svg
        viewBox="0 0 24 24"
        className="mt-px h-[17px] w-[17px] flex-none stroke-accent"
        fill="none"
        strokeWidth={1.7}
        aria-hidden="true"
      >
        <path d="M5 19c0-7 5-12 14-13 0 8-5 13-14 13z" />
        <path d="M5 19c2-4 5-7 9-9" />
      </svg>
      <p className="text-[13.5px] leading-snug text-ink">{text}</p>
    </div>
  );
}
