import { router, useFocusEffect } from 'expo-router';
import { MessageCircle, RefreshCw } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated2, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatMessageTime, SPECIES_EMOJI } from '@/lib/format';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/lib/theme';
import { chatService } from '@/services/chat';
import type { ChatRoom } from '@/types/models';

// Динамічний маршрут кімнати чату — різний для застосунку та притулку.
type RoomPathname = '/(app)/chat/[id]' | '/(shelter)/chat/[id]';

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonRow() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.skeletonRow}>
      <Animated.View style={[styles.skeletonAvatar, { opacity: pulse }]} />
      <View style={styles.skeletonBody}>
        <Animated.View style={[styles.skeletonLine, { width: '55%', height: 14 }, { opacity: pulse }]} />
        <Animated.View style={[styles.skeletonLine, { width: '35%', height: 11, marginTop: 6 }, { opacity: pulse }]} />
        <Animated.View style={[styles.skeletonLine, { width: '70%', height: 11, marginTop: 4 }, { opacity: pulse }]} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ChatListView
// ─────────────────────────────────────────────────────────────────────────────
export function ChatListView({ roomPathname }: { roomPathname: RoomPathname }) {
  const [rooms,      setRooms]      = useState<ChatRoom[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await chatService.getRooms();
      setRooms(data);
    } catch {
      // keep empty list
    } finally {
      setLoading(false);
    }
  }, []);

  // Оновлюємо список при кожному поверненні на екран (напр. після виходу з чату),
  // інакше lastMessage / unreadCount лишаються stale.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const totalUnread = rooms.reduce((s, r) => s + (r.unreadCount ?? 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Messages</Text>
            {totalUnread > 0 && (
              <Animated2.View
                entering={ZoomIn.springify().damping(14)}
                style={styles.unreadBubble}
              >
                <Text style={styles.unreadBubbleText}>{totalUnread}</Text>
              </Animated2.View>
            )}
          </View>
          <Text style={styles.headerSub}>
            {rooms.length > 0
              ? `${rooms.length} conversation${rooms.length === 1 ? '' : 's'}`
              : 'Your shelter conversations'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onRefresh}
          style={styles.refreshBtn}
          activeOpacity={0.7}
        >
          <RefreshCw
            size={17}
            color={refreshing ? Colors.primary[500] : Colors.neutral[400]}
            strokeWidth={2.2}
          />
        </TouchableOpacity>
      </View>

      {/* ── Content ─────────────────────────────────────── */}
      {loading ? (
        <View style={styles.skeletonWrap}>
          {[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => String(item.id)}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <MessageCircle size={40} color={Colors.primary[300]} strokeWidth={1.5} />
              </View>
              <EmptyState
                title="All quiet here"
                subtitle={"Messages will appear when\nsomeone reaches out about an animal"}
              />
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated2.View entering={FadeInDown.delay(index * 55).springify().damping(18)}>
              <ChatRow room={item} roomPathname={roomPathname} />
            </Animated2.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ChatRow
// ─────────────────────────────────────────────────────────────────────────────
function ChatRow({ room, roomPathname }: { room: ChatRoom; roomPathname: RoomPathname }) {
  const hasUnread = room.unreadCount > 0;
  const scale     = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, damping: 14, stiffness: 300 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, damping: 14, stiffness: 300 }).start();

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: roomPathname,
          params: {
            id:          room.id,
            shelterName: room.shelter.name,
            animalName:  room.animal.name,
          },
        })
      }
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View style={[styles.row, { transform: [{ scale }] }, hasUnread && styles.rowUnread]}>

        {/* Avatar + unread dot */}
        <View style={styles.avatarWrap}>
          <Avatar
            uri={room.animal.primaryPhotoUrl}
            emoji={SPECIES_EMOJI[room.animal.species]}
            size={56}
          />
          {hasUnread && <View style={styles.onlineDot} />}
        </View>

        {/* Body */}
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={[styles.shelterName, hasUnread && styles.shelterNameUnread]} numberOfLines={1}>
              {room.shelter.name}
            </Text>
            <Text style={[styles.time, hasUnread && styles.timeUnread]}>
              {formatMessageTime(room.lastMessageAt)}
            </Text>
          </View>

          <Text style={styles.animalTag} numberOfLines={1}>
            about {room.animal.name}
          </Text>

          <View style={styles.rowBottom}>
            <Text
              style={[styles.preview, hasUnread && styles.previewUnread]}
              numberOfLines={1}
            >
              {room.lastMessage ?? 'No messages yet'}
            </Text>

            {hasUnread && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{room.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[4],
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  headerTitle: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.neutral[900],
    letterSpacing: -0.6,
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: Colors.neutral[400],
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  unreadBubble: {
    backgroundColor: Colors.primary[500],
    borderRadius: Radius.full,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  unreadBubbleText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.neutral[0],
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Skeleton
  skeletonWrap: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[3],
    paddingTop: Spacing[1],
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius['2xl'],
    padding: Spacing[4],
    gap: Spacing[3],
    ...Shadow.sm,
  },
  skeletonAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.neutral[200],
  },
  skeletonBody: { flex: 1 },
  skeletonLine: {
    borderRadius: 6,
    backgroundColor: Colors.neutral[200],
  },

  // ── List
  listContent: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[20],
    paddingTop: Spacing[1],
  },
  separator: { height: Spacing[3] },
  emptyWrap: { marginTop: Spacing[12], alignItems: 'center' },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },

  // ── Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius['2xl'],
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    ...Shadow.sm,
  },
  rowUnread: {
    borderColor: Colors.primary[100],
    backgroundColor: Colors.primary[50],
  },
  avatarWrap: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: Colors.primary[500],
    borderWidth: 2,
    borderColor: Colors.neutral[0],
  },
  rowBody: {
    flex: 1,
    marginLeft: Spacing[3],
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shelterName: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.neutral[700],
  },
  shelterNameUnread: {
    fontWeight: FontWeight.bold,
    color: Colors.neutral[900],
  },
  time: {
    fontSize: FontSize.xs,
    color: Colors.neutral[400],
    marginLeft: Spacing[2],
  },
  timeUnread: {
    color: Colors.primary[500],
    fontWeight: FontWeight.semibold,
  },
  animalTag: {
    fontSize: FontSize.sm,
    color: Colors.primary[500],
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  preview: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.neutral[400],
  },
  previewUnread: {
    color: Colors.neutral[700],
    fontWeight: FontWeight.medium,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: Spacing[2],
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.neutral[0],
  },
});