// Настройки (BACKLOG E7 MVP-cut): ресурсы поддержки + экспорт данных +
// дисклеймер. Режим переключается на Today, профиль-редактор и Web Push opt-in —
// вне E7 MVP (E8). Страница серверная; ExportButton — клиентский остров.

import { ResourcesCard } from '@/components/ResourcesCard';
import { ExportButton } from './ExportButton';
import { MEDICAL_DISCLAIMER } from '@/content/legal';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-md px-6 pb-8 pt-8">
      <h1 className="text-[20px] font-semibold text-ink">Настройки</h1>

      <section className="mt-8">
        <h2 className="text-[13px] text-muted">Поддержка</h2>
        <div className="mt-3">
          <ResourcesCard />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[13px] text-muted">Мои данные</h2>
        <p className="mt-2 text-[14px] text-muted">
          Данные хранятся только на этом устройстве. Можно скачать копию.
        </p>
        <div className="mt-3">
          <ExportButton />
        </div>
      </section>

      <p className="mt-10 text-[12px] leading-snug text-muted">{MEDICAL_DISCLAIMER}</p>
    </div>
  );
}
