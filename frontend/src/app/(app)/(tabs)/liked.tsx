import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ComponentType } from 'react';
import {
  Building2,
  ChevronRight,
  Heart,
  MapPin,
  MessageCircle,
  Star,
} from 'lucide-react-native';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/lib/theme';
import { formatAge, formatDistance, SPECIES_ICON } from '@/lib/format';
import { chatService } from '@/services/chat';
import { useFeedStore } from '@/store/feed';
import type { Animal } from '@/types/models';

const TAB_BAR_HEIGHT   = 72;
const TAB_BAR_MARGIN_B = 12;

// ─────────────────────────────────────────────
//  Screen
// ─────────────────────────────────────────────
export default function LikedScreen() {
  const liked  = useFeedStore((s) => s.liked);
  const insets = useSafeAreaInsets();

  const listPaddingBottom = insets.bottom + TAB_BAR_HEIGHT + TAB_BAR_MARGIN_B + Spacing[4];

  const openChat = async (animal: Animal) => {
    const { roomId } = await chatService.createRoom(animal.id, animal.shelterId);
    router.push(`/(app)/chat/${roomId}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={['top']}>
      {/* ── Header ─────────────────────────── */}
      <View className="flex-row items-end justify-between px-5 pb-3 pt-3">
        <View>
          <Text className="text-3xl font-extrabold tracking-tight text-stone-900">
            Favorites
          </Text>
          <Text className="mt-0.5 text-sm text-stone-400">
            Animals you've connected with
          </Text>
        </View>

        {liked.length > 0 && (
          <Animated.View
            entering={ZoomIn.springify().damping(14)}
            className="mb-0.5 items-center justify-center rounded-full bg-orange-100 px-3.5 py-1"
          >
            <Text className="text-sm font-bold text-orange-600">{liked.length}</Text>
          </Animated.View>
        )}
      </View>

      {/* ── List ───────────────────────────── */}
      <FlatList
        data={liked}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: listPaddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState
              title="No favorites yet"
              subtitle={"Swipe right on animals you love\nand they'll appear here"}
            />
          </View>
        }
        renderItem={({ item, index }) => (
          <LikedCard animal={item} index={index} onChat={() => openChat(item)} />
        )}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
//  LikedCard
// ─────────────────────────────────────────────
interface LikedCardProps {
  animal: Animal;
  index: number;
  onChat: () => void;
}

function LikedCard({ animal, index, onChat }: LikedCardProps) {
  const SpeciesIcon = SPECIES_ICON[animal.species];

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 65).springify().damping(18).stiffness(140)}
      style={styles.card}
    >
      {/* ── Info row ───────────────────────── */}
      <TouchableOpacity
        onPress={() => router.push(`/(app)/animal/${animal.id}`)}
        activeOpacity={0.88}
        style={styles.infoRow}
      >
        {/* Photo + species badge */}
        <View style={styles.photoWrap}>
          <Image
            source={{ uri: animal.primaryPhotoUrl }}
            style={styles.photo}
            contentFit="cover"
            transition={250}
          />
          <View style={styles.speciesBadge}>
            <SpeciesIcon size={18} color={Colors.neutral[500]} strokeWidth={1.8} />
          </View>
        </View>

        {/* Text info */}
        <View className="ml-4 flex-1">
          <Text className="text-lg font-bold text-stone-900" numberOfLines={1}>
            {animal.name}
          </Text>

          <Text className="mt-0.5 text-sm text-stone-500" numberOfLines={1}>
            {[animal.breed, formatAge(animal.ageMonths)].filter(Boolean).join(' · ')}
          </Text>

          <View className="mt-2 flex-row items-center gap-1">
            <Building2 size={12} color={Colors.neutral[400]} strokeWidth={1.8} />
            <Text className="flex-1 text-xs text-stone-400" numberOfLines={1}>
              {animal.shelterName}
            </Text>
            {animal.distanceKm != null && (
              <>
                <Text className="text-xs text-stone-300">·</Text>
                <MapPin size={11} color={Colors.neutral[400]} strokeWidth={1.8} />
                <Text className="text-xs text-stone-400">
                  {formatDistance(animal.distanceKm)}
                </Text>
              </>
            )}
          </View>
        </View>

        <ChevronRight size={16} color={Colors.neutral[300]} strokeWidth={2} />
      </TouchableOpacity>

      {/* ── Divider ────────────────────────── */}
      <View className="mx-4 h-px bg-stone-100" />

      {/* ── Action bar ─────────────────────── */}
      <View className="flex-row">
        <ActionCell
          icon={MessageCircle}
          label="Message"
          color={Colors.primary[500]}
          bgColor={Colors.primary[50]}
          onPress={onChat}
          showRightBorder
        />
        <ActionCell
          icon={Heart}
          label="Donate"
          color={Colors.error}
          bgColor="rgba(239,68,68,0.08)"
          onPress={() => {/* TODO: open donation flow */}}
          showRightBorder
        />
        <ActionCell
          icon={Star}
          label="Foster"
          color={Colors.warning}
          bgColor="rgba(234,179,8,0.08)"
          onPress={() => {/* TODO: open foster flow */}}
          showRightBorder
        />
        <ActionCell
          icon={MapPin}
          label="Visit"
          color={Colors.info}
          bgColor="rgba(59,130,246,0.08)"
          onPress={() => router.push(`/(app)/shelter/${animal.shelterId}`)}
        />
      </View>
    </Animated.View>
  );
}


interface ActionCellProps {
  icon: ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  label: string;
  color: string;
  bgColor: string;
  onPress: () => void;
  showRightBorder?: boolean;
}

function ActionCell({
  icon: Icon,
  label,
  color,
  bgColor,
  onPress,
  showRightBorder,
}: ActionCellProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.80, { damping: 14, stiffness: 340 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1.0, { damping: 14, stiffness: 340 });
      }}
      onPress={onPress}
      style={[styles.actionCell, showRightBorder && styles.actionCellBorder]}
    >
      <Animated.View style={[styles.actionCellInner, animStyle]}>
        <View style={[styles.actionIconCircle, { backgroundColor: bgColor }]}>
          <Icon size={17} color={color} strokeWidth={2} />
        </View>
        <Text style={[styles.actionLabel, { color }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[1],
    gap: Spacing[3],
  },
  emptyWrap: {
    marginTop: 48,
  },

  // ── Card
  card: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    ...Shadow.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
  },

  // ── Photo
  photoWrap: {
    position: 'relative',
  },
  photo: {
    width: 88,
    height: 88,
    borderRadius: Radius.xl,
  },
  speciesBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
    ...Shadow.sm,
  },

  // ── Action bar
  actionCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
  },
  actionCellBorder: {
    borderRightWidth: 1,
    borderRightColor: Colors.neutral[100],
  },
  actionCellInner: {
    alignItems: 'center',
    gap: Spacing[1],
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
});