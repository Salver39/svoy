#!/usr/bin/env node
// Импорт RU-среза в Meilisearch + настройки + создание search-only ключа.
// Идемпотентно: повторный запуск делает полную переиндексацию (чистит индекс,
// затем заливает — удаления из источника тоже применяются; для обновления, A5).
//
// Использование:
//   MEILI_URL=https://<host> MEILI_MASTER_KEY=<key> node reindex.mjs [path-to-ru-docs.json]
//
// Выводит SEARCH-ONLY ключ — его (и только его) кладём в env Vercel как
// MEILI_SEARCH_KEY (мастер-ключ в приложение НЕ попадает).

import { readFile } from 'node:fs/promises';

const BASE = process.env.MEILI_URL?.replace(/\/$/, '');
const MASTER = process.env.MEILI_MASTER_KEY;
const DOCS = process.argv[2] || new URL('./ru-docs.json', import.meta.url).pathname;
const INDEX = 'off_ru';

if (!BASE || !MASTER) {
  console.error('Нужны MEILI_URL и MEILI_MASTER_KEY в env.');
  process.exit(1);
}

const h = { Authorization: `Bearer ${MASTER}`, 'Content-Type': 'application/json' };
const api = (p, opt = {}) => fetch(`${BASE}${p}`, { ...opt, headers: { ...h, ...opt.headers } });

async function waitTask(uid, tolerateCode) {
  for (;;) {
    const t = await (await api(`/tasks/${uid}`)).json();
    if (t.status === 'succeeded') return;
    if (t.status === 'failed') {
      if (tolerateCode && t.error?.code === tolerateCode) return; // ожидаемый безвредный фейл
      throw new Error(`task ${uid} failed: ${JSON.stringify(t.error)}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

const docs = await readFile(DOCS, 'utf8');

// Полная переиндексация: сначала чистим индекс, иначе записи, пропавшие из
// источника (отфильтрованный мусор), останутся в Meilisearch — POST /documents
// делает upsert и сам по себе НЕ удаляет отсутствующие id.
// Очистка требует существующего индекса (на пустом сервере DELETE /documents
// ставит задачу, которая фейлится index_not_found). Поэтому сначала создаём
// индекс идемпотентно: если он уже есть — задача безвредно фейлится
// index_already_exists, которую мы терпим. Задачи по off_ru исполняются по
// порядку, так что create → clear → import применяются последовательно.
console.log('Очистка индекса…');
let cr = await api('/indexes', { method: 'POST', body: JSON.stringify({ uid: INDEX, primaryKey: 'id' }) });
await waitTask((await cr.json()).taskUid, 'index_already_exists');
let del = await api(`/indexes/${INDEX}/documents`, { method: 'DELETE' });
await waitTask((await del.json()).taskUid);

console.log('Импорт документов…');
let r = await api(`/indexes/${INDEX}/documents?primaryKey=id`, { method: 'POST', body: docs });
await waitTask((await r.json()).taskUid);

console.log('Настройки индекса…');
r = await api(`/indexes/${INDEX}/settings`, {
  method: 'PATCH',
  body: JSON.stringify({
    searchableAttributes: ['name', 'brand'],
    displayedAttributes: ['code', 'name', 'brand', 'caloriesPer100g', 'protein', 'fat', 'carbs'],
  }),
});
await waitTask((await r.json()).taskUid);

const stats = await (await api(`/indexes/${INDEX}/stats`)).json();
console.log(`Проиндексировано: ${stats.numberOfDocuments} документов.`);

// Search-only ключ для приложения (actions=search, только этот индекс).
console.log('Создаю search-only ключ…');
r = await api('/keys', {
  method: 'POST',
  body: JSON.stringify({
    name: 'svoy-search',
    actions: ['search'],
    indexes: [INDEX],
    expiresAt: null,
  }),
});
const key = await r.json();
console.log('\n=== ДЛЯ ENV VERCEL ===');
console.log(`MEILI_URL=${BASE}`);
console.log(`MEILI_SEARCH_KEY=${key.key}`);
