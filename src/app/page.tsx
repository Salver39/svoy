import { redirect } from 'next/navigation';

// Главная отправляет на /today. Проверка наличия UserProfile — клиентская
// (IndexedDB недоступна на сервере), живёт в ProfileGuard внутри (tabs)/layout:
// нет профиля → редирект на /onboarding. Так root остаётся серверным redirect'ом
// без лишней клиентской логики.
export default function RootPage() {
  redirect('/today');
}
