import { Stack } from 'expo-router';
import { Eye, Heart, MessageCircle, TrendingUp } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/lib/theme';
import { shelterService } from '@/services/shelter';
import type { AnimalAnalyticsRow } from '@/types/models';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - Spacing[4] * 2 - Spacing[4] * 2;
const CHART_H = 180;
const PAD = 28;

interface DayPoint {
  date: string;
  views: number;
  likes: number;
}

export default function AnalyticsScreen() {
  const [rows, setRows] = useState<AnimalAnalyticsRow[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    shelterService.getMyAnalytics().then(setRows).catch(() => setError(true));
  }, []);

  const daily = useMemo<DayPoint[]>(() => {
    if (!rows) return [];
    const byDate = new Map<string, DayPoint>();
    for (const r of rows) {
      const cur = byDate.get(r.date) ?? { date: r.date, views: 0, likes: 0 };
      cur.views += r.viewsCount;
      cur.likes += r.swipesRight;
      byDate.set(r.date, cur);
    }
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [rows]);

  const totals = useMemo(() => {
    if (!rows) return { views: 0, likes: 0, chats: 0, likeRate: 0 };
    let views = 0, likes = 0, passes = 0, chats = 0;
    for (const r of rows) {
      views += r.viewsCount;
      likes += r.swipesRight;
      passes += r.swipesLeft;
      chats += r.chatOpens;
    }
    const totalSwipes = likes + passes;
    return { views, likes, chats, likeRate: totalSwipes ? Math.round((likes / totalSwipes) * 100) : 0 };
  }, [rows]);

  if (!rows && !error) {
    return (
      <View style={st.center}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (error || rows!.length === 0) {
    return (
      <SafeAreaView style={st.safe}>
        <Stack.Screen options={{ title: 'Аналітика' }} />
        <EmptyState
          title={error ? 'Не вдалося завантажити' : 'Ще немає даних'}
          subtitle={error ? 'Перевір зʼєднання з сервером' : 'Статистика зʼявиться коли тварин почнуть переглядати'}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Аналітика' }} />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <View style={st.statsGrid}>
          <StatCard icon={<Eye size={18} color={Colors.info} strokeWidth={2} />} value={totals.views} label="Переглядів" />
          <StatCard icon={<Heart size={18} color={Colors.primary[500]} strokeWidth={2} />} value={totals.likes} label="Лайків" />
          <StatCard icon={<TrendingUp size={18} color={Colors.success} strokeWidth={2} />} value={`${totals.likeRate}%`} label="Конверсія" />
          <StatCard icon={<MessageCircle size={18} color={Colors.warning} strokeWidth={2} />} value={totals.chats} label="Чатів" />
        </View>

        <View style={st.chartCard}>
          <Text style={st.chartTitle}>Перегляди vs лайки</Text>
          <View style={st.legendRow}>
            <Legend color={Colors.info} label="Перегляди" />
            <Legend color={Colors.primary[500]} label="Лайки" />
          </View>
          <LineChart data={daily} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <View style={st.statCard}>
      <View style={st.statIcon}>{icon}</View>
      <Text style={st.statValue}>{value}</Text>
      <Text style={st.statLabel}>{label}</Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={st.legend}>
      <View style={[st.legendDot, { backgroundColor: color }]} />
      <Text style={st.legendText}>{label}</Text>
    </View>
  );
}

function LineChart({ data }: { data: DayPoint[] }) {
  const maxY = Math.max(1, ...data.map((d) => Math.max(d.views, d.likes)));
  const innerW = CHART_W - PAD * 2;
  const innerH = CHART_H - PAD * 2;

  const xFor = (i: number) => PAD + (data.length <= 1 ? innerW / 2 : (innerW * i) / (data.length - 1));
  const yFor = (v: number) => PAD + innerH - (innerH * v) / maxY;

  const pathFor = (key: 'views' | 'likes') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(d[key])}`).join(' ');

  const gridYs = [0, 0.5, 1].map((f) => PAD + innerH - innerH * f);

  return (
    <Svg width={CHART_W} height={CHART_H}>
      {gridYs.map((y, i) => (
        <Line key={i} x1={PAD} y1={y} x2={CHART_W - PAD} y2={y} stroke={Colors.neutral[150]} strokeWidth={1} />
      ))}
      <SvgText x={4} y={PAD + 4} fontSize={10} fill={Colors.neutral[400]}>{maxY}</SvgText>

      <Path d={pathFor('views')} stroke={Colors.info} strokeWidth={2.5} fill="none" />
      <Path d={pathFor('likes')} stroke={Colors.primary[500]} strokeWidth={2.5} fill="none" />

      {data.map((d, i) => (
        <Circle key={`v${i}`} cx={xFor(i)} cy={yFor(d.views)} r={3} fill={Colors.info} />
      ))}
      {data.map((d, i) => (
        <Circle key={`l${i}`} cx={xFor(i)} cy={yFor(d.likes)} r={3} fill={Colors.primary[500]} />
      ))}

      {data.length > 0 && (
        <>
          <SvgText x={PAD} y={CHART_H - 6} fontSize={9} fill={Colors.neutral[400]}>
            {data[0].date.slice(5)}
          </SvgText>
          <SvgText x={CHART_W - PAD} y={CHART_H - 6} fontSize={9} fill={Colors.neutral[400]} textAnchor="end">
            {data[data.length - 1].date.slice(5)}
          </SvgText>
        </>
      )}
    </Svg>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutral[50] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.neutral[50] },
  content: { padding: Spacing[4], gap: Spacing[4] },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  statCard: {
    width: (CHART_W + Spacing[4] * 2 - Spacing[3]) / 2 - Spacing[3] / 2,
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    padding: Spacing[4],
    ...Shadow.sm,
  },
  statIcon: { marginBottom: Spacing[2] },
  statValue: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.neutral[900] },
  statLabel: { fontSize: FontSize.xs, color: Colors.neutral[500], marginTop: 2 },

  chartCard: { backgroundColor: Colors.neutral[0], borderRadius: Radius['2xl'], padding: Spacing[4], ...Shadow.sm },
  chartTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.neutral[900] },
  legendRow: { flexDirection: 'row', gap: Spacing[4], marginTop: Spacing[1], marginBottom: Spacing[3] },
  legend: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1] },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: FontSize.xs, color: Colors.neutral[500] },
});
