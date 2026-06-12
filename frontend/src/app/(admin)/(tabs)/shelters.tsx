import { router, useFocusEffect } from 'expo-router';
import { CheckCircle2, Clock, Plus, Store } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { notify } from '@/lib/notify';
import { Colors, FontSize, FontWeight, Layout, Radius, Shadow, Spacing } from '@/lib/theme';
import { adminService, type AdminShelter } from '@/services/admin';

export default function AdminSheltersScreen() {
  const [shelters, setShelters] = useState<AdminShelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setShelters(await adminService.getShelters());
    } catch {
      // лишаємо як є — нижче EmptyState
    } finally {
      setLoading(false);
    }
  }, []);

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

  const toggleVerify = async (shelter: AdminShelter, next: boolean) => {
    // оптимістично
    setShelters((prev) => prev.map((s) => (s.id === shelter.id ? { ...s, isVerified: next } : s)));
    try {
      await adminService.verifyShelter(shelter.id, next);
    } catch {
      setShelters((prev) => prev.map((s) => (s.id === shelter.id ? { ...s, isVerified: !next } : s)));
      notify('Помилка', 'Не вдалося змінити статус верифікації');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Text style={s.title}>Притулки</Text>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={shelters}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />}
          ListEmptyComponent={
            <View style={{ marginTop: Spacing[16] }}>
              <EmptyState title="Притулків ще немає" subtitle={'Створи перший притулок\nі признач йому адміністратора'} />
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50).springify().damping(18)}>
              <ShelterRow shelter={item} onToggle={(next) => toggleVerify(item, next)} />
            </Animated.View>
          )}
        />
      )}

      <TouchableOpacity style={s.fab} activeOpacity={0.85} onPress={() => router.push('/(admin)/shelter-new')}>
        <Plus size={26} color={Colors.neutral[0]} strokeWidth={2.4} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function ShelterRow({ shelter, onToggle }: { shelter: AdminShelter; onToggle: (next: boolean) => void }) {
  return (
    <View style={s.row}>
      <View style={s.icon}>
        <Store size={22} color={Colors.primary[600]} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.name} numberOfLines={1}>
          {shelter.name}
        </Text>
        <Text style={s.meta} numberOfLines={1}>
          📍 {shelter.city} · адмін #{shelter.adminUserId}
        </Text>
        <View style={[s.badge, shelter.isVerified ? s.badgeOk : s.badgePending]}>
          {shelter.isVerified ? (
            <CheckCircle2 size={12} color="#15803D" strokeWidth={2.2} />
          ) : (
            <Clock size={12} color="#A16207" strokeWidth={2.2} />
          )}
          <Text style={[s.badgeText, { color: shelter.isVerified ? '#15803D' : '#A16207' }]}>
            {shelter.isVerified ? 'Верифіковано' : 'На перевірці'}
          </Text>
        </View>
      </View>
      <Switch
        value={shelter.isVerified}
        onValueChange={onToggle}
        trackColor={{ false: Colors.neutral[200], true: Colors.primary[300] }}
        thumbColor={shelter.isVerified ? Colors.primary[500] : Colors.neutral[0]}
      />
    </View>
  );
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
    gap: Spacing[3],
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    padding: Spacing[3],
    marginBottom: Spacing[3],
    ...Shadow.sm,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.neutral[900] },
  meta: { fontSize: FontSize.xs, color: Colors.neutral[500], marginTop: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginTop: Spacing[2],
  },
  badgeOk: { backgroundColor: '#DCFCE7' },
  badgePending: { backgroundColor: '#FEF9C3' },
  badgeText: { fontSize: 10, fontWeight: FontWeight.bold },

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
