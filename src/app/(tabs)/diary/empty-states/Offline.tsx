// Спокойное оффлайн-состояние (BACKLOG E3 AC #2). Поиск по базе требует сети;
// без неё мягко предлагаем добавить вручную — это работает офлайн.

export function Offline({ onManualAdd }: { onManualAdd: () => void }) {
  return (
    <div className="py-10 text-center">
      <p className="text-muted">
        Поиск по базе сейчас недоступен — нет связи.
      </p>
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
