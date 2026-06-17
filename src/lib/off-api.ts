// Клиент поиска продуктов (BACKLOG E3 AC #1-2, SPEC).
// Ходит в НАШ серверный прокси /api/off-search (не напрямую в OFF): OFF часто
// 503-ит без CORS-заголовков на ошибках и просит кастомный User-Agent — прокси
// снимает оба ограничения. Найденное кэшируется в Dexie (FoodItem, source='off').
//
// Деградация спокойная: таймаут, оффлайн и пустой результат — НЕ ошибка с
// красным, а нейтральные состояния (различает их вызывающий UI по типу
// результата).

import { getDB } from '@/db/client';
import type { FoodItem } from '@/db/schema';

const SEARCH_PROXY_URL = '/api/off-search';
const REQUEST_TIMEOUT_MS = 9000; // чуть больше серверного, чтобы прокси успел ответить

// Сырой продукт OFF — берём только нужные поля.
interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    fat_100g?: number;
    carbohydrates_100g?: number;
  };
}

export type SearchOutcome =
  | { kind: 'ok'; items: FoodItem[] }
  | { kind: 'empty' } // запрос прошёл, ничего не найдено
  | { kind: 'offline' } // сеть недоступна / таймаут
  | { kind: 'error' }; // прочая ошибка запроса

/** Маппинг OFF-продукта в наш FoodItem. Возвращает null, если нет имени/ккал. */
function mapProduct(p: OffProduct): FoodItem | null {
  const name = p.product_name?.trim();
  const kcal = p.nutriments?.['energy-kcal_100g'];
  if (!name || typeof kcal !== 'number' || Number.isNaN(kcal)) return null;

  // OFF иногда присылает мусорный бренд ('undefined', пусто) — отбрасываем.
  // Бренд отдаём ОТДЕЛЬНЫМ полем (F2/F10), а не клеим в name: UI сам решает,
  // как отличить брендовое от generic (чип/иконка), и не дублирует бренд в имени.
  const rawBrand = p.brands?.split(',')[0]?.trim();
  const brand = rawBrand && rawBrand.toLowerCase() !== 'undefined' ? rawBrand : undefined;
  return {
    name,
    brand,
    caloriesPer100g: kcal, // точное значение; округление — на отображении
    protein: p.nutriments?.proteins_100g,
    fat: p.nutriments?.fat_100g,
    carbs: p.nutriments?.carbohydrates_100g,
    source: 'off',
    barcode: p.code,
    offId: p.code,
  };
}

/**
 * Релевантность результата запросу (F5). Ранжируем ТОЛЬКО по совпадению с
 * запросом и надёжности данных — НИКОГДА по калорийности/БЖУ (закон продукта 8:
 * «меньше калорий = лучше» вернул бы фрейм «хорошая/плохая еда»).
 *
 * Шкала: точное имя > имя с запроса > слово с запроса > вхождение. Небольшие
 * бусты: полные нутриенты (данные надёжнее) и generic без бренда (выше брендовых
 * снеков — по эвристике наличия бренда, не по числам).
 */
function relevanceScore(item: FoodItem, query: string): number {
  const name = item.name.toLowerCase();
  let score = 0;
  if (name === query) score += 100;
  else if (name.startsWith(query)) score += 60;
  // «слово начинается с запроса» — через токены (\b в JS не дружит с кириллицей).
  else if (name.split(/[\s,()./-]+/).some((t) => t.startsWith(query))) score += 40;
  else if (name.includes(query)) score += 20;

  if (item.protein != null && item.fat != null && item.carbs != null) score += 5;
  if (!item.brand) score += 3;
  return score;
}

/** Стабильная сортировка по релевантности; равные сохраняют порядок OFF. */
function rankByRelevance(items: FoodItem[], query: string): FoodItem[] {
  const q = query.toLowerCase().trim();
  return items
    .map((item, i) => ({ item, i, score: relevanceScore(item, q) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.item);
}

// Ответ нашего прокси /api/off-search.
type ProxyResponse =
  | { ok: true; products: OffProduct[] }
  | { ok: false; reason: 'upstream' | 'timeout' | 'network' };

/**
 * Поиск продуктов по строке. Спокойные исходы вместо исключений.
 * `signal` (F4): живой поиск отменяет предыдущий запрос при новом вводе —
 * внешний сигнал прокидываем в тот же контроллер, что и таймаут.
 */
export async function searchFoods(
  query: string,
  options?: { signal?: AbortSignal },
): Promise<SearchOutcome> {
  const q = query.trim();
  if (!q) return { kind: 'empty' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  // Внешняя отмена (новый ввод вытеснил этот запрос) → прерываем тот же fetch.
  const external = options?.signal;
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(`${SEARCH_PROXY_URL}?q=${encodeURIComponent(q)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return { kind: 'error' };

    const data: ProxyResponse = await res.json();
    if (!data.ok) {
      // upstream/timeout/network на стороне прокси → спокойное «оффлайн».
      return { kind: 'offline' };
    }

    const items = rankByRelevance(
      data.products.map(mapProduct).filter((x): x is FoodItem => x !== null),
      q,
    );

    return items.length > 0 ? { kind: 'ok', items } : { kind: 'empty' };
  } catch (err) {
    // Сбой связи с нашим же прокси (редко) — тоже спокойное «оффлайн».
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { kind: 'offline' };
    }
    if (err instanceof TypeError) {
      return { kind: 'offline' };
    }
    return { kind: 'error' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Сохраняет FoodItem в кэш Dexie. Дедуп по offId: если продукт уже есть,
 * возвращает его id, не дублируя. Для custom-продуктов offId отсутствует —
 * они всегда добавляются как новые.
 */
export async function cacheFoodItem(item: FoodItem): Promise<number> {
  const db = getDB();
  if (item.offId) {
    const existing = await db.foodItems.where('offId').equals(item.offId).first();
    if (existing?.id) return existing.id;
  }
  return db.foodItems.add(item);
}
