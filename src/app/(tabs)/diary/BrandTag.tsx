// Чип бренда/марки (F2/F10). Линейная иконка-ярлык (DESIGN: stroke ~1.7, без
// эмодзи), нейтральный muted на surface-raised — это метаданные источника, не
// дозированный accent. Отличает брендовый продукт от generic в поиске и хранит
// бренд в записи дневника (раньше он был вклеен в name).

export function BrandTag({ brand }: { brand: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded bg-raised px-1.5 py-0.5 text-[12px] text-muted">
      <svg
        viewBox="0 0 24 24"
        className="h-3 w-3 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
        <circle cx="7.5" cy="7.5" r="1.3" />
      </svg>
      <span className="truncate">{brand}</span>
    </span>
  );
}
