# Self-host поиска продуктов (Meilisearch + RU-срез OFF)

Реализация варианта A: свой поисковый индекс из RU-среза Open Food Facts.
Снимает зависимость от флакающего публичного API OFF; OFF остаётся фолбэком.

## Что где
- `extract.sh` — скачать дамп OFF (CSV с S3) и собрать `ru-docs.json` (RU-срез, ~6.8k продуктов, ~1 МБ). Нужен `duckdb` (`brew install duckdb`). Фильтр: RU-релевантность + `0 < kcal/100г ≤ 1000` (верхняя отсечка убирает грубый мусор OFF — записи с ккал-как-кДж и «на упаковку»; физ. максимум еды ≈900, порог с запасом).
- `reindex.mjs` — залить `ru-docs.json` в Meilisearch, настроить индекс, выдать **search-only** ключ. Идемпотентно (годится для ночного обновления).
- `fly.toml` — деплой Meilisearch на Fly.io.

Данные: Open Food Facts, лицензия **ODbL** — нужна атрибуция в приложении (см. задачу A5).

## Локально (для разработки/проверки)
```bash
./extract.sh                       # → ru-docs.json
docker run -d --name meili -p 7700:7700 \
  -e MEILI_MASTER_KEY=devkey -e MEILI_NO_ANALYTICS=true \
  getmeili/meilisearch:v1.11
MEILI_URL=http://localhost:7700 MEILI_MASTER_KEY=devkey node reindex.mjs
```

## Прод на Fly.io
```bash
brew install flyctl && fly auth login
# в этой папке:
fly launch --no-deploy --copy-config --name <уникальное-имя>   # подхватит fly.toml
fly volumes create meili_data --size 1 --region fra
fly secrets set MEILI_MASTER_KEY="$(openssl rand -base64 32)"
fly deploy

# индексация (мастер-ключ возьми из `fly secrets`, он не печатается — задай свой при set):
MEILI_URL=https://<app>.fly.dev MEILI_MASTER_KEY=<тот-же-мастер> node reindex.mjs
# скрипт выведет MEILI_URL и MEILI_SEARCH_KEY — их в env Vercel (см. A4).
```

## Подключение к приложению (A4)
В Vercel задать env `MEILI_URL` и `MEILI_SEARCH_KEY` (search-only).
Прокси `/api/off-search` сначала ищет в индексе, при промахе/сбое — фолбэк на OFF.
Мастер-ключ в приложение НЕ попадает.

## Обновление (A5)
Крон (раз в сутки): `./extract.sh && node reindex.mjs`. OFF даёт дневные дельты;
для пилота достаточно полного пере-экспорта (база маленькая).
