// Спокойное пустое состояние поиска (BACKLOG E3 AC #2). Без красного, без
// «ошибки» — нейтральное приглашение добавить вручную.

export function NoResults({ onManualAdd }: { onManualAdd: () => void }) {
  return (
    <div className="py-10 text-center">
      <p className="text-muted">Ничего не нашлось</p>
      <button
        type="button"
        onClick={onManualAdd}
        className="mt-3 text-[14px] text-muted underline decoration-line underline-offset-2"
      >
        Добавить вручную
      </button>
    </div>
  );
}
