'use client';

// Кнопка «итоги недели» в шапке Today слева (Today R2). Балансирует переключатель
// режима справа. Открывает нижний шит с недельными числами (WeeklyReportSheet) —
// недельные числа живут ТОЛЬКО там, не на главном (handoff §4).

export function WeeklyReportButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex items-center gap-1.5 py-1 text-[13px] text-muted"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[15px] w-[15px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        aria-hidden="true"
      >
        <path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-7" />
      </svg>
      итоги недели
    </button>
  );
}
