import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { Tag } from '@/components/ui/Tag';
import { formatAge, SPECIES_EMOJI } from '@/lib/format';
import { chatService } from '@/services/chat';
import { useFeedStore } from '@/store/feed';
import type { Animal } from '@/types/models';

export default function LikedScreen() {
  const liked = useFeedStore((s) => s.liked);

  const openChat = async (animal: Animal) => {
    const { roomId } = await chatService.createRoom(animal.id, animal.shelterId);
    router.push(`/(app)/chat/${roomId}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <Text className="px-5 pb-3 pt-2 text-2xl font-extrabold text-gray-900">
        ❤️ Вподобані
      </Text>

      <FlatList
        data={liked}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 14 }}
        ListEmptyComponent={
          <View className="mt-24">
            <EmptyState
              emoji="💔"
              title="Поки порожньо"
              subtitle="Свайпай вправо тваринок у стрічці — вони з'являться тут"
            />
          </View>
        }
        renderItem={({ item }) => (
          <LikedCard animal={item} onChat={() => openChat(item)} />
        )}
      />
    </SafeAreaView>
  );
}

function LikedCard({ animal, onChat }: { animal: Animal; onChat: () => void }) {
  return (
    <View className="overflow-hidden rounded-3xl bg-white shadow-sm">
      <Pressable
        onPress={() => router.push(`/(app)/animal/${animal.id}`)}
        className="flex-row p-3 active:opacity-80"
      >
        <Image
          source={{ uri: animal.primaryPhotoUrl }}
          style={{ width: 88, height: 88, borderRadius: 18 }}
          contentFit="cover"
          transition={200}
        />
        <View className="ml-3 flex-1 justify-center">
          <Text className="text-lg font-bold text-gray-900">
            {SPECIES_EMOJI[animal.species]} {animal.name}
          </Text>
          <Text className="text-sm text-gray-500">{formatAge(animal.ageMonths)}</Text>
          <View className="mt-2 flex-row">
            <Tag label={animal.shelterName} icon="🏠" />
          </View>
        </View>
      </Pressable>

      {/* Дії */}
      <View className="flex-row border-t border-gray-100">
        <ActionCell emoji="✉️" label="Написати" primary onPress={onChat} />
        <ActionCell emoji="💰" label="Донат" onPress={() => {}} />
        <ActionCell emoji="🌟" label="Опіка" onPress={() => {}} />
        <ActionCell emoji="🤝" label="Візит" onPress={() => router.push(`/(app)/shelter/${animal.shelterId}`)} />
      </View>
    </View>
  );
}

function ActionCell({
  emoji,
  label,
  onPress,
  primary,
}: {
  emoji: string;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center gap-0.5 border-r border-gray-100 py-3 active:bg-gray-50"
    >
      <Text className="text-lg">{emoji}</Text>
      <Text className={`text-xs font-medium ${primary ? 'text-primary' : 'text-gray-600'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
