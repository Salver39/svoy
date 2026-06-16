// Серверный прокси к Open Food Facts (BACKLOG E3 AC #1).
// Зачем не напрямую из браузера: error-страницы OFF не несут CORS-заголовков →
// браузер видит «CORS error» вместо реального статуса. Плюс OFF-этикет просит
// кастомный User-Agent, который браузер слать не умеет. Прокси на сервере (Vercel
// serverless) снимает оба ограничения. Сеть по-прежнему только к OFF; данные
// пользователя тут не проходят (это просто поиск по публичной базе).
//
// Эндпойнт: Search-a-licious (search.openfoodfacts.org) — официальная замена
// старому cgi/search.pl. Выбран по живому тесту 2026-06-16:
//  - Надёжность: 4/4 успешных ответа на RU-запросы против ≈2/3 у legacy
//    cgi/search.pl (тот отдаёт 503 даже при редких запросах — Elasticsearch
//    бэкенд нового API стабильнее MongoDB-скрипта legacy).
//  - Релевантность RU: на кириллицу отдаёт локальные продукты с русскими
//    именами по умолчанию («Молоко 1,5», «Гречка») — отдельный lc не нужен.
//  - Форма нутриентов идентична legacy (energy-kcal_100g/proteins_100g/…),
//    поэтому маппер на клиенте (lib/off-api.ts) не меняется.
//  - sort_by по популярности СОЗНАТЕЛЬНО не используется: на legacy он тянул
//    вперёд иностранные продукты и чаще 503-ил; дефолтная релевантность лучше.
//
// Контракт ответа к клиенту прежний: { ok:true, products:[…] } либо
// { ok:false, reason }. Search-a-licious кладёт продукты в `hits` — перекладываем
// в `products`, чтобы клиент остался без изменений.

import type { NextRequest } from 'next/server';

const OFF_SEARCH_URL = 'https://search.openfoodfacts.org/search';
const REQUEST_TIMEOUT_MS = 7000;
const MAX_ATTEMPTS = 2;
const RETRY_BACKOFF_MS = 300;
const PAGE_SIZE = 20;
// OFF просит идентифицировать клиента. Строка УХОДИТ на серверы OFF при каждом
// запросе, поэтому контакт — ТОЛЬКО публичный URL приложения (не персональные
// данные). НЕ подставлять личный e-mail: это передача PII третьей стороне
// (минимизация данных). URL приложения — публичный, не PII.
const USER_AGENT = 'Svoy/0.1 (pilot; https://svoy-salver39s-projects.vercel.app)';

/** Один запрос к OFF с собственным таймаутом. */
async function fetchOff(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!q) return Response.json({ ok: true, products: [] });

  const params = new URLSearchParams({
    q,
    page_size: String(PAGE_SIZE),
    fields: 'code,product_name,brands,nutriments',
  });
  const url = `${OFF_SEARCH_URL}?${params}`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetchOff(url);

      if (res.ok) {
        // Search-a-licious кладёт продукты в `hits`; контракт к клиенту — `products`.
        const data: { hits?: unknown[] } = await res.json();
        return Response.json({ ok: true, products: data.hits ?? [] });
      }

      // OFF лёг (5xx). Транзиентный 5xx — один быстрый ретрай; иначе отдаём
      // спокойный «upstream недоступен», 200 для клиента, чтобы UI показал
      // нейтральное состояние, а не красную ошибку.
      if (attempt < MAX_ATTEMPTS && res.status >= 500) {
        await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS));
        continue;
      }
      return Response.json({ ok: false, reason: 'upstream' });
    } catch (err) {
      // Таймаут не ретраим — временного бюджета на второй заход нет.
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      return Response.json({ ok: false, reason: aborted ? 'timeout' : 'network' });
    }
  }

  return Response.json({ ok: false, reason: 'upstream' });
}
