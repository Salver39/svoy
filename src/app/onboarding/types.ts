// Общий черновик онбординга, живёт в памяти до сохранения в Dexie (E2.5).
// Ничего не пишется на диск, пока пользователь не дойдёт до конца —
// это и есть «дверь в один конец»: прервал на середине → профиля нет → при
// следующем заходе онбординг начинается заново.

import type { Sex, ActivitySignal, AppMode } from '@/db/schema';
import type { ScreeningAnswers } from '@/lib/screening';

export type OnboardingStep = 'screening' | 'mode' | 'profile' | 'result';

export interface ProfileDraft {
  height: number | null; // см
  weight: number | null; // кг; null = пропущено (опционально при триггере слоя 1)
  age: number | null;
  sex: Sex | null; // null = не выбран; явный выбор обязателен (без гендер-дефолта)
  activity: ActivitySignal; // сигнал об образе жизни; на расчёт зоны НЕ влияет (R1)
}

export interface OnboardingDraft {
  screening: ScreeningAnswers | null;
  mode: AppMode;
  profile: ProfileDraft;
}

export const EMPTY_DRAFT: OnboardingDraft = {
  screening: null,
  mode: 'numeric', // дефолт — численный режим (SPEC принцип 8)
  profile: {
    height: null,
    weight: null,
    age: null,
    sex: null, // без гендер-дефолта — пользователь выбирает явно
    activity: 'sometimes', // нейтральный дефолт сигнала; зону не двигает
  },
};
