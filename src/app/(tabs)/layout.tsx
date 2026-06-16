import { TabBar } from '@/components/TabBar';
import { ProfileGuard } from '@/components/ProfileGuard';
import { AnxietyButton } from './mood/AnxietyButton';
import { AppOpenTracker } from './AppOpenTracker';

// Shared layout для 4 основных табов. Онбординг и другие потоки без TabBar
// рендерятся вне этой route group и нижний бар не видят.
//
// ProfileGuard mode='require' — дверь в один конец: без пройденного онбординга
// (нет UserProfile в IndexedDB) ни один таб не показывается, уводим на /onboarding.
//
// AnxietyButton монтируется здесь один раз и сам показывается только на
// Today/Diary (self-gate по маршруту) — глобальная дверь поддержки (E6 AC #2).

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProfileGuard mode="require">
      <div className="flex min-h-dvh flex-col">
        <AppOpenTracker />
        <main className="flex-1">{children}</main>
        <AnxietyButton />
        <TabBar />
      </div>
    </ProfileGuard>
  );
}
