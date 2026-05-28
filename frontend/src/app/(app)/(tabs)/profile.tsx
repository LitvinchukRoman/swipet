import { router } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/store/auth';

const ROLE_LABEL: Record<string, string> = {
  USER: 'Усиновлювач',
  SHELTER_ADMIN: 'Адміністратор притулку',
  ADMIN: 'Адміністратор',
};

export default function ProfileScreen() {
  const { user, refreshToken, clearAuth } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Вихід', 'Точно вийти з акаунту?', [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Вийти',
        style: 'destructive',
        onPress: async () => {
          try {
            if (refreshToken) await authService.logout(refreshToken);
          } finally {
            await clearAuth();
            router.replace('/(auth)/login');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Хедер профілю */}
      <View className="items-center px-5 pb-6 pt-8">
        <Avatar uri={user?.avatarUrl} name={user?.fullName} size={96} />
        <Text className="mt-3 text-2xl font-extrabold text-gray-900">{user?.fullName}</Text>
        <Text className="text-sm text-gray-500">{user?.email}</Text>
        <View className="mt-2 rounded-full bg-primary/10 px-3 py-1">
          <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
            {ROLE_LABEL[user?.role ?? 'USER'] ?? user?.role}
          </Text>
        </View>
      </View>

      {/* Пункти меню */}
      <View className="mx-4 overflow-hidden rounded-2xl bg-white">
        <MenuRow emoji="✏️" label="Редагувати профіль" onPress={() => router.push('/(app)/profile/edit')} />
        <MenuRow emoji="🌟" label="Мої підопічні" onPress={() => router.push('/(app)/guardianship')} />
        <MenuRow emoji="❤️" label="Вподобані" onPress={() => router.push('/(app)/(tabs)/liked')} last />
      </View>

      {user?.role === 'SHELTER_ADMIN' ? (
        <View className="mx-4 mt-4 overflow-hidden rounded-2xl bg-white">
          <MenuRow emoji="📊" label="Дашборд притулку" onPress={() => router.push('/(app)/shelter/dashboard')} last />
        </View>
      ) : null}

      <View className="mt-auto px-5 pb-4">
        <Button label="Вийти" variant="outline" onPress={handleLogout} />
      </View>
    </SafeAreaView>
  );
}

function MenuRow({
  emoji,
  label,
  onPress,
  last,
}: {
  emoji: string;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-4 active:bg-gray-50 ${last ? '' : 'border-b border-gray-100'}`}
    >
      <Text className="text-lg">{emoji}</Text>
      <Text className="ml-3 flex-1 text-base text-gray-800">{label}</Text>
      <Text className="text-gray-300">›</Text>
    </Pressable>
  );
}
