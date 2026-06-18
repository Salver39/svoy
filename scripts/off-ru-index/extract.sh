#!/usr/bin/env bash
# Извлечение RU-среза Open Food Facts в форму приложения (для Meilisearch).
# Источник: официальный CSV-дамп OFF с S3 (HF троттлит range-запросы 429).
# Зависимости: duckdb, curl. Результат: ru-docs.json (JSON-массив для импорта).
#
# RU-релевантность: product_name содержит кириллицу ИЛИ countries_tags ⊇ en:russia;
# и есть валидный energy-kcal_100g в правдоподобном диапазоне (0 < kcal ≤ 1000).
# Верхняя отсечка убирает грубый мусор OFF (ккал перепутаны с кДж / внесено «на
# упаковку»): физ. максимум для еды ≈900 ккал/100г (чистый жир), порог 1000 — с
# запасом, чтобы не резать рафинированные масла у самой границы. Форма совпадает
# с тем, что маппит lib/off-api.ts.
set -euo pipefail
cd "$(dirname "$0")"

CSV_URL="https://openfoodfacts-ds.s3.eu-west-3.amazonaws.com/en.openfoodfacts.org.products.csv.gz"
CSV="off.csv.gz"
OUT="ru-docs.json"

if [ ! -f "$CSV" ]; then
  echo "Скачиваю дамп OFF (~1.2 ГБ)…"
  curl -sSL -C - --retry 5 --retry-delay 5 -o "$CSV" "$CSV_URL"
fi

echo "Извлекаю RU-срез через DuckDB…"
duckdb -c "
COPY (
  SELECT
    row_number() OVER () AS id,
    code,
    trim(product_name) AS name,
    nullif(trim(brands),'') AS brand,
    round(try_cast(\"energy-kcal_100g\" AS DOUBLE),1) AS caloriesPer100g,
    round(try_cast(proteins_100g AS DOUBLE),1) AS protein,
    round(try_cast(fat_100g AS DOUBLE),1) AS fat,
    round(try_cast(carbohydrates_100g AS DOUBLE),1) AS carbs
  FROM read_csv('$CSV', delim='\t', header=true, quote='', ignore_errors=true, all_varchar=true)
  WHERE (regexp_matches(product_name,'[А-Яа-яЁё]') OR countries_tags LIKE '%en:russia%')
    AND try_cast(\"energy-kcal_100g\" AS DOUBLE) > 0
    AND try_cast(\"energy-kcal_100g\" AS DOUBLE) <= 1000
    AND length(trim(product_name)) > 0
) TO '$OUT' (FORMAT json, ARRAY true);
"
echo "Готово: $OUT ($(wc -c < "$OUT" | awk '{printf "%.1f МБ", $1/1048576}'))"
