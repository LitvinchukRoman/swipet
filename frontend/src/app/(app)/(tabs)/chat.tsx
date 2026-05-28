import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatMessageTime, SPECIES_EMOJI } from '@/lib/format';
import { chatService } from '@/services/chat';
import type { ChatRoom } from '@/types/models';

export default function ChatListScreen() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await chatService.getRooms();
    setRooms(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#FF6B6B" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <Text className="px-5 pb-3 pt-2 text-2xl font-extrabold text-gray-900">💬 Чати</Text>

      <FlatList
        data={rooms}
        keyExtractor={(item) => String(item.id)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View className="mt-24">
            <EmptyState
              emoji="📭"
              title="Немає розмов"
              subtitle="Напиши притулку зі сторінки вподобаної тваринки"
            />
          </View>
        }
        ItemSeparatorComponent={() => <View className="ml-20 h-px bg-gray-100" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(app)/chat/${item.id}`)}
            className="flex-row items-center px-4 py-3 active:bg-gray-100"
          >
            <Avatar
              uri={item.animal.primaryPhotoUrl}
              emoji={SPECIES_EMOJI[item.animal.species]}
              size={56}
            />
            <View className="ml-3 flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
                  {item.shelter.name}
                </Text>
                <Text className="text-xs text-gray-400">
                  {formatMessageTime(item.lastMessageAt)}
                </Text>
              </View>
              <Text className="text-xs text-primary">щодо {item.animal.name}</Text>
              <View className="mt-0.5 flex-row items-center justify-between">
                <Text className="flex-1 text-sm text-gray-500" numberOfLines={1}>
                  {item.lastMessage}
                </Text>
                {item.unreadCount > 0 ? (
                  <View className="ml-2 h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5">
                    <Text className="text-xs font-bold text-white">{item.unreadCount}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
