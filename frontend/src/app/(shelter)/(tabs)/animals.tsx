import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { Eye, Heart, Plus, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
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

import { EmptyState } from '@/components/ui/EmptyState';
import { NoPhotoPlaceholder } from '@/components/ui/NoPhotoPlaceholder';
import { formatAge, SPECIES_EMOJI } from '@/lib/format';
import { confirm, notify } from '@/lib/notify';
import { Colors, FontSize, FontWeight, Layout, Radius, Shadow, Spacing } from '@/lib/theme';
import { shelterService } from '@/services/shelter';
import { useShelterStore } from '@/store/shelter';
import type { Animal, AnimalStats } from '@/types/models';

export default function ShelterAnimalsScreen() {
  const { animals, stats, status, load } = useShelterStore();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDelete = async (animal: Animal) => {
    const ok = await confirm('Delete animal?', `${animal.name}'s profile will be permanently deleted.`);
    if (!ok) return;
    try {
      await shelterService.deleteAnimal(animal.id);
      await load();
    } catch {
      notify('Error', "Couldn't delete the profile");
    }
  };

  const loading = (status === 'loading' || status === 'idle') && animals.length === 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Text style={s.title}>Animals</Text>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={animals}
          keyExtractor={(a) => String(a.id)}
          contentContainerStyle={s.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />
          }
          ListEmptyComponent={
            <View style={{ marginTop: Spacing[16] }}>
              <EmptyState
                title="No animals yet"
                subtitle={"Add the first profile — it'll\nshow up in the adoption feed"}
              />
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50).springify().damping(18)}>
              <AnimalRow animal={item} stats={stats.get(item.id)} onDelete={() => handleDelete(item)} />
            </Animated.View>
          )}
        />
      )}

      {/* FAB — add animal */}
      <TouchableOpacity
        style={s.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/(shelter)/animal/new')}
      >
        <Plus size={26} color={Colors.neutral[0]} strokeWidth={2.4} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function AnimalRow({
  animal,
  stats,
  onDelete,
}: {
  animal: Animal;
  stats?: AnimalStats;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity
      style={s.row}
      activeOpacity={0.8}
      onPress={() => router.push(`/(shelter)/animal/${animal.id}`)}
    >
      {animal.primaryPhotoUrl ? (
        <Image source={{ uri: animal.primaryPhotoUrl }} style={s.photo} contentFit="cover" transition={200} />
      ) : (
        <NoPhotoPlaceholder style={s.photo} iconSize={24} />
      )}

      <View style={{ flex: 1, marginLeft: Spacing[3] }}>
        <Text style={s.name} numberOfLines={1}>
          {SPECIES_EMOJI[animal.species]} {animal.name}
        </Text>
        <Text style={s.age}>{formatAge(animal.ageMonths)}</Text>

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

      <TouchableOpacity style={s.deleteBtn} onPress={onDelete} hitSlop={8} activeOpacity={0.7}>
        <Trash2 size={18} color={Colors.neutral[400]} strokeWidth={2} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const STATUS_LABEL: Record<Animal['status'], string> = {
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  ADOPTED: 'Adopted',
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
  listContent: { paddingHorizontal: Spacing[4], paddingBottom: Layout.tabBarHeight + Spacing[8] },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    padding: Spacing[3],
    marginBottom: Spacing[3],
    ...Shadow.sm,
  },
  photo: { width: 64, height: 64, borderRadius: Radius.lg },
  photoEmpty: { backgroundColor: Colors.neutral[100], alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.neutral[900] },
  age: { fontSize: FontSize.xs, color: Colors.neutral[500], marginTop: 1 },

  statRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginTop: Spacing[2] },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.neutral[600] },
  statusPill: { paddingHorizontal: Spacing[2], paddingVertical: 3, borderRadius: Radius.full },
  statusText: { fontSize: 10, fontWeight: FontWeight.bold },

  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing[1],
  },

  fab: {
    position: 'absolute',
    right: Spacing[5],
    bottom: Layout.tabBarHeight + Spacing[4],
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.orange,
  },
});
