import { router, useFocusEffect } from 'expo-router';
import { PawPrint, Plus, ShieldCheck, Store, TriangleAlert, Users } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, FontSize, FontWeight, Layout, Radius, Shadow, Spacing } from '@/lib/theme';
import { adminService, type AdminStats } from '@/services/admin';

/**
 * Main dashboard tab for system administrators.
 * Displays high-level platform metrics and active alerts.
 */
export default function AdminOverviewScreen() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setStats(await adminService.getStats());
      setStatus('ready');
    } catch {
      setStatus((prev) => (prev === 'ready' ? 'ready' : 'error'));
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

  if (status === 'loading') {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (status === 'error' || !stats) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <EmptyState title="Couldn't load" subtitle="Check your server connection" />
          <TouchableOpacity style={s.retryBtn} onPress={load} activeOpacity={0.85}>
            <Text style={s.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />}
      >
        <View style={s.headerRow}>
          <View style={s.logoIcon}>
            <ShieldCheck size={22} color={Colors.neutral[0]} strokeWidth={2.2} />
          </View>
          <View>
            <Text style={s.title}>Admin panel</Text>
            <Text style={s.subtitle}>Platform management</Text>
          </View>
        </View>

        <View style={s.grid}>
          <StatTile icon={<Users size={18} color={Colors.info} strokeWidth={2} />} value={stats.userCount} label="Users" />
          <StatTile icon={<Store size={18} color={Colors.primary[500]} strokeWidth={2} />} value={stats.shelterCount} label="Shelters" />
          <StatTile icon={<PawPrint size={18} color={Colors.success} strokeWidth={2} />} value={stats.animalCount} label="Animals" />
          <StatTile
            icon={<TriangleAlert size={18} color={Colors.warning} strokeWidth={2} />}
            value={stats.pendingShelters}
            label="Pending"
            highlight={stats.pendingShelters > 0}
          />
        </View>

        {stats.pendingShelters > 0 ? (
          <TouchableOpacity style={s.alertCard} activeOpacity={0.85} onPress={() => router.push('/(admin)/(tabs)/shelters')}>
            <TriangleAlert size={18} color="#A16207" strokeWidth={2} />
            <Text style={s.alertText}>
              {stats.pendingShelters} {pluralShelter(stats.pendingShelters)} awaiting verification
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={s.cta} activeOpacity={0.85} onPress={() => router.push('/(admin)/shelter-new')}>
          <Plus size={18} color={Colors.neutral[0]} strokeWidth={2.4} />
          <Text style={s.ctaText}>Create shelter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function pluralShelter(n: number) {
  return n === 1 ? 'shelter' : 'shelters';
}

function StatTile({
  icon,
  value,
  label,
  highlight,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <View style={[s.tile, highlight && s.tileHighlight]}>
      <View style={s.tileIcon}>{icon}</View>
      <Text style={s.tileValue}>{value}</Text>
      <Text style={s.tileLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutral[50] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.neutral[50], gap: Spacing[4] },
  content: { padding: Spacing[4], paddingBottom: Layout.tabBarHeight + Spacing[8], gap: Spacing[4] },

  retryBtn: { backgroundColor: Colors.primary[500], borderRadius: Radius.lg, paddingHorizontal: Spacing[8], paddingVertical: Spacing[3] },
  retryText: { color: Colors.neutral[0], fontWeight: FontWeight.bold, fontSize: FontSize.base },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginTop: Spacing[1] },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.neutral[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.neutral[900], letterSpacing: -0.4 },
  subtitle: { fontSize: FontSize.sm, color: Colors.neutral[500], marginTop: 1 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  tile: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    padding: Spacing[4],
    ...Shadow.sm,
  },
  tileHighlight: { borderWidth: 1.5, borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
  tileIcon: { marginBottom: Spacing[2] },
  tileValue: { fontSize: FontSize['3xl'], fontWeight: FontWeight.extrabold, color: Colors.neutral[900] },
  tileLabel: { fontSize: FontSize.xs, color: Colors.neutral[500], marginTop: 2 },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: '#FEF9C3',
    borderRadius: Radius.lg,
    padding: Spacing[4],
  },
  alertText: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: '#A16207' },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.primary[500],
    borderRadius: Radius.lg,
    height: 52,
    ...Shadow.orange,
  },
  ctaText: { color: Colors.neutral[0], fontWeight: FontWeight.bold, fontSize: FontSize.base },
});
