import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';

// ТЗ SC-DON-003 (Фаза 2) — список підопічних тварин з кнопкою відписки.
// Поки заглушка; реалізація разом з модулем донатів.
export default function GuardianshipScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <EmptyState
        title="Мої підопічні"
        subtitle="Тут з'являться тваринки під твоєю віртуальною опікою. Розділ у розробці."
      />
    </SafeAreaView>
  );
}
