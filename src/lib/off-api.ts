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

  // OFF иногда присылает мусорный бренд ('undefined', пусто) — не клеим его.
  const rawBrand = p.brands?.split(',')[0]?.trim();
  const brand = rawBrand && rawBrand.toLowerCase() !== 'undefined' ? rawBrand : undefined;
  return {
    name: brand ? `${name} (${brand})` : name,
    caloriesPer100g: kcal, // точное значение; округление — на отображении
    protein: p.nutriments?.proteins_100g,
    fat: p.nutriments?.fat_100g,
    carbs: p.nutriments?.carbohydrates_100g,
    source: 'off',
    barcode: p.code,
    offId: p.code,
  };
}

// Ответ нашего прокси /api/off-search.
type ProxyResponse =
  | { ok: true; products: OffProduct[] }
  | { ok: false; reason: 'upstream' | 'timeout' | 'network' };

/** Поиск продуктов по строке. Спокойные исходы вместо исключений. */
export async function searchFoods(query: string): Promise<SearchOutcome> {
  const q = query.trim();
  if (!q) return { kind: 'empty' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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

    const items = data.products
      .map(mapProduct)
      .filter((x): x is FoodItem => x !== null);

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
