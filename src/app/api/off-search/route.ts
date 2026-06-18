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
// Устойчивость (2026-06-18, после транзиентного провисания OFF, давшего 35с-хэнг):
//  - FAIL-FAST: единый AbortController на попытку покрывает И fetch, И res.json()
//    (json читается под тем же сигналом) — медленное ТЕЛО ответа тоже обрубается.
//    Общий дедлайн TOTAL_DEADLINE_MS на весь хэндлер: функция не висит дольше него.
//    Серверный дедлайн < клиентского таймаута (lib/off-api.ts), чтобы сервер всегда
//    отвечал ПЕРВЫМ и клиент получал спокойный исход, а не свой abort.
//  - КЭШ + STALE-ON-ERROR: успешные ответы кэшируются по нормализованному запросу
//    (in-memory, живёт на тёплом инстансе). Свежий хит — отдаём без запроса к OFF.
//    При сбое OFF, если есть ЛЮБОЙ (даже устаревший) кэш — отдаём его (stale), а не
//    «нет связи»: краткий провал OFF не ломает поиск повторных запросов.
//
// Контракт ответа к клиенту прежний: { ok:true, products:[…] } либо
// { ok:false, reason }. Search-a-licious кладёт продукты в `hits` — перекладываем
// в `products`, чтобы клиент остался без изменений. Поле `cached` — диагностическое,
// клиент его игнорирует.

import type { NextRequest } from 'next/server';

const OFF_SEARCH_URL = 'https://search.openfoodfacts.org/search';
const REQUEST_TIMEOUT_MS = 6000; // бюджет ОДНОЙ попытки (fetch + json)
const TOTAL_DEADLINE_MS = 8000; // жёсткий потолок всего хэндлера (< клиентских 10с)
const MAX_ATTEMPTS = 2;
const RETRY_BACKOFF_MS = 300;
const PAGE_SIZE = 20;
const CACHE_TTL_MS = 10 * 60_000; // окно «свежести» кэша
const CACHE_MAX = 200; // потолок записей (FIFO-вытеснение)
// OFF просит идентифицировать клиента. Строка УХОДИТ на серверы OFF при каждом
// запросе, поэтому контакт — ТОЛЬКО публичный URL приложения (не персональные
// данные). НЕ подставлять личный e-mail: это передача PII третьей стороне
// (минимизация данных). URL приложения — публичный, не PII.
const USER_AGENT = 'Svoy/0.1 (pilot; https://svoy-salver39s-projects.vercel.app)';

// --- Кэш (module-scope, общий для тёплого serverless-инстанса) ---
interface CacheEntry {
  products: unknown[];
  ts: number;
}
const cache = new Map<string, CacheEntry>();

function cacheGet(key: string): { products: unknown[]; fresh: boolean } | null {
  const e = cache.get(key);
  if (!e) return null;
  return { products: e.products, fresh: Date.now() - e.ts < CACHE_TTL_MS };
}

function cacheSet(key: string, products: unknown[]): void {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { products, ts: Date.now() });
}

// --- Одна попытка к OFF под общим таймаутом (fetch + json вместе) ---
type Attempt =
  | { kind: 'ok'; products: unknown[] }
  | { kind: 'upstream'; status: number } // OFF ответил не-2xx
  | { kind: 'timeout' } // abort по бюджету
  | { kind: 'network' }; // прочий сбой связи

async function attemptOff(url: string, budgetMs: number): Promise<Attempt> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), budgetMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return { kind: 'upstream', status: res.status };
    // json() читаем ДО clearTimeout — под тем же abort-сигналом: если тело
    // отдаётся медленно, abort по бюджету прервёт и его (а не зависнет, как раньше).
    const data = (await res.json()) as { hits?: unknown[] };
    return { kind: 'ok', products: data.hits ?? [] };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === 'AbortError';
    return { kind: aborted ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!q) return Response.json({ ok: true, products: [] });

  const key = q.toLowerCase();

  // Свежий кэш — мгновенный ответ, без запроса к OFF.
  const fresh = cacheGet(key);
  if (fresh?.fresh) {
    return Response.json({ ok: true, products: fresh.products, cached: 'fresh' });
  }

  const params = new URLSearchParams({
    q,
    page_size: String(PAGE_SIZE),
    fields: 'code,product_name,brands,nutriments',
  });
  const url = `${OFF_SEARCH_URL}?${params}`;

  const started = Date.now();
  let lastReason: 'upstream' | 'timeout' | 'network' = 'upstream';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const remaining = TOTAL_DEADLINE_MS - (Date.now() - started);
    if (remaining <= 200) break; // дедлайн исчерпан — не начинаем новую попытку
    const budget = Math.min(REQUEST_TIMEOUT_MS, remaining);

    const r = await attemptOff(url, budget);

    if (r.kind === 'ok') {
      cacheSet(key, r.products);
      return Response.json({ ok: true, products: r.products });
    }

    // Ретрай только на транзиентный 5xx и только если ещё хватает времени на
    // полноценную попытку. Таймаут/сеть не ретраим — бюджета нет.
    const timeLeft = TOTAL_DEADLINE_MS - (Date.now() - started);
    if (
      r.kind === 'upstream' &&
      r.status >= 500 &&
      attempt < MAX_ATTEMPTS &&
      timeLeft > REQUEST_TIMEOUT_MS + RETRY_BACKOFF_MS
    ) {
      await new Promise((res) => setTimeout(res, RETRY_BACKOFF_MS));
      continue;
    }

    // r.kind здесь уже сужен до 'upstream' | 'timeout' | 'network' (на 'ok' вышли выше).
    lastReason = r.kind;
    break;
  }

  // STALE-ON-ERROR: OFF не дал ответа, но есть прежний (пусть устаревший) — отдаём его.
  const stale = cacheGet(key);
  if (stale) {
    return Response.json({ ok: true, products: stale.products, cached: 'stale' });
  }

  // Нет ни ответа, ни кэша — спокойный «недоступно» (200, тело ok:false), чтобы UI
  // показал нейтральное состояние, а не красную ошибку.
  return Response.json({ ok: false, reason: lastReason });
}
