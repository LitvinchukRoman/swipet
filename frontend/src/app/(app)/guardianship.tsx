import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Heart,
  Pause,
  PawPrint,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NoPhotoPlaceholder } from '@/components/ui/NoPhotoPlaceholder';
import { EmptyState } from '@/components/ui/EmptyState';
import { donationService } from '@/services/donation';
import { Colors, Duration, Radius, Shadow, Spacing } from '@/lib/theme';
import { confirm, notify } from '@/lib/notify';
import { SPECIES_ICON, SPECIES_LABEL } from '@/lib/format';
import type { VirtualGuardianship } from '@/types/models';

// ─── useFadeSlide ─────────────────────────────────────────────────────────────
// Returns opacity and translateY separately so callers can freely combine
// them with other transforms (e.g. scale) without overwriting each other.
function useFadeSlide(delay = 0) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: Duration.slow, delay,
        useNativeDriver: true, easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(translateY, {
        toValue: 0, duration: Duration.slow, delay,
        useNativeDriver: true, easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  return { opacity, translateY };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View
      style={{
        backgroundColor: Colors.neutral[0],
        borderRadius: Radius.xl,
        padding: Spacing[4],
        marginBottom: Spacing[3],
        flexDirection: 'row',
        gap: Spacing[3],
        borderWidth: 1, borderColor: Colors.neutral[100],
        ...Shadow.sm,
      }}
    >
      <Animated.View style={{ width: 68, height: 68, borderRadius: 16, backgroundColor: Colors.neutral[200], opacity: pulse }} />
      <View style={{ flex: 1, gap: 8 }}>
        <Animated.View style={{ height: 16, width: '60%', borderRadius: 6, backgroundColor: Colors.neutral[200], opacity: pulse }} />
        <Animated.View style={{ height: 12, width: '40%', borderRadius: 6, backgroundColor: Colors.neutral[200], opacity: pulse }} />
        <Animated.View style={{ height: 12, width: '50%', borderRadius: 6, backgroundColor: Colors.neutral[200], opacity: pulse }} />
      </View>
    </View>
  );
}

// ─── Stats banner ─────────────────────────────────────────────────────────────
function StatsBanner({ guardianships }: { guardianships: VirtualGuardianship[] }) {
  const active  = guardianships.filter(g => g.isActive).length;
  const totalMo = guardianships.filter(g => g.isActive).reduce((s, g) => s + g.monthlyAmount, 0);

  const { opacity, translateY } = useFadeSlide(0);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        marginHorizontal: Spacing[5],
        marginBottom: Spacing[5],
      }}
    >
      <View
        style={{
          backgroundColor: Colors.primary[500],
          borderRadius: Radius.xl,
          padding: Spacing[5],
          overflow: 'hidden',
          ...Shadow.orange,
        }}
      >
        {/* decorative circles */}
        <View style={{
          position: 'absolute', top: -30, right: -30,
          width: 100, height: 100, borderRadius: 50,
          backgroundColor: 'rgba(255,255,255,0.08)',
        }} />
        <View style={{
          position: 'absolute', bottom: -20, right: 30,
          width: 60, height: 60, borderRadius: 30,
          backgroundColor: 'rgba(255,255,255,0.06)',
        }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[4] }}>
          <Sparkles size={16} color="rgba(255,255,255,0.9)" strokeWidth={1.8} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.6, textTransform: 'uppercase' }}>
            Your Impact
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: Spacing[4] }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 30, fontWeight: '800', color: Colors.neutral[0] }}>{active}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              {active === 1 ? 'Animal' : 'Animals'} supported
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
          <View style={{ flex: 1, paddingLeft: Spacing[4] }}>
            <Text style={{ fontSize: 30, fontWeight: '800', color: Colors.neutral[0] }}>₴{totalMo}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              Monthly contribution
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Guardianship card ────────────────────────────────────────────────────────
function GuardianshipCard({
  item,
  index,
  onCancel,
}: {
  item: VirtualGuardianship;
  index: number;
  onCancel: (id: number) => void;
}) {
  const { opacity, translateY } = useFadeSlide(index * 60);
  const scale = useRef(new Animated.Value(1)).current;
  const [paying, setPaying] = useState(false);

  const onIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, damping: 12 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, damping: 10 }).start();

  const nextBilling = new Date(item.nextBillingAt);
  const daysUntil   = Math.ceil((nextBilling.getTime() - Date.now()) / 86_400_000);
  const startedDate = new Date(item.startedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const species     = item.animal?.species ?? 'OTHER';
  const SpeciesIcon = SPECIES_ICON[species];

  const handleCancel = async () => {
    // confirm() — web-safe (window.confirm на web; Alert з кнопками на native).
    // Прямий Alert.alert з кнопками на web — no-op, тож скасування не спрацьовувало.
    const ok = await confirm(
      'Cancel guardianship?',
      `You'll stop supporting ${item.animal?.name ?? 'this animal'} and won't be charged next month.`,
    );
    if (ok) onCancel(item.id);
  };

  const handlePay = async () => {
    try {
      setPaying(true);
      const res = await donationService.getPendingGuardianshipPayment(item.id);
      if (res.paymentUrl) {
        Linking.openURL(res.paymentUrl);
      }
    } catch (err: any) {
      notify('Error', err?.response?.data?.message ?? "Couldn't fetch payment link");
    } finally {
      setPaying(false);
    }
  };

  return (
    // ✅ opacity and translateY from useFadeSlide, scale from press — all in one transform array
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    >
      <Pressable
        onPress={() => router.push(`/(app)/animal/${item.animalId}`)}
        onPressIn={onIn}
        onPressOut={onOut}
      >
        <View
          style={{
            backgroundColor: Colors.neutral[0],
            borderRadius: Radius.xl,
            marginBottom: Spacing[3],
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: item.isActive ? Colors.neutral[100] : Colors.neutral[150],
            ...Shadow.sm,
            opacity: item.isActive ? 1 : 0.65,
          }}
        >
          {/* top row */}
          <View style={{ flexDirection: 'row', padding: Spacing[4], gap: Spacing[3], alignItems: 'flex-start' }}>
            {/* photo */}
            <View style={{ position: 'relative' }}>
              {item.animal?.primaryPhotoUrl ? (
                <Image
                  source={{ uri: item.animal?.primaryPhotoUrl }}
                  style={{ width: 68, height: 68, borderRadius: 16 }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <NoPhotoPlaceholder style={{ width: 68, height: 68, borderRadius: 16 }} iconSize={24} />
              )}
              {/* species icon — correct dog/cat/rabbit glyph from the live DTO */}
              <View
                style={{
                  position: 'absolute', top: -4, left: -4,
                  width: 24, height: 24, borderRadius: 12,
                  backgroundColor: Colors.neutral[0],
                  borderWidth: 1.5, borderColor: Colors.neutral[100],
                  alignItems: 'center', justifyContent: 'center',
                  ...Shadow.sm,
                }}
              >
                <SpeciesIcon size={13} color={Colors.primary[500]} strokeWidth={2} />
              </View>
              {/* active indicator */}
              <View
                style={{
                  position: 'absolute', bottom: -3, right: -3,
                  width: 18, height: 18, borderRadius: 9,
                  backgroundColor: item.isActive ? Colors.success : Colors.neutral[300],
                  borderWidth: 2, borderColor: Colors.neutral[0],
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                {item.isActive
                  ? <Heart size={9} color={Colors.neutral[0]} fill={Colors.neutral[0]} strokeWidth={0} />
                  : <Pause size={9} color={Colors.neutral[0]} strokeWidth={2} />
                }
              </View>
            </View>

            {/* info */}
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.neutral[900] }}>
                  {item.animal?.name ?? 'Unknown'}
                </Text>
                {item.isActive && (
                  <View style={{ backgroundColor: Colors.primary[50], paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.primary[500] }}>ACTIVE</Text>
                  </View>
                )}
              </View>

              <Text style={{ fontSize: 13, color: Colors.neutral[400] }}>
                {item.animal?.breed ?? `${SPECIES_LABEL[species]} · Mixed breed`}
              </Text>

              {/* amount + since */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginTop: Spacing[1] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <RefreshCw size={12} color={Colors.primary[400]} strokeWidth={2} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.primary[500] }}>
                    ₴{item.monthlyAmount}/mo
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} color={Colors.neutral[400]} strokeWidth={1.8} />
                  <Text style={{ fontSize: 12, color: Colors.neutral[400] }}>
                    Since {startedDate}
                  </Text>
                </View>
              </View>
            </View>

            <ChevronRight size={18} color={Colors.neutral[300]} strokeWidth={1.8} />
          </View>

          {/* bottom billing bar */}
          {item.isActive && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: Spacing[4],
                paddingVertical: Spacing[3],
                backgroundColor: Colors.neutral[50],
                borderTopWidth: 1,
                borderTopColor: Colors.neutral[100],
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Calendar size={13} color={Colors.neutral[400]} strokeWidth={1.8} />
                <Text style={{ fontSize: 12, color: Colors.neutral[500] }}>
                  Next charge{' '}
                  <Text style={{ fontWeight: '700', color: Colors.neutral[700] }}>
                    {daysUntil <= 0
                      ? 'today'
                      : daysUntil === 1
                      ? 'tomorrow'
                      : `in ${daysUntil} days`}
                  </Text>
                  {' · '}
                  {nextBilling.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>

              {daysUntil <= 0 && (
                <Pressable
                  onPress={handlePay}
                  disabled={paying}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: Spacing[3],
                    paddingVertical: Spacing[2],
                    borderRadius: Radius.full,
                    backgroundColor: pressed ? Colors.primary[600] : Colors.primary[500],
                    opacity: paying ? 0.7 : 1,
                  })}
                >
                  {paying ? (
                    <ActivityIndicator size="small" color={Colors.neutral[0]} />
                  ) : (
                    <>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.neutral[0] }}>Pay Now</Text>
                      <ChevronRight size={14} color={Colors.neutral[0]} strokeWidth={2.5} />
                    </>
                  )}
                </Pressable>
              )}

              <Pressable
                onPress={handleCancel}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: Spacing[2],
                  paddingVertical: Spacing[1],
                  borderRadius: Radius.sm,
                  backgroundColor: pressed ? '#FEE2E2' : 'transparent',
                })}
              >
                <Trash2 size={13} color={Colors.error} strokeWidth={1.8} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.error }}>Cancel</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyGuardianships() {
  const { opacity, translateY } = useFadeSlide(100);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 1600, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(floatAnim, { toValue:  0, duration: 1600, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        alignItems: 'center',
        paddingTop: Spacing[12],
        paddingHorizontal: Spacing[8],
      }}
    >
      <Animated.View style={{ transform: [{ translateY: floatAnim }], marginBottom: Spacing[5] }}>
        <View
          style={{
            width: 96, height: 96, borderRadius: 28,
            backgroundColor: Colors.primary[50],
            alignItems: 'center', justifyContent: 'center',
            ...Shadow.lg,
          }}
        >
          <PawPrint size={44} color={Colors.primary[400]} strokeWidth={1.5} />
        </View>
      </Animated.View>

      <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.neutral[900], textAlign: 'center', marginBottom: Spacing[2] }}>
        No guardianships yet
      </Text>
      <Text style={{ fontSize: 14, color: Colors.neutral[400], textAlign: 'center', lineHeight: 21, marginBottom: Spacing[7] }}>
        Support an animal monthly and become their virtual guardian. They'll always remember you. 🐾
      </Text>

      <Pressable
        onPress={() => router.push('/(app)/(tabs)')}
        style={({ pressed }) => ({
          backgroundColor: pressed ? Colors.primary[600] : Colors.primary[500],
          borderRadius: Radius.lg,
          height: 52,
          paddingHorizontal: Spacing[8],
          alignItems: 'center',
          justifyContent: 'center',
          ...Shadow.orange,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
          <Heart size={16} color={Colors.neutral[0]} strokeWidth={1.8} />
          <Text style={{ color: Colors.neutral[0], fontSize: 15, fontWeight: '700' }}>
            Find an animal to support
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function GuardianshipScreen() {
  const [guardianships, setGuardianships] = useState<VirtualGuardianship[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [error,         setError]         = useState(false);

  const fetchData = async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(false);
    try {
      const data = await donationService.getMyGuardianships();
      setGuardianships(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const status = err?.response?.status;
      if (!err?.response || status >= 500) {
        setError(true);
      } else {
        setGuardianships([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRefresh = () => { setRefreshing(true); fetchData(true); };

  const handleCancel = async (id: number) => {
    try {
      await donationService.cancelGuardianship(id);
      setGuardianships(prev =>
        prev.map(g => g.id === id ? { ...g, isActive: false } : g)
      );
    } catch {
      notify('Error', 'Could not cancel guardianship. Please try again.');
    }
  };

  const active   = guardianships.filter(g => g.isActive);
  const inactive = guardianships.filter(g => !g.isActive);

  /*
  const handleDebugTrigger = async () => {
    try {
      await donationService.debugTriggerBilling();
      notify('Success', 'Billing dates shifted back. Refreshing...');
      fetchData();
    } catch (err) {
      notify('Error', 'Failed to trigger billing');
    }
  };
  */

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.neutral[0] }} edges={['top']}>
      {loading ? (
        <View style={{ paddingHorizontal: Spacing[5] }}>
          {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[4], paddingHorizontal: Spacing[8] }}>
          <AlertCircle size={44} color={Colors.neutral[300]} strokeWidth={1.5} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.neutral[700], textAlign: 'center' }}>
            Couldn't load guardianships
          </Text>
          <Pressable
            onPress={() => fetchData()}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
              backgroundColor: pressed ? Colors.neutral[100] : Colors.neutral[50],
              borderRadius: Radius.lg,
              paddingHorizontal: Spacing[5], paddingVertical: Spacing[3],
            })}
          >
            <RefreshCw size={15} color={Colors.primary[500]} strokeWidth={2} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.primary[500] }}>Retry</Text>
          </Pressable>
        </View>
      ) : guardianships.length === 0 ? (
        <EmptyGuardianships />
      ) : (
        <FlatList
          data={[...active, ...inactive]}
          keyExtractor={item => String(item.id)}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary[500]}
              colors={[Colors.primary[500]]}
            />
          }
          ListHeaderComponent={
            active.length > 0 ? <StatsBanner guardianships={guardianships} /> : null
          }
          ListFooterComponent={
            <View style={{ paddingHorizontal: Spacing[5], marginTop: Spacing[3], paddingBottom: Spacing[10] }}>
              {inactive.length > 0 && (
                <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.neutral[400], marginBottom: Spacing[3], letterSpacing: 0.4, textTransform: 'uppercase' }}>
                  Cancelled
                </Text>
              )}
              {/* active.length > 0 && (
                <Pressable onPress={handleDebugTrigger} style={{ padding: 12, backgroundColor: Colors.neutral[100], borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing[8] }}>
                  <Text style={{ fontSize: 12, color: Colors.neutral[500], fontWeight: '600' }}>🛠 DEBUG: Fast-Forward 1 Month</Text>
                </Pressable>
              ) */}
            </View>
          }
          contentContainerStyle={{
            paddingHorizontal: Spacing[5],
            paddingBottom: Spacing[10],
          }}
          renderItem={({ item, index }) => (
            <GuardianshipCard
              item={item}
              index={index}
              onCancel={handleCancel}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}