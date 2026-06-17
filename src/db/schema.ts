// Типы моделей БД. Соответствуют SPEC.md → "Модель данных".
// Хранение: IndexedDB через Dexie (только в браузере, не на сервере).

export type Sex = 'female' | 'male';

// Сигнал об образе жизни (R1, 2026-06-17). СОЗНАТЕЛЬНО НЕ влияет на расчёт зоны:
// активность теперь отмечается per-day (F8), а базовая зона считается с
// фиксированным множителем — иначе образ жизни + per-day отметка задваивали бы
// активность. Это только сигнал о человеке (для будущей аналитики/персонализации).
export type ActivitySignal =
  | 'none' // почти нет физической активности
  | 'sometimes' // иногда
  | 'regular'; // регулярно

export type AppMode = 'numeric' | 'soft';

// Результат скрининга — B-extended модель (см. BACKLOG E2 AC #9).
// Знаем ФАКТ срабатывания и КАКОЙ слой сработал, но НЕ храним сырые ответы
// GAD-2 (minimum-surface для будущего экспорта — см. SPEC «Модель данных» slim).
export type ScreeningLayer = 'layer1' | 'layer2';

export interface ScreeningResult {
  triggered: boolean;
  layers: ScreeningLayer[]; // какие слои сработали; [] если не сработал ни один
  // Goal-free сигналы слоя 2 (SAFETY-2, психолог 2026-06-16) — ПРОИЗВОДНЫЕ
  // булевы, НЕ сырые баллы 0-3 (minimum-surface сохранён; сырые ответы
  // по-прежнему не храним). Только локальная аналитика, юзеру не показываются;
  // решений по ним не принимается. Самый ценный сигнал по психологу —
  // foodConcernHigh (когнитивная занятость едой важнее BMI).
  gad2AtCutoff: boolean; // сумма GAD-2 ≥ cutoff (≥3)
  foodConcernHigh: boolean; // вопрос о еде «Часто»/«Почти постоянно» (≥2)
}

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type Mood = 'great' | 'good' | 'neutral' | 'low' | 'bad';

export type FoodSource = 'off' | 'custom';

export interface Zone {
  min: number;
  max: number;
}

export interface UserProfile {
  id?: number;
  height: number; // см
  weight: number | null; // кг; null если вес пропущен (опционален при срабатывании слоя 1)
  age: number;
  sex: Sex;
  activity: ActivitySignal; // сигнал об образе жизни; НЕ влияет на расчёт зоны (R1)
  mode: AppMode; // выбран пользователем явно; numeric — дефолт
  // SAFETY-1 (2026-06-16): отдельное поле защитного минимума упразднено —
  // минимум = BMR пользователя, выводится из height/weight/age/sex (lib/zone.ts),
  // хранить его как константу больше не нужно.
  screeningResult: ScreeningResult;
  screeningDate: string; // ISO datetime
  webPushFollowupConsent: boolean; // согласие на пуш через M дней молчания (E8)
  zone?: Zone; // числовая зона; не задаётся при mode='soft'
}

export interface FoodItem {
  id?: number;
  name: string;
  brand?: string; // бренд/марка отдельным полем (F2/F10): не клеим в name, чтобы
  // UI мог отличить брендовое от generic. Не индексируется → без bump версии.
  caloriesPer100g: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  source: FoodSource;
  barcode?: string;
  offId?: string; // Open Food Facts product id для дедупа
}

export interface LogEntry {
  id?: number;
  date: string; // ISO date 'YYYY-MM-DD' (день без времени; future-date запрещён в data layer, E3)
  meal: Meal;
  foodItemId: number;
  grams: number;
}

// Чек-ин состояния в мягком режиме (BACKLOG E5). СОЗНАТЕЛЬНО НЕ привязан к
// приёму пищи / LogEntry: связка телесного состояния с конкретной едой создаёт
// павловскую поверхность «съел X → тяжесть → избегаю X» (та же логика, по
// которой mood в E6 развязан от приёмов). Показывается ambient на Today, не
// чаще раза в 7 дней (mass-аудитория: без нагрузки и без клинического тона).
// state: выбранное нейтральное состояние; null — карточку показали, но пропустили
// (нужно для cooldown и метрики под-репорта в E9). Формулировки — SAFETY-3.
export interface SoftStateCheckIn {
  id?: number;
  date: string; // ISO datetime момента показа
  state: string | null;
}

// Mood-чекин — daily, НЕ привязан к LogEntry (сознательная развязка food×mood,
// см. SPEC E6/принципы). Поле logEntryId удалено в v2 относительно v1-каркаса.
//
// Одна строка на календарный день держит И mood, И факт нажатия «тревожно»
// (BACKLOG E6 AC #3: «привязка только к дате, опционально к факту тревожно»).
// mood = null валиден: пользователь мог нажать «тревожно», не делая mood-чекина.
// Поле mood не индексируется → смена типа не требует bump Dexie-версии.
export interface MoodCheckIn {
  id?: number;
  date: string; // ISO datetime (момент чек-ина)
  mood: Mood | null; // null — был только anxious-маркер без выбора настроения
  anxious: boolean; // флаг 'тревожно'
}

// Состояние нуджей и follow-up — одна строка-синглтон (E8).
export interface NudgeState {
  id?: number;
  lastAdaptiveNudgeAt?: string; // ISO datetime последнего показа adaptive nudge
  lastFollowup30At?: string; // ISO datetime последнего 30-day check-in
}

// Сырое событие открытия приложения — для метрики «% открытий без логирования» (E9).
export interface AppOpenEvent {
  id?: number;
  date: string; // ISO datetime
}

// Переключение режима — для метрики «частота переключения» (E9).
export interface ModeSwitch {
  id?: number;
  date: string; // ISO datetime
  from: AppMode;
  to: AppMode;
}

// Ответ 30-дневного follow-up (E8). Может остаться пустой, если решим
// хранить follow-up прямо в NudgeState — схему это не ломает.
export interface FollowupResponse {
  id?: number;
  date: string; // ISO datetime
  gad2Score: number;
  selfRatedInfluence: number; // self-rated app influence «помогает/мешает»
}

// Интенсивность тренировки (F8, LOCKED-B). Только два уровня — не фитнес-трекер,
// разные уровни дают разный дневной множитель зоны (lib/zone.ts).
export type WorkoutIntensity = 'light' | 'strength';

// Отметка тренировки на день (F8). СОЗНАТЕЛЬНО per-day и минимальна: только факт +
// интенсивность, без длительности/«сожжено»/счётчиков (Anderberg 2025 — diet+fitness
// токсичны; принцип 13 смягчён, не отменён). Поднимает дневную зону на Today, недельное
// среднее НЕ трогает. Одна запись на календарный день.
export interface WorkoutDay {
  id?: number;
  date: string; // ISO date 'YYYY-MM-DD'
  intensity: WorkoutIntensity;
}
