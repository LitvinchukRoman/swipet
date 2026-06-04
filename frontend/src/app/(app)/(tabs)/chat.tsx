import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatMessageTime, SPECIES_EMOJI } from '@/lib/format';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/lib/theme';
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Повідомлення</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => String(item.id)}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyState
                title="Поки що тихо"
                subtitle={'Напиши притулку зі сторінки\nвподобаної тваринки'}
              />
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(18)}>
              <ChatRow room={item} />
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function ChatRow({ room }: { room: ChatRoom }) {
  const hasUnread = room.unreadCount > 0;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/chat/${room.id}`)}
      activeOpacity={0.7}
      style={styles.row}
    >
      <Avatar
        uri={room.animal.primaryPhotoUrl}
        emoji={SPECIES_EMOJI[room.animal.species]}
        size={56}
      />

      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.shelterName} numberOfLines={1}>
            {room.shelter.name}
          </Text>
          <Text style={[styles.time, hasUnread && styles.timeUnread]}>
            {formatMessageTime(room.lastMessageAt)}
          </Text>
        </View>

        <Text style={styles.animalTag} numberOfLines={1}>
          щодо {room.animal.name}
        </Text>

        <View style={styles.rowBottom}>
          <Text
            style={[styles.preview, hasUnread && styles.previewUnread]}
            numberOfLines={1}
          >
            {room.lastMessage ?? 'Немає повідомлень'}
          </Text>
          {hasUnread ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{room.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutral[50] },
  title: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.neutral[900],
    letterSpacing: -0.6,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[3],
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: Spacing[4], paddingBottom: Spacing[20] },
  separator: { height: Spacing[2] },
  emptyWrap: { marginTop: Spacing[16] },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius['2xl'],
    padding: Spacing[3],
    ...Shadow.sm,
  },
  rowBody: { flex: 1, marginLeft: Spacing[3] },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shelterName: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.neutral[900],
  },
  time: { fontSize: FontSize.xs, color: Colors.neutral[400], marginLeft: Spacing[2] },
  timeUnread: { color: Colors.primary[500], fontWeight: FontWeight.semibold },
  animalTag: {
    fontSize: FontSize.xs,
    color: Colors.primary[500],
    fontWeight: FontWeight.medium,
    marginTop: 1,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  preview: { flex: 1, fontSize: FontSize.sm, color: Colors.neutral[500] },
  previewUnread: { color: Colors.neutral[800], fontWeight: FontWeight.medium },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: Spacing[2],
  },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.neutral[0] },
});
