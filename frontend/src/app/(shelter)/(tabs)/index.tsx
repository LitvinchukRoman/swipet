import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  Heart,
  PawPrint,
  Plus,
  Store,
  TrendingUp,
} from 'lucide-react-native';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, FontSize, FontWeight, Layout, Radius, Shadow, Spacing } from '@/lib/theme';
import { summarize, useShelterStore } from '@/store/shelter';

export default function ShelterDashboardScreen() {
  const { shelter, animals, stats, status, load } = useShelterStore();
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

  if (status === 'loading' || status === 'idle') {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (status === 'no-shelter') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <EmptyState
            title="Притулок ще не призначено"
            subtitle={'Профіль притулку створює адміністратор.\nЗверніться до нього, щоб отримати доступ.'}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'error' || !shelter) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <EmptyState title="Не вдалося завантажити" subtitle="Перевір зʼєднання з сервером" />
          <TouchableOpacity style={s.retryBtn} onPress={load} activeOpacity={0.85}>
            <Text style={s.retryText}>Спробувати ще раз</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const m = summarize(animals, stats);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />
        }
      >
        {/* ── Shelter identity ── */}
        <View style={s.shelterCard}>
          <View style={s.shelterIcon}>
            {shelter.logoUrl ? (
              <Image source={{ uri: shelter.logoUrl }} style={s.shelterLogo} contentFit="cover" />
            ) : (
              <Store size={26} color={Colors.primary[600]} strokeWidth={2} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.shelterName} numberOfLines={1}>
              {shelter.name}
            </Text>
            <Text style={s.shelterMeta} numberOfLines={1}>
              📍 {shelter.city}
            </Text>
          </View>
          <View style={[s.verifyPill, shelter.isVerified ? s.verifyOk : s.verifyPending]}>
            {shelter.isVerified ? (
              <CheckCircle2 size={13} color="#15803D" strokeWidth={2.2} />
            ) : (
              <Clock size={13} color="#A16207" strokeWidth={2.2} />
            )}
            <Text style={[s.verifyText, { color: shelter.isVerified ? '#15803D' : '#A16207' }]}>
              {shelter.isVerified ? 'Верифіковано' : 'На перевірці'}
            </Text>
          </View>
        </View>

        {/* ── Metrics ── */}
        <View style={s.metricsGrid}>
          <MetricTile
            icon={<PawPrint size={18} color={Colors.primary[500]} strokeWidth={2} />}
            value={`${m.available}/${m.total}`}
            label="Доступно"
          />
          <MetricTile
            icon={<Eye size={18} color={Colors.info} strokeWidth={2} />}
            value={m.views}
            label="Переглядів"
          />
          <MetricTile
            icon={<Heart size={18} color={Colors.error} strokeWidth={2} />}
            value={m.likes}
            label="Лайків"
          />
          <MetricTile
            icon={<TrendingUp size={18} color={Colors.success} strokeWidth={2} />}
            value={`${m.likeRate}%`}
            label="Конверсія"
          />
        </View>

        {/* ── Quick actions ── */}
        <View style={s.actionsRow}>
          <TouchableOpacity
            style={[s.actionBtn, s.actionPrimary]}
            activeOpacity={0.85}
            onPress={() => router.push('/(shelter)/animal/new')}
          >
            <Plus size={18} color={Colors.neutral[0]} strokeWidth={2.4} />
            <Text style={s.actionPrimaryText}>Додати тварину</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, s.actionOutline]}
            activeOpacity={0.85}
            onPress={() => router.push('/(shelter)/slots')}
          >
            <CalendarDays size={18} color={Colors.primary[600]} strokeWidth={2.2} />
            <Text style={s.actionOutlineText}>Створити слот</Text>
          </TouchableOpacity>
        </View>

        {/* ── Management ── */}
        <Text style={s.sectionTitle}>Керування</Text>
        <NavCard
          icon={<BarChart3 size={20} color={Colors.primary[600]} strokeWidth={2} />}
          label="Аналітика"
          hint="Перегляди та лайки по датах"
          onPress={() => router.push('/(shelter)/analytics')}
        />
        <NavCard
          icon={<CalendarDays size={20} color={Colors.primary[600]} strokeWidth={2} />}
          label="Слоти візитів"
          hint="Створення та перегляд бронювань"
          onPress={() => router.push('/(shelter)/slots')}
        />
        <NavCard
          icon={<Store size={20} color={Colors.primary[600]} strokeWidth={2} />}
          label="Профіль притулку"
          hint="Назва, опис, лого, контакти"
          onPress={() => router.push('/(shelter)/shelter-edit')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────────
function MetricTile({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <View style={s.metricTile}>
      <View style={s.metricIcon}>{icon}</View>
      <Text style={s.metricValue}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
    </View>
  );
}

function NavCard({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={s.navCard} activeOpacity={0.8} onPress={onPress}>
      <View style={s.navIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.navLabel}>{label}</Text>
        <Text style={s.navHint}>{hint}</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutral[50] },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral[50],
    gap: Spacing[4],
  },
  content: { padding: Spacing[4], paddingBottom: Layout.tabBarHeight + Spacing[8], gap: Spacing[4] },

  retryBtn: {
    backgroundColor: Colors.primary[500],
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[3],
  },
  retryText: { color: Colors.neutral[0], fontWeight: FontWeight.bold, fontSize: FontSize.base },

  // Shelter card
  shelterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius['2xl'],
    padding: Spacing[4],
    ...Shadow.sm,
  },
  shelterIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shelterLogo: { width: 52, height: 52 },
  shelterName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.neutral[900] },
  shelterMeta: { fontSize: FontSize.sm, color: Colors.neutral[500], marginTop: 2 },
  verifyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  verifyOk: { backgroundColor: '#DCFCE7' },
  verifyPending: { backgroundColor: '#FEF9C3' },
  verifyText: { fontSize: 10, fontWeight: FontWeight.bold },

  // Metrics
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  metricTile: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    padding: Spacing[4],
    ...Shadow.sm,
  },
  metricIcon: { marginBottom: Spacing[2] },
  metricValue: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.neutral[900] },
  metricLabel: { fontSize: FontSize.xs, color: Colors.neutral[500], marginTop: 2 },

  // Quick actions
  actionsRow: { flexDirection: 'row', gap: Spacing[3] },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    height: 50,
    borderRadius: Radius.lg,
  },
  actionPrimary: { backgroundColor: Colors.primary[500], ...Shadow.orange },
  actionPrimaryText: { color: Colors.neutral[0], fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  actionOutline: { backgroundColor: Colors.neutral[0], borderWidth: 1.5, borderColor: Colors.primary[200] },
  actionOutlineText: { color: Colors.primary[600], fontWeight: FontWeight.bold, fontSize: FontSize.sm },

  // Management
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.neutral[900],
    marginTop: Spacing[2],
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    padding: Spacing[4],
    ...Shadow.sm,
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.neutral[900] },
  navHint: { fontSize: FontSize.xs, color: Colors.neutral[400], marginTop: 1 },
});
