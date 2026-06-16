import { ProfileGuard } from '@/components/ProfileGuard';

// Онбординг живёт ВНЕ route group (tabs) — без нижнего TabBar.
// ProfileGuard mode='forbid' — если профиль уже есть, повторно онбординг
// не проходим, уводим на /today.

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProfileGuard mode="forbid">{children}</ProfileGuard>;
}
