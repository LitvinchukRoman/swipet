import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';

// ТЗ SC-DASH-001 (Фаза 3) — дашборд для ролі SHELTER_ADMIN:
// список тварин з quick stats, додавання тварини, аналітика, слоти.
// Поки заглушка.
export default function ShelterDashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <EmptyState
        emoji="📊"
        title="Дашборд притулку"
        subtitle="Статистика, анкети тварин та слоти візитів. Розділ у розробці."
      />
    </SafeAreaView>
  );
}
