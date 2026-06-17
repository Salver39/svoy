'use client';

// Онбординг как state-machine в памяти (E2.3-E2.5). Шаги:
// screening → mode → profile → result. Ничего не пишется в Dexie до финального
// «Начать» — это «дверь в один конец»: прерванный онбординг не оставляет
// профиля, при следующем заходе начинается заново.
//
// Решение не делать URL-маршрутизацию по шагам: новый SPEC убрал жёсткий gate
// «вес недоступен без зелёного скрининга», ради которого она задумывалась.
// Single-component машина проще и не плодит cross-route state.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDB } from '@/db/client';
import { scoreScreening, type ScreeningAnswers } from '@/lib/screening';
import { computeZone, formatZone, proxyWeightFromHeight } from '@/lib/zone';
import type { ScreeningResult, UserProfile, Zone } from '@/db/schema';
import { EMPTY_DRAFT, type OnboardingDraft, type OnboardingStep } from './types';
import { ScreeningStep } from './ScreeningStep';
import { ModeChoiceStep } from './ModeChoiceStep';
import { ProfileStep } from './ProfileStep';
import { ResultStep } from './ResultStep';
import { MEDICAL_DISCLAIMER } from '@/content/legal';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('screening');
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY_DRAFT);
  const [screeningResult, setScreeningResult] = useState<ScreeningResult>({
    triggered: false,
    layers: [],
    gad2AtCutoff: false,
    foodConcernHigh: false,
  });
  const [saving, setSaving] = useState(false);

  const triggered = screeningResult.triggered;
  const p = draft.profile;

  // Зона из полей профиля. Считается ВСЕГДА — и в soft (F6): зона лежит в БД
  // невидимо, чтобы переключение в numeric на Today было мгновенным и не зависело
  // от пересчёта. В soft-UI она нигде не показывается. Вес: введённый или proxy.
  // Null только если полей не хватает.
  function computeProfileZone(): Zone | null {
    if (p.height === null || p.age === null || p.sex === null) return null;
    const weight = p.weight ?? proxyWeightFromHeight(p.height);
    return computeZone({
      height: p.height,
      weight,
      age: p.age,
      sex: p.sex,
    });
  }

  function handleScreeningComplete(answers: ScreeningAnswers) {
    setDraft((d) => ({ ...d, screening: answers }));
    setScreeningResult(scoreScreening(answers));
    setStep('mode');
  }

  async function handleFinish() {
    if (p.height === null || p.age === null || p.sex === null) return;
    setSaving(true);

    const zone = computeProfileZone() ?? undefined;
    const profile: UserProfile = {
      height: p.height,
      weight: p.weight,
      age: p.age,
      sex: p.sex,
      activity: p.activity,
      mode: draft.mode,
      screeningResult,
      screeningDate: new Date().toISOString(),
      webPushFollowupConsent: false,
      zone,
    };

    try {
      await getDB().userProfile.add(profile);
      router.replace('/today');
    } catch (err) {
      console.error('Не удалось сохранить профиль:', err);
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-8 pt-8">
      <div className="flex-1">
      {step === 'screening' && (
        <ScreeningStep onComplete={handleScreeningComplete} />
      )}

      {step === 'mode' && (
        <ModeChoiceStep
          triggered={triggered}
          value={draft.mode}
          onChange={(mode) => setDraft((d) => ({ ...d, mode }))}
          onNext={() => setStep('profile')}
          onBack={() => setStep('screening')}
        />
      )}

      {step === 'profile' && (
        <ProfileStep
          draft={p}
          mode={draft.mode}
          triggered={triggered}
          onChange={(profile) => setDraft((d) => ({ ...d, profile }))}
          onNext={() => setStep('result')}
          onBack={() => setStep('mode')}
        />
      )}

      {step === 'result' && (
        <ResultStep
          mode={draft.mode}
          triggered={triggered}
          zoneLabel={(() => {
            // Лейбл зоны на результате — только в numeric (в soft число скрыто).
            if (draft.mode !== 'numeric') return null;
            const z = computeProfileZone();
            return z ? formatZone(z) : null;
          })()}
          saving={saving}
          onFinish={handleFinish}
          onBack={() => setStep('profile')}
        />
      )}
      </div>

      {/* Дисклеймер виден при первом запуске на всех шагах онбординга (E7 AC #2). */}
      <p className="mt-8 text-[12px] leading-snug text-muted">{MEDICAL_DISCLAIMER}</p>
    </div>
  );
}
