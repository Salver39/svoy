'use client';

// Кнопка экспорта данных (BACKLOG E7 AC #3). Экспорт — клиентская операция:
// IndexedDB и Blob-скачивание доступны только в браузере.

import { useState } from 'react';
import { exportDataToFile } from '@/lib/export';

export function ExportButton() {
  const [busy, setBusy] = useState(false);

  async function handle() {
    setBusy(true);
    try {
      await exportDataToFile();
    } catch (err) {
      console.error('Не удалось экспортировать данные:', err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy}
      className="rounded-xl border border-line bg-surface px-4 py-3 text-[14px] text-ink
                 transition-opacity disabled:opacity-40"
    >
      {busy ? 'Готовим файл…' : 'Скачать мои данные (JSON)'}
    </button>
  );
}
