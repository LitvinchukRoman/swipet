import { Text, View } from 'react-native';

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
}

/** Заглушка для порожніх списків / кінця стрічки. */
export function EmptyState({ emoji, title, subtitle }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-10">
      <Text className="text-6xl">{emoji}</Text>
      <Text className="mt-4 text-center text-xl font-bold text-gray-800">{title}</Text>
      {subtitle ? (
        <Text className="mt-2 text-center text-base text-gray-500">{subtitle}</Text>
      ) : null}
    </View>
  );
}
