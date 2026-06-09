import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  BarChart3,
  CalendarDays,
  Eye,
  Heart,
  PawPrint,
  Plus,
  Store,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatAge, SPECIES_EMOJI } from '@/lib/format';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/lib/theme';
import { aggregateStats, shelterService } from '@/services/shelter';
import type { Animal, AnimalStats, Shelter } from '@/types/models';

type Status = 'loading' | 'ready' | 'no-shelter' | 'error';

export default function ShelterDashboardScreen() {
  const [status, setStatus] = useState<Status>('loading');
  const [shelter, setShelter] = useState<Shelter | null>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [stats, setStats] = useState<Map<number, AnimalStats>>(new Map());
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const myShelter = await shelterService.getMyShelter();
      setShelter(myShelter);

      const [shelterAnimals, analyticsRows] = await Promise.all([
        shelterService.getShelterAnimals(myShelter.id, myShelter.name),
        shelterService.getMyAnalytics().catch(() => []),
      ]);
      setAnimals(shelterAnimals);
      setStats(aggregateStats(analyticsRows));
      setStatus('ready');
    } catch (err: any) {
      // 404 від /shelters/me → у адміна ще немає притулку
      if (err?.response?.status === 404) setStatus('no-shelter');
      else setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // ── Loading ───────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  // ── Немає притулку → реєстрація ───────────────────────────
  if (status === 'no-shelter') {
    return (
      <SafeAreaView style={s.safe} edges={['bottom']}>
        <View style={s.center}>
          <EmptyState
            title="У вас ще немає притулку"
            subtitle={'Зареєструйте профіль притулку,\nщоб додавати тварин і бачити статистику'}
          />
          <View style={{ paddingHorizontal: Spacing[6], width: '100%' }}>
            <Button label="Зареєструвати притулок" onPress={() => router.push('/(app)/shelter/register')} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Помилка ───────────────────────────────────────────────
  if (status === 'error') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <EmptyState
            title="Не вдалося завантажити"
            subtitle="Перевір з'єднання з сервером і спробуй ще раз"
          />
          <View style={{ paddingHorizontal: Spacing[6], width: '100%' }}>
            <Button label="Спробувати ще раз" variant="outline" onPress={load} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Ready ─────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <FlatList
        data={animals}
        keyExtractor={(a) => String(a.id)}
        contentContainerStyle={s.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />}
        ListHeaderComponent={
          <DashboardHeader shelter={shelter!} animalCount={animals.length} />
        }
        ListEmptyComponent={
          <View style={{ marginTop: Spacing[10] }}>
            <EmptyState
              title="Ще немає тварин"
              subtitle={'Додай першу анкету — і вона\nз\'явиться у стрічці адопції'}
            />
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).springify().damping(18)}>
            <AnimalRow animal={item} stats={stats.get(item.id)} shelterId={shelter!.id} />
          </Animated.View>
        )}
      />

      {/* FAB — додати тварину */}
      <TouchableOpacity
        style={s.fab}
        activeOpacity={0.85}
        onPress={() =>
          router.push({
            pathname: '/(app)/shelter/animal/new',
            params: { shelterId: String(shelter!.id) },
          })
        }
      >
        <Plus size={26} color={Colors.neutral[0]} strokeWidth={2.4} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Header: shelter info + nav cards ──────────────────────────────────────────
function DashboardHeader({ shelter, animalCount }: { shelter: Shelter; animalCount: number }) {
  return (
    <View>
      <View style={s.shelterCard}>
        <View style={s.shelterIcon}>
          {shelter.logoUrl ? (
            <Image source={{ uri: shelter.logoUrl }} style={s.shelterLogo} contentFit="cover" />
          ) : (
            <Store size={26} color={Colors.primary[600]} strokeWidth={2} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.shelterName} numberOfLines={1}>{shelter.name}</Text>
          <Text style={s.shelterMeta} numberOfLines={1}>
            📍 {shelter.city} · {animalCount} {animalCount === 1 ? 'тварина' : 'тварин'}
          </Text>
        </View>
      </View>

      {/* Nav cards */}
      <View style={s.navRow}>
        <NavCard
          icon={<BarChart3 size={20} color={Colors.primary[600]} strokeWidth={2} />}
          label="Аналітика"
          onPress={() => router.push('/(app)/shelter/analytics')}
        />
        <NavCard
          icon={<CalendarDays size={20} color={Colors.primary[600]} strokeWidth={2} />}
          label="Слоти візитів"
          onPress={() =>
            router.push({
              pathname: '/(app)/shelter/booking/slots',
              params: { shelterId: String(shelter.id) },
            })
          }
        />
      </View>

      <Text style={s.sectionTitle}>Мої тварини</Text>
    </View>
  );
}

function NavCard({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.navCard} activeOpacity={0.8} onPress={onPress}>
      <View style={s.navIcon}>{icon}</View>
      <Text style={s.navLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Animal row with quick stats ───────────────────────────────────────────────
function AnimalRow({ animal, stats, shelterId }: { animal: Animal; stats?: AnimalStats; shelterId: number }) {
  return (
    <TouchableOpacity
      style={s.animalRow}
      activeOpacity={0.8}
      onPress={() =>
        router.push({
          pathname: '/(app)/shelter/animal/new',
          params: { shelterId: String(shelterId), animalId: String(animal.id) },
        })
      }
    >
      {animal.primaryPhotoUrl ? (
        <Image source={{ uri: animal.primaryPhotoUrl }} style={s.animalPhoto} contentFit="cover" transition={200} />
      ) : (
        <View style={[s.animalPhoto, s.animalPhotoEmpty]}>
          <PawPrint size={24} color={Colors.neutral[400]} />
        </View>
      )}

      <View style={{ flex: 1, marginLeft: Spacing[3] }}>
        <Text style={s.animalName} numberOfLines={1}>
          {SPECIES_EMOJI[animal.species]} {animal.name}
        </Text>
        <Text style={s.animalAge}>{formatAge(animal.ageMonths)}</Text>

        <View style={s.statRow}>
          <View style={s.statChip}>
            <Eye size={13} color={Colors.neutral[500]} strokeWidth={2} />
            <Text style={s.statText}>{stats?.views ?? 0}</Text>
          </View>
          <View style={s.statChip}>
            <Heart size={13} color={Colors.primary[500]} strokeWidth={2} />
            <Text style={s.statText}>{stats?.likeRate ?? 0}%</Text>
          </View>
          <View style={[s.statusPill, statusStyle(animal.status)]}>
            <Text style={[s.statusText, statusTextStyle(animal.status)]}>{STATUS_LABEL[animal.status]}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const STATUS_LABEL: Record<Animal['status'], string> = {
  AVAILABLE: 'Доступний',
  RESERVED: 'Зарезервований',
  ADOPTED: 'Прилаштований',
};
function statusStyle(st: Animal['status']) {
  if (st === 'AVAILABLE') return { backgroundColor: '#DCFCE7' };
  if (st === 'RESERVED') return { backgroundColor: '#FEF9C3' };
  return { backgroundColor: Colors.neutral[150] };
}
function statusTextStyle(st: Animal['status']) {
  if (st === 'AVAILABLE') return { color: '#15803D' };
  if (st === 'RESERVED') return { color: '#A16207' };
  return { color: Colors.neutral[500] };
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutral[50] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.neutral[50], gap: Spacing[4] },
  listContent: { padding: Spacing[4], paddingBottom: 120 },

  shelterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius['2xl'],
    padding: Spacing[4],
    ...Shadow.sm,
  },
  shelterIcon: {
    width: 52, height: 52, borderRadius: Radius.lg,
    backgroundColor: Colors.primary[100],
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  shelterLogo: { width: 52, height: 52 },
  shelterName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.neutral[900], marginLeft: Spacing[3] },
  shelterMeta: { fontSize: FontSize.sm, color: Colors.neutral[500], marginLeft: Spacing[3], marginTop: 2 },

  navRow: { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[3] },
  navCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    backgroundColor: Colors.neutral[0], borderRadius: Radius.xl,
    paddingVertical: Spacing[4], paddingHorizontal: Spacing[4], ...Shadow.sm,
  },
  navIcon: { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.neutral[700], flexShrink: 1 },

  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.neutral[900], marginTop: Spacing[6], marginBottom: Spacing[3] },

  animalRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.neutral[0], borderRadius: Radius.xl,
    padding: Spacing[3], marginBottom: Spacing[3], ...Shadow.sm,
  },
  animalPhoto: { width: 64, height: 64, borderRadius: Radius.lg },
  animalPhotoEmpty: { backgroundColor: Colors.neutral[100], alignItems: 'center', justifyContent: 'center' },
  animalName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.neutral[900] },
  animalAge: { fontSize: FontSize.xs, color: Colors.neutral[500], marginTop: 1 },

  statRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginTop: Spacing[2] },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.neutral[600] },
  statusPill: { marginLeft: 'auto', paddingHorizontal: Spacing[2], paddingVertical: 3, borderRadius: Radius.full },
  statusText: { fontSize: 10, fontWeight: FontWeight.bold },

  fab: {
    position: 'absolute', right: Spacing[5], bottom: Spacing[6],
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.primary[500], alignItems: 'center', justifyContent: 'center',
    ...Shadow.orange,
  },
});
