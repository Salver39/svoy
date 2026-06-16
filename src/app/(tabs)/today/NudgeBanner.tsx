'use client';

// Adaptive nudge — мягкое приглашение в режим без чисел на Today (BACKLOG E8).
//
// MVP: shouldShowAdaptiveNudge() возвращает false (ADAPTIVE_NUDGE_ENABLED=false),
// поэтому баннер рендерит null — ничего не видно. Проводка на месте и
// протестирована: когда флаг включат на v1.1 (после калибровки + SAFETY-3),
// баннер заработает без изменений монтирования.
//
// Закон копи: приглашение, не давление; отказ без шейминга (content/nudge-copy).

import { useEffect, useState } from 'react';
import type { AppMode } from '@/db/schema';
import { getDB } from '@/db/client';
import { shouldShowAdaptiveNudge } from '@/lib/adaptive-nudge';
import { recordAdaptiveNudgeShown } from '@/lib/nudge-state';
import { recordModeSwitch } from '@/lib/events';
import {
  ADAPTIVE_NUDGE_TITLE,
  ADAPTIVE_NUDGE_BODY,
  ADAPTIVE_NUDGE_ACCEPT,
  ADAPTIVE_NUDGE_DISMISS,
} from '@/content/nudge-copy';

interface Props {
  profileId: number;
  /** Сообщить Today, что режим стал 'soft' (синхронизация шапки/чисел). */
  onSwitchToSoft: () => void;
}

export function NudgeBanner({ profileId, onSwitchToSoft }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    shouldShowAdaptiveNudge().then((due) => {
      if (!cancelled) setShow(due);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) return null;

  // Любой исход (принял/отложил) — лок на интервал: nudge не назойлив.
  async function accept() {
    await getDB().userProfile.update(profileId, { mode: 'soft' as AppMode });
    await recordModeSwitch('numeric', 'soft');
    await recordAdaptiveNudgeShown();
    setShow(false);
    onSwitchToSoft();
  }

  async function dismiss() {
    await recordAdaptiveNudgeShown();
    setShow(false);
  }

  return (
    <div className="mt-7 rounded-2xl bg-surface px-4 py-4">
      <p className="font-display text-[16px] leading-snug text-ink">{ADAPTIVE_NUDGE_TITLE}</p>
      <p className="mt-1.5 text-[13.5px] leading-snug text-muted">{ADAPTIVE_NUDGE_BODY}</p>
      <div className="mt-3.5 flex gap-2">
        <button
          type="button"
          onClick={accept}
          className="rounded-full bg-raised px-4 py-2 text-[13px] text-ink shadow-sm"
        >
          {ADAPTIVE_NUDGE_ACCEPT}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full px-4 py-2 text-[13px] text-muted"
        >
          {ADAPTIVE_NUDGE_DISMISS}
        </button>
      </div>
    </div>
  );
}
