// Строка Б/Ж/У в граммах (F1, решение A: КБЖУ видны в момент добавления).
// Используется в результате поиска (на 100 г) и в записи дневника в numeric
// (масштаб по грамму через factor). Ноль красного/зелёного — нейтральный muted.
// Возвращает null, если ни одного макро-значения нет (не показываем пустую строку).

export function MacroGrams({
  protein,
  fat,
  carbs,
  factor = 1,
  className = 'mt-0.5 text-[13px] text-muted',
}: {
  protein?: number;
  fat?: number;
  carbs?: number;
  factor?: number; // множитель порции (grams/100); по умолчанию значения на 100 г
  className?: string;
}) {
  const parts: string[] = [];
  if (protein != null) parts.push(`Б ${Math.round(protein * factor)} г`);
  if (fat != null) parts.push(`Ж ${Math.round(fat * factor)} г`);
  if (carbs != null) parts.push(`У ${Math.round(carbs * factor)} г`);
  if (parts.length === 0) return null;
  return <p className={className}>{parts.join(' · ')}</p>;
}
