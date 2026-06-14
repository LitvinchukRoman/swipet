import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Cat,
  Dog,
  Heart,
  MapPin,
  Mars,
  MessageCircle,
  PawPrint,
  Rabbit,
  Ruler,
  Share2,
  ShieldCheck,
  Sparkles,
  Venus,
  House,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import {
  formatAge,
  formatDistance,
  GENDER_LABEL,
  SIZE_LABEL,
  SPECIES_LABEL,
} from '@/lib/format';
import type { Species } from '@/types/models';
import { animalService } from '@/services/animal';
import { chatService } from '@/services/chat';
import { notify } from '@/lib/notify';
import { useFeedStore } from '@/store/feed';
import { Colors, Duration, Radius, Shadow, Spacing } from '@/lib/theme';
import type { Animal } from '@/types/models';
import { DonationSheet } from '@/components/common/DonationSheet';

import { Layout } from '@/lib/theme';

// ─── helpers ─────────────────────────────────────────────────────────────────

function useFadeSlide(delay = 0, fromY = 20) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(fromY)).current;
  const run = () =>
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: Duration.slow, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(translateY, { toValue: 0, duration: Duration.slow, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
  return { anim: { opacity, transform: [{ translateY }] }, run };
}

function useSpringPop() {
  const scale = useRef(new Animated.Value(1)).current;
  const pop = () =>
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.18, useNativeDriver: true, damping: 4, stiffness: 300 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, damping: 10, stiffness: 200 }),
    ]).start();
  return { scaleStyle: { transform: [{ scale }] }, pop };
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({
  label,
  icon,
  tone = 'default',
}: {
  label: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'success' | 'orange';
}) {
  const bg    = tone === 'success' ? '#F0FDF4' : tone === 'orange' ? Colors.primary[50]  : Colors.neutral[100];
  const color = tone === 'success' ? Colors.success : tone === 'orange' ? Colors.primary[500] : Colors.neutral[600];

  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: bg, borderRadius: Radius.full,
        paddingHorizontal: Spacing[3], paddingVertical: 6,
      }}
    >
      {icon}
      <Text style={{ fontSize: 12, fontWeight: '600', color }}>{label}</Text>
    </View>
  );
}

// ─── Species icon map ─────────────────────────────────────────────────────────
const SPECIES_ICON: Record<
  Species,
  ComponentType<{ size: number; color: string; strokeWidth?: number }>
> = {
  DOG:    Dog,
  CAT:    Cat,
  RABBIT: Rabbit,
  OTHER:  PawPrint,
};

// ─── Stat tile ────────────────────────────────────────────────────────────────
function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View
      className="flex-1 items-center py-3 rounded-2xl"
      style={{ backgroundColor: Colors.neutral[50], gap: 4 }}
    >
      {icon}
      <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.neutral[800] }}>{value}</Text>
      <Text style={{ fontSize: 11, color: Colors.neutral[400] }}>{label}</Text>
    </View>
  );
}

// ─── Heart button ─────────────────────────────────────────────────────────────
// Контрольований: стан лайку та персист — у власника (екран ↔ feed store),
// тож лайк зберігається на бекенді (свайп RIGHT), а не губиться у локальному useState.
function HeartButton({
  liked,
  onToggle,
  size = 44,
  darkMode = false,
}: {
  liked: boolean;
  onToggle: () => void;
  size?: number;
  darkMode?: boolean;
}) {
  const scale  = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(liked ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(bgAnim, { toValue: liked ? 1 : 0, duration: Duration.normal, useNativeDriver: false }).start();
  }, [liked]);

  const toggle = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.22, useNativeDriver: true, damping: 4, stiffness: 300 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, damping: 10, stiffness: 200 }),
    ]).start();
    onToggle();
  };

  const bg = bgAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: darkMode
      ? ['rgba(0,0,0,0.35)', 'rgba(239,68,68,0.55)']
      : ['#F5F5F4',          '#FEE2E2'],
  });

  return (
    <Pressable onPress={toggle} hitSlop={8}>
      <Animated.View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Heart
            size={size * 0.5}
            color={liked ? '#EF4444' : (darkMode ? '#fff' : Colors.neutral[400])}
            fill={liked ? '#EF4444' : 'transparent'}
            strokeWidth={1.8}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Photo carousel ───────────────────────────────────────────────────────────
function PhotoCarousel({ photos, width, height }: { photos: string[], width: number, height: number }) {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const listRef = useRef<FlatList>(null);

  const onScroll = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) {
      setIndex(i);
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.7, duration: 80,  useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1,   duration: 160, useNativeDriver: true }),
      ]).start();
    }
  };

  const goLeft = () => {
    if (index > 0) {
      listRef.current?.scrollToIndex({ index: index - 1, animated: true });
      setIndex(index - 1);
    }
  };

  const goRight = () => {
    if (index < photos.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      setIndex(index + 1);
    }
  };

  return (
    <View style={{ width, height, position: 'relative' }}>
      <FlatList
        ref={listRef}
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={onScroll}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        style={{ width, height }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width, height }}
            contentFit="cover"
            transition={300}
          />
        )}
      />

      {photos.length > 1 && (
        <Animated.View
          style={{
            position: 'absolute', bottom: 18, left: 0, right: 0,
            flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
            gap: 6, opacity: fadeAnim, zIndex: 10,
          }}
          pointerEvents="none"
        >
          {photos.map((_, i) => (
            <View
              key={i}
              style={{
                height: 6, borderRadius: 3,
                width: i === index ? 22 : 6,
                backgroundColor: i === index ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
              }}
            />
          ))}
        </Animated.View>
      )}

      {photos.length > 1 && (
        <View
          style={{
            position: 'absolute', bottom: 42, right: 16,
            backgroundColor: 'rgba(0,0,0,0.45)',
            paddingHorizontal: 10, paddingVertical: 4,
            borderRadius: Radius.full, zIndex: 10,
          }}
          pointerEvents="none"
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
            {index + 1} / {photos.length}
          </Text>
        </View>
      )}

      {photos.length > 1 && Platform.OS === 'web' && index > 0 && (
        <Pressable
          onPress={goLeft}
          style={{ position: 'absolute', left: 16, top: height / 2 - 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
        >
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
      )}

      {photos.length > 1 && Platform.OS === 'web' && index < photos.length - 1 && (
        <Pressable
          onPress={goRight}
          style={{ position: 'absolute', right: 16, top: height / 2 - 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
        >
          <ChevronRight size={24} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ label }: { label: string }) {
  return (
    <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.neutral[900], marginBottom: Spacing[3] }}>
      {label}
    </Text>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────
function ActionBtn({
  label,
  icon,
  variant = 'primary',
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'outline';
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, damping: 10 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, damping: 10 }).start();
  const isPrimary = variant === 'primary';

  return (
    <Pressable onPress={onPress} onPressIn={onIn} onPressOut={onOut} style={{ flex: 1 }}>
      <Animated.View
        style={[
          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2], height: 52, borderRadius: Radius.lg, transform: [{ scale }] },
          isPrimary
            ? { backgroundColor: Colors.primary[500], ...Shadow.orange }
            : { backgroundColor: Colors.neutral[0], borderWidth: 1.5, borderColor: Colors.neutral[200], ...Shadow.sm },
        ]}
      >
        {icon}
        <Text style={{ fontSize: 14, fontWeight: '700', color: isPrimary ? Colors.neutral[0] : Colors.neutral[700] }}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function SkeletonBlock({ h, w = '100%', radius = 12 }: { h: number; w?: any; radius?: number }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ height: h, width: w, borderRadius: radius, backgroundColor: Colors.neutral[200], opacity: anim }} />
  );
}

function LoadingSkeleton({ height }: { height: number }) {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[0] }}>
      <SkeletonBlock h={height} radius={0} />
      <View style={{ padding: Spacing[6], gap: Spacing[4] }}>
        <SkeletonBlock h={32} w="60%" />
        <SkeletonBlock h={18} w="40%" />
        <View style={{ flexDirection: 'row', gap: Spacing[2] }}>
          <SkeletonBlock h={32} w={80} radius={Radius.full} />
          <SkeletonBlock h={32} w={100} radius={Radius.full} />
        </View>
        <SkeletonBlock h={80} />
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AnimalDetailScreen() {
  const { width: windowWidth } = Dimensions.get('window');
  const isWeb = Platform.OS === 'web';
  const contentWidth = isWeb ? Math.min(windowWidth, Layout.maxContentWidth) : windowWidth;
  const photoHeight = contentWidth * 1.05;

  const { id } = useLocalSearchParams<{ id: string }>();
  const [animal,          setAnimal]          = useState<Animal | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [donationVisible, setDonationVisible] = useState(false);

  const liked        = useFeedStore((s) => s.liked);
  const likeAnimal   = useFeedStore((s) => s.likeAnimal);
  const unlikeAnimal = useFeedStore((s) => s.unlikeAnimal);
  const isLiked      = !!animal && liked.some((a) => a.id === animal.id);

  const toggleLike = () => {
    if (!animal) return;
    if (isLiked) unlikeAnimal(animal.id);
    else likeAnimal(animal);
  };

  const header  = useFadeSlide(0);
  const stats   = useFadeSlide(80);
  const about   = useFadeSlide(160);
  const shelter = useFadeSlide(240);
  const actions = useFadeSlide(320);

  useEffect(() => {
    animalService
      .getById(Number(id))
      .then(a => {
        setAnimal(a);
        setTimeout(() => {
          header.run(); stats.run(); about.run(); shelter.run(); actions.run();
        }, 50);
      })
      .catch(() => setAnimal(null))
      .finally(() => setLoading(false));
  }, [id]);

  // ── openChat — передає shelterName і animalName як params ─────────────────
  const openChat = async () => {
    if (!animal) return;
    if (!animal.shelterId) {
      notify('Chat unavailable', 'This animal has no linked shelter yet.');
      return;
    }
    try {
      const { roomId } = await chatService.createRoom(animal.id, animal.shelterId);
      router.push({
        pathname: '/(app)/chat/[id]',
        params: {
          id: String(roomId),
          shelterName: animal.shelterName,
          animalName:  animal.name,
        },
      });
    } catch {
      notify('Could not open chat', 'Please try again in a moment.');
    }
  };

  const openBooking = () => {
    if (!animal) return;
    router.push({
      pathname: '/(app)/booking/[shelterId]',
      params: {
        shelterId:   String(animal.shelterId),
        shelterName: animal.shelterName ?? '',
        animalName:  animal.name,
      },
    });
  };

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[0], alignItems: isWeb ? 'center' : undefined }}>
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? Layout.maxContentWidth : undefined }}>
        <LoadingSkeleton height={photoHeight} />
      </View>
    </View>
  );

  if (!animal) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.neutral[0], alignItems: isWeb ? 'center' : undefined }}>
        <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? Layout.maxContentWidth : undefined }}>
          <EmptyState title="Animal not found" />
        </View>
      </SafeAreaView>
    );
  }

  const photos = animal.photos?.length ? animal.photos.map((p) => p.url) : [animal.primaryPhotoUrl ?? ''];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[0], alignItems: isWeb ? 'center' : undefined }}>
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? Layout.maxContentWidth : undefined, position: 'relative' }}>
        <ScrollView showsVerticalScrollIndicator={false} bounces>

          {/* ── Photo carousel ──────────────────────────── */}
          <View>
            <PhotoCarousel photos={photos} width={contentWidth} height={photoHeight} />

          <SafeAreaView
            edges={['top']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
            pointerEvents="box-none"
          >
            <View
              className="flex-row items-center justify-between px-4 pt-2"
              pointerEvents="box-none"
            >
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => ({
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: pressed ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.35)',
                  alignItems: 'center', justifyContent: 'center',
                })}
              >
                <ArrowLeft size={20} color="#fff" strokeWidth={2} />
              </Pressable>

              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Pressable
                  style={({ pressed }) => ({
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: pressed ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.35)',
                    alignItems: 'center', justifyContent: 'center',
                  })}
                >
                  <Share2 size={18} color="#fff" strokeWidth={2} />
                </Pressable>
                <HeartButton size={40} darkMode liked={isLiked} onToggle={toggleLike} />
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* ── Content card ────────────────────────────── */}
        <View
          style={{
            backgroundColor: Colors.neutral[0],
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            marginTop: -28,
            paddingTop: Spacing[6], paddingHorizontal: Spacing[5], paddingBottom: Spacing[6],
          }}
        >
          {/* ── Name + species row ─────────────────────── */}
          <Animated.View style={header.anim}>
            <View className="flex-row items-start justify-between">
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 30, fontWeight: '800', color: Colors.neutral[900], letterSpacing: -0.5 }}>
                  {animal.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                  {(() => { const Icon = SPECIES_ICON[animal.species]; return <Icon size={20} color={Colors.neutral[400]} strokeWidth={1.8} />; })()}
                  <Text style={{ fontSize: 18, color: Colors.neutral[400] }}>
                    {animal.breed ?? SPECIES_LABEL[animal.species]}
                  </Text>
                  <Text style={{ fontSize: 18, color: Colors.neutral[300] }}>·</Text>
                  {animal.gender === 'MALE'
                    ? <Mars  size={20} color={Colors.neutral[400]} strokeWidth={1.8} />
                    : <Venus size={20} color={Colors.neutral[400]} strokeWidth={1.8} />
                  }
                  <Text style={{ fontSize: 18, color: Colors.neutral[400] }}>
                    {GENDER_LABEL[animal.gender]}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: Colors.primary[50],
                  paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
                  borderRadius: Radius.lg, alignItems: 'center',
                }}
              >
                <Calendar size={16} color={Colors.primary[500]} strokeWidth={1.8} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.primary[500], marginTop: 2 }}>
                  {formatAge(animal.ageMonths)}
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2 mt-4">
              <Badge label={SIZE_LABEL[animal.size]} icon={<Ruler size={14} color={Colors.neutral[500]} strokeWidth={1.8} />} />
              {animal.isVaccinated && (
                <Badge label="Vaccinated" icon={<ShieldCheck size={14} color={Colors.success} strokeWidth={1.8} />} tone="success" />
              )}
              {animal.isSterilized && (
                <Badge label="Neutered" icon={<Sparkles size={14} color={Colors.primary[500]} strokeWidth={1.8} />} tone="orange" />
              )}
            </View>
          </Animated.View>

          {/* ── Stats row ──────────────────────────────── */}
          <Animated.View style={[{ flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[5] }, stats.anim]}>
            <StatTile
              icon={(() => { const Icon = SPECIES_ICON[animal.species]; return <Icon size={20} color={Colors.primary[500]} strokeWidth={1.8} />; })()}
              label="Species"
              value={SPECIES_LABEL[animal.species]}
            />
            <StatTile
              icon={<Ruler size={20} color={Colors.primary[500]} strokeWidth={1.8} />}
              label="Size"
              value={SIZE_LABEL[animal.size]}
            />
            <StatTile
              icon={animal.gender === 'MALE'
                ? <Mars  size={20} color={Colors.primary[500]} strokeWidth={1.8} />
                : <Venus size={20} color={Colors.primary[500]} strokeWidth={1.8} />
              }
              label="Gender"
              value={GENDER_LABEL[animal.gender]}
            />
          </Animated.View>

          <View style={{ height: 1, backgroundColor: Colors.neutral[100], marginVertical: Spacing[6] }} />

          {/* ── About ─────────────────────────────────── */}
          {animal.description ? (
            <Animated.View style={about.anim}>
              <SectionHeading label="About me" />
              <Text style={{ fontSize: 15, color: Colors.neutral[500], lineHeight: 24 }}>
                {animal.description}
              </Text>
              <View style={{ height: 1, backgroundColor: Colors.neutral[100], marginVertical: Spacing[6] }} />
            </Animated.View>
          ) : null}

          {/* ── Shelter card ──────────────────────────── */}
          <Animated.View style={shelter.anim}>
            <SectionHeading label="Shelter" />
            <Pressable
              onPress={() => router.push(`/(app)/shelter/${animal.shelterId}`)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? Colors.neutral[100] : Colors.neutral[50],
                borderRadius: Radius.xl,
                padding: Spacing[4],
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing[3],
                borderWidth: 1,
                borderColor: Colors.neutral[150],
              })}
            >
              <View
                style={{
                  width: 48, height: 48, borderRadius: 16,
                  backgroundColor: Colors.primary[100],
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <House size={26} color={Colors.primary[500]} strokeWidth={1.8} />
              </View>

              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.neutral[900] }}>
                  {animal.shelterName}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MapPin size={14} color={Colors.neutral[400]} strokeWidth={1.8} />
                  <Text style={{ fontSize: 12, color: Colors.neutral[400] }}>
                    {formatDistance(animal.distanceKm)} away
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 18, color: Colors.neutral[300] }}>›</Text>
            </Pressable>
          </Animated.View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* ── Fixed bottom action bar ──────────────────── */}
      <Animated.View style={actions.anim}>
        <SafeAreaView
          edges={['bottom']}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            backgroundColor: Colors.neutral[0],
            borderTopWidth: 1, borderTopColor: Colors.neutral[100],
            ...Shadow.md,
          }}
        >
          <View
            style={{
              flexDirection: 'row', gap: Spacing[2],
              paddingHorizontal: Spacing[4], paddingTop: Spacing[3], paddingBottom: Spacing[2],
            }}
          >
            <ActionBtn
              label="Support"
              variant="outline"
              icon={<Heart size={16} color={Colors.primary[500]} strokeWidth={1.8} />}
              onPress={() => setDonationVisible(true)}
            />
            <ActionBtn
              label="Message"
              variant="primary"
              icon={<MessageCircle size={16} color={Colors.neutral[0]} strokeWidth={1.8} />}
              onPress={openChat}
            />
            <ActionBtn
              label="Book Visit"
              variant="outline"
              icon={<CalendarDays size={16} color={Colors.primary[500]} strokeWidth={1.8} />}
              onPress={openBooking}
            />
          </View>
        </SafeAreaView>
      </Animated.View>

        {animal && (
          <DonationSheet
            visible={donationVisible}
            onClose={() => setDonationVisible(false)}
            animalId={animal.id}
            animalName={animal.name}
            shelterId={animal.shelterId}
          />
        )}
      </View>
    </View>
  );
}