import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ComponentType, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CalendarDays,
  Cat,
  CheckCircle2,
  Dog,
  ExternalLink,
  Globe,
  MapPin,
  PawPrint,
  Phone,
  Rabbit,
  Share2,
  Star,
  Users,
} from 'lucide-react-native';

import { Avatar } from '@/components/ui/Avatar';
import { NoPhotoPlaceholder } from '@/components/ui/NoPhotoPlaceholder';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatAge } from '@/lib/format';
import { Colors, Duration, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/lib/theme';
import { animalService } from '@/services/animal';
import { chatService } from '@/services/chat';
import { notify } from '@/lib/notify';
import type { Animal, Shelter, Species } from '@/types/models';

// ─── Species icon map ─────────────────────────────────────────────────────────
export const SPECIES_ICON: Record<
  Species,
  ComponentType<{ size: number; color: string; strokeWidth?: number }>
> = {
  DOG:    Dog,
  CAT:    Cat,
  RABBIT: Rabbit,
  OTHER:  PawPrint,
};

// ─── Constants ────────────────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');
const HEADER_H   = 280;
const AVATAR_SIZE = 88;

// ─────────────────────────────────────────────────────────────────────────────
//  Action Button — reusable animated dual-variant CTA component
// ─────────────────────────────────────────────────────────────────────────────
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
          {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: Spacing[2], height: 52, borderRadius: Radius.lg,
            transform: [{ scale }],
          },
          isPrimary
            ? { backgroundColor: Colors.primary[500], ...Shadow.orange }
            : {
                backgroundColor: Colors.neutral[0],
                borderWidth: 1.5, borderColor: Colors.neutral[200],
                ...Shadow.sm,
              },
        ]}
      >
        {icon}
        <Text
          style={{
            fontSize: 14, fontWeight: '700',
            color: isPrimary ? Colors.neutral[0] : Colors.neutral[700],
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Stat pill — small info chip
// ─────────────────────────────────────────────────────────────────────────────
function StatPill({
  icon,
  label,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  delay?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay,
      useNativeDriver: true,
      tension: 260,
      friction: 22,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            scale: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.7, 1],
            }),
          },
        ],
      }}
    >
      <View style={styles.statPill}>
        {icon}
        <Text style={styles.statPillText}>{label}</Text>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Contact row — tappable contact info item
// ─────────────────────────────────────────────────────────────────────────────
function ContactRow({
  icon,
  label,
  value,
  onPress,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
  delay?: number;
}) {
  const anim  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: Duration.normal,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, tension: 400, friction: 20 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1.0, useNativeDriver: true, tension: 400, friction: 20 }).start();

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
          { scale },
        ],
      }}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[styles.contactRow, !onPress && styles.contactRowStatic]}
      >
        <View style={styles.contactIconWrap}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={styles.contactLabel}>{label}</Text>
          <Text style={[styles.contactValue, onPress && styles.contactValueActive]} numberOfLines={1}>
            {value}
          </Text>
        </View>
        {onPress && (
          <ExternalLink size={16} color={Colors.primary[400]} strokeWidth={2} />
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Animal card — 2-column grid tile
// ─────────────────────────────────────────────────────────────────────────────
function AnimalCard({ animal, index }: { animal: Animal; index: number }) {
  const anim  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: index * 60,
      useNativeDriver: true,
      tension: 240,
      friction: 22,
    }).start();
  }, []);

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, tension: 380, friction: 18 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1.0, useNativeDriver: true, tension: 380, friction: 18 }).start();

  const SpeciesIcon = SPECIES_ICON[animal.species] ?? PawPrint;

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [24, 0],
            }),
          },
          { scale },
        ],
      }}
    >
      <Pressable
        onPress={() => router.push(`/(app)/animal/${animal.id}`)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.animalCard}
      >
        {/* Photo */}
        <View style={styles.animalPhotoWrap}>
          {animal.primaryPhotoUrl ? (
            <Image
              source={{ uri: animal.primaryPhotoUrl }}
              style={styles.animalPhoto}
              contentFit="cover"
              transition={250}
            />
          ) : (
            <NoPhotoPlaceholder style={styles.animalPhoto} iconSize={32} />
          )}
          {/* Species badge */}
          <View style={styles.speciesBadge}>
            <SpeciesIcon size={18} color={Colors.primary[600]} strokeWidth={2.2} />
          </View>
        </View>

        {/* Info */}
        <View style={styles.animalInfo}>
          <Text style={styles.animalName} numberOfLines={1}>{animal.name}</Text>
          <Text style={styles.animalAge}>{formatAge(animal.ageMonths)}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section header
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count !== undefined && (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function ShelterDetailScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const insets  = useSafeAreaInsets();
  const [shelter, setShelter]   = useState<Shelter | null>(null);
  const [loading, setLoading]   = useState(true);

  // Scroll-driven header animations
  const scrollY     = useRef(new Animated.Value(0)).current;
  const headerScale = scrollY.interpolate({
    inputRange: [-80, 0],
    outputRange: [1.08, 1],
    extrapolate: 'clamp',
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_H * 0.6],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const titleBarOpacity = scrollY.interpolate({
    inputRange: [HEADER_H * 0.5, HEADER_H * 0.8],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Back button scale
  const backScale = useRef(new Animated.Value(1)).current;

  // Entrance animations
  const heroAnim   = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animalService
      .getShelter(Number(id))
      .then((s) => {
        setShelter(s);
        Animated.stagger(120, [
          Animated.spring(heroAnim,    { toValue: 1, useNativeDriver: true, tension: 240, friction: 22 }),
          Animated.spring(contentAnim, { toValue: 1, useNativeDriver: true, tension: 240, friction: 22 }),
        ]).start();
      })
      // Без catch помилка лишала б екран навічно на завантаженні замість
      // досяжного стану "Shelter not found".
      .catch(() => setShelter(null))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading shelter…</Text>
      </View>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (!shelter) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <EmptyState title="Shelter not found" />
      </View>
    );
  }

  const animalCount = shelter.animals?.length ?? 0;

  // Кімнати чату прив'язані до тварини, тож "Contact Shelter" відкриває діалог
  // про першу тварину притулку. Якщо тварин немає — фолбек на телефон/нотіфай.
  const handleContactShelter = async () => {
    const firstAnimal = shelter.animals?.[0];
    if (!firstAnimal) {
      if (shelter.phone) {
        Linking.openURL(`tel:${shelter.phone}`);
      } else {
        notify('Contact unavailable', 'This shelter has no animals to start a chat about yet.');
      }
      return;
    }
    try {
      const { roomId } = await chatService.createRoom(firstAnimal.id, shelter.id);
      router.push({
        pathname: '/(app)/chat/[id]',
        params: {
          id:          String(roomId),
          shelterName: shelter.name,
          animalName:  firstAnimal.name,
        },
      });
    } catch {
      notify('Could not open chat', 'Please try again in a moment.');
    }
  };

  return (
    <View style={styles.root}>
      {/* ── Sticky top bar (appears on scroll) ─────────────────────────── */}
      <Animated.View
        style={[
          styles.stickyBar,
          { paddingTop: insets.top, opacity: titleBarOpacity },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.stickyTitle} numberOfLines={1}>{shelter.name}</Text>
      </Animated.View>

      {/* ── Back + Share + Like floating buttons ──────────────────────── */}
      <View style={[styles.floatingNav, { top: insets.top + Spacing[2] }]}>
        <Animated.View style={{ transform: [{ scale: backScale }] }}>
          <Pressable
            onPressIn={() =>
              Animated.spring(backScale, { toValue: 0.88, useNativeDriver: true, tension: 400, friction: 18 }).start()
            }
            onPressOut={() =>
              Animated.spring(backScale, { toValue: 1.0, useNativeDriver: true, tension: 400, friction: 18 }).start()
            }
            onPress={() => router.back()}
            style={styles.navBtn}
          >
            <ArrowLeft size={20} color="#fff" strokeWidth={2} />
          </Pressable>
        </Animated.View>

        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Pressable style={styles.navBtn}>
            <Share2 size={18} color="#fff" strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      {/* ── Scrollable content ──────────────────────────────────────────── */}
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* ── Hero banner ─────────────────────────────────────────────── */}
        <Animated.View style={[styles.hero, { transform: [{ scale: headerScale }] }]}>
          {/* Warm gradient overlay */}
          <View style={styles.heroOverlay} />

          {/* Decorative circles */}
          <View style={styles.heroDeco1} />
          <View style={styles.heroDeco2} />

          <Animated.View
            style={[
              styles.heroContent,
              {
                opacity: heroAnim,
                transform: [
                  {
                    translateY: heroAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Avatar with ring */}
            <View style={styles.avatarRing}>
              <Avatar
                uri={shelter.logoUrl}
                name={shelter.name}
                size={AVATAR_SIZE}
                emoji="🏠"
              />
            </View>

            {/* Name + verified badge */}
            <View style={styles.heroNameRow}>
              <Text style={styles.heroName} numberOfLines={2}>
                {shelter.name}
              </Text>
              {shelter.isVerified && (
                <CheckCircle2 size={22} color={Colors.primary[500]} fill={Colors.primary[100]} strokeWidth={2} />
              )}
            </View>

            {/* Location */}
            <View style={styles.heroLocation}>
              <MapPin size={16} color={Colors.primary[400]} strokeWidth={2.2} />
              <Text style={styles.heroLocationText}>
                {shelter.city}{shelter.address ? `, ${shelter.address}` : ''}
              </Text>
            </View>

            {/* Stats row */}
            <Animated.View style={[styles.statsRow, { opacity: headerOpacity }]}>
              <StatPill
                icon={<PawPrint size={16} color={Colors.primary[500]} strokeWidth={2.2} />}
                label={`${animalCount} animals`}
                delay={80}
              />
              {shelter.isVerified && (
                <StatPill
                  icon={<Star size={16} color={Colors.primary[500]} strokeWidth={2.2} />}
                  label="Verified"
                  delay={140}
                />
              )}
              <StatPill
                icon={<Users size={16} color={Colors.primary[500]} strokeWidth={2.2} />}
                label="Official"
                delay={200}
              />
            </Animated.View>
          </Animated.View>
        </Animated.View>

        {/* ── Body card ───────────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.body,
            {
              opacity: contentAnim,
              transform: [
                {
                  translateY: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [32, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Description */}
          {shelter.description ? (
            <View style={styles.section}>
              <SectionHeader title="About" />
              <Text style={styles.descriptionText}>{shelter.description}</Text>
            </View>
          ) : null}

          {/* Contacts */}
          {(shelter.phone || shelter.websiteUrl) ? (
            <View style={styles.section}>
              <SectionHeader title="Contact" />
              <View style={styles.contactList}>
                <ContactRow
                  icon={<MapPin size={18} color={Colors.primary[500]} strokeWidth={2} />}
                  label="Address"
                  value={`${shelter.city}${shelter.address ? `, ${shelter.address}` : ''}`}
                  delay={0}
                />
                {shelter.phone ? (
                  <ContactRow
                    icon={<Phone size={18} color={Colors.primary[500]} strokeWidth={2} />}
                    label="Phone"
                    value={shelter.phone}
                    onPress={() => Linking.openURL(`tel:${shelter.phone}`)}
                    delay={60}
                  />
                ) : null}
                {shelter.websiteUrl ? (
                  <ContactRow
                    icon={<Globe size={18} color={Colors.primary[500]} strokeWidth={2} />}
                    label="Website"
                    value={shelter.websiteUrl.replace(/^https?:\/\//, '')}
                    onPress={() => Linking.openURL(shelter.websiteUrl!)}
                    delay={120}
                  />
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Animals grid */}
          <View style={styles.section}>
            <SectionHeader title="Our Animals" count={animalCount} />
            {animalCount === 0 ? (
              <View style={styles.emptyAnimals}>
                <PawPrint size={36} color={Colors.neutral[300]} strokeWidth={1.5} />
                <Text style={styles.emptyAnimalsText}>No animals listed yet</Text>
              </View>
            ) : (
              <View style={styles.animalGrid}>
                {shelter.animals!.reduce<Animal[][]>((rows, animal, i) => {
                  if (i % 2 === 0) rows.push([animal]);
                  else rows[rows.length - 1].push(animal);
                  return rows;
                }, []).map((pair, rowIndex) => (
                  <View key={rowIndex} style={styles.animalRow}>
                    {pair.map((animal, colIndex) => (
                      <AnimalCard
                        key={animal.id}
                        animal={animal}
                        index={rowIndex * 2 + colIndex}
                      />
                    ))}
                    {/* phantom spacer keeps odd last card at half-width */}
                    {pair.length === 1 && <View style={{ flex: 1 }} />}
                  </View>
                ))}
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.ScrollView>

      {/* ── CTA dual-action bottom panel ────────────────────────────────── */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + Spacing[3] }]}>
        <ActionBtn
          label="Book Visit"
          variant="outline"
          icon={<CalendarDays size={18} color={Colors.primary[500]} strokeWidth={1.8} />}
          onPress={() => router.push({
            pathname: '/(app)/booking/[shelterId]',
            params: {
              shelterId:   String(shelter.id),
              shelterName: shelter.name,
            },
          })}
        />
        <ActionBtn
          label="Contact Shelter"
          variant="primary"
          icon={<PawPrint size={18} color={Colors.neutral[0]} strokeWidth={1.8} />}
          onPress={handleContactShelter}
        />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral[50],
    gap: Spacing[3],
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.neutral[400],
    fontWeight: FontWeight.medium,
  },

  // ── Sticky top bar
  stickyBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: Colors.neutral[0],
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    alignItems: 'center',
  },
  stickyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.neutral[900],
    marginTop: Spacing[2],
  },

  // ── Floating nav buttons
  floatingNav: {
    position: 'absolute',
    left: Spacing[4],
    right: Spacing[4],
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Hero
  hero: {
    height: HEADER_H,
    backgroundColor: Colors.primary[50],
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary[100],
    opacity: 0.35,
  },
  heroDeco1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primary[200],
    opacity: 0.3,
  },
  heroDeco2: {
    position: 'absolute',
    top: 20,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary[300],
    opacity: 0.15,
  },
  heroContent: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[5],
    alignItems: 'center',
  },
  avatarRing: {
    padding: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral[0],
    ...Shadow.md,
    marginBottom: Spacing[3],
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    justifyContent: 'center',
    marginBottom: Spacing[1],
  },
  heroName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.neutral[900],
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  heroLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    marginBottom: Spacing[3],
  },
  heroLocationText: {
    fontSize: FontSize.xs,
    color: Colors.neutral[500],
    fontWeight: FontWeight.medium,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.neutral[0],
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: Radius.full,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  statPillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.neutral[700],
  },

  // ── Body
  body: {
    paddingTop: Spacing[4],
    paddingHorizontal: Spacing[4],
    gap: Spacing[2],
  },
  section: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius['2xl'],
    padding: Spacing[5],
    marginBottom: Spacing[3],
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: Colors.primary[100],
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary[600],
  },
  descriptionText: {
    fontSize: FontSize.base,
    color: Colors.neutral[600],
    lineHeight: FontSize.base * 1.65,
  },

  // ── Contacts
  contactList: {
    gap: Spacing[2],
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.neutral[50],
    padding: Spacing[3],
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
  },
  contactRowStatic: {
    // No hover indicator
  },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.neutral[400],
    marginBottom: 2,
  },
  contactValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.neutral[800],
  },
  contactValueActive: {
    color: Colors.primary[600],
  },

  // ── Animal grid
  animalGrid: {
    flexDirection: 'column',
    gap: Spacing[3],
  },
  animalRow: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  animalCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    ...Shadow.sm,
  },
  animalPhotoWrap: {
    position: 'relative',
  },
  animalPhoto: {
    width: '100%',
    height: 130,
  },
  speciesBadge: {
    position: 'absolute',
    top: Spacing[2],
    right: Spacing[2],
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.overlay.light,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  animalInfo: {
    padding: Spacing[3],
    paddingTop: Spacing[2],
  },
  animalName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.1,
  },
  animalAge: {
    fontSize: FontSize.xs,
    color: Colors.neutral[400],
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },

  // ── Empty state
  emptyAnimals: {
    alignItems: 'center',
    paddingVertical: Spacing[8],
    gap: Spacing[2],
  },
  emptyAnimalsText: {
    fontSize: FontSize.sm,
    color: Colors.neutral[400],
    fontWeight: FontWeight.medium,
  },

  // ── Bottom dual-action panel
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: Spacing[3],
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    backgroundColor: Colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
    ...Shadow.lg,
  },
});