'use client';

// Снэкбар отмены удаления (F3): случайно удалённую запись можно вернуть.
// Нейтральная копи, без оценки. Висит над таб-баром, авто-скрытие — у владельца
// состояния (diary/page). Тач-таргет «Вернуть» ≥44px.

export function UndoSnackbar({ onUndo }: { onUndo: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-20 z-50 mx-auto flex max-w-md items-center justify-between gap-4 px-6">
      <div className="flex flex-1 items-center justify-between gap-4 rounded-xl bg-ink px-4 py-3 text-bg shadow-lg">
        <span className="text-[14px]">Запись удалена</span>
        <button
          type="button"
          onClick={onUndo}
          className="-my-3 py-3 text-[14px] font-medium underline underline-offset-2"
        >
          Вернуть
        </button>
      </div>
    </div>
  );
}
