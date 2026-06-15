import { useFocusEffect } from 'expo-router';
import { Clock3, MapPin, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { confirm, notify } from '@/lib/notify';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/lib/theme';
import type { MyReservation } from '@/services/booking';
import { useBookingStore } from '@/store/booking';

const fmt = (startIso: string, endIso: string) => {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const date = s.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const t = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return { date, time: `${t(s)} – ${t(e)}` };
};

export default function MyVisitsScreen() {
  const { myReservations, fetchMyReservations, cancelReservation } = useBookingStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await fetchMyReservations();
    setLoading(false);
  }, [fetchMyReservations]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyReservations();
    setRefreshing(false);
  };

  // Лише активні бронювання, найближчі за часом першими.
  const active = useMemo(
    () =>
      myReservations
        .filter((r) => r.status === 'ACTIVE')
        .sort((a, b) => a.slotStartTime.localeCompare(b.slotStartTime)),
    [myReservations],
  );

  const handleCancel = async (r: MyReservation) => {
    const ok = await confirm('Cancel this visit?', `${r.shelterName} — your spot will be released.`);
    if (!ok) return;
    try {
      await cancelReservation(r.id);
    } catch (e: any) {
      notify('Cancel failed', e?.message ?? 'Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <FlatList
        data={active}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />}
        ListEmptyComponent={
          <View style={{ marginTop: Spacing[16] }}>
            <EmptyState title="No visits booked" subtitle={'Book a visit from a shelter\nto see it here'} />
          </View>
        }
        renderItem={({ item, index }) => {
          const { date, time } = fmt(item.slotStartTime, item.slotEndTime);
          const past = new Date(item.slotStartTime).getTime() < Date.now();
          return (
            <Animated.View entering={FadeInDown.delay(index * 50).springify().damping(18)}>
              <View style={s.card}>
                <View style={[s.strip, { backgroundColor: past ? Colors.neutral[300] : Colors.primary[500] }]} />
                <View style={s.body}>
                  <View style={s.shelterRow}>
                    <MapPin size={14} color={Colors.primary[500]} strokeWidth={2} />
                    <Text style={s.shelter} numberOfLines={1}>{item.shelterName}</Text>
                  </View>
                  <Text style={s.date}>{date}</Text>
                  <View style={s.timeRow}>
                    <Clock3 size={13} color={Colors.neutral[400]} strokeWidth={2} />
                    <Text style={s.time}>{time}</Text>
                    {past ? <Text style={s.pastTag}>· past</Text> : null}
                  </View>

                  {!past && (
                    <Pressable style={s.cancelBtn} onPress={() => handleCancel(item)}>
                      <X size={14} color={Colors.error} strokeWidth={2.2} />
                      <Text style={s.cancelText}>Cancel visit</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </Animated.View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutral[50] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.neutral[50] },
  content: { padding: Spacing[4], gap: Spacing[3], paddingBottom: Spacing[10] },

  card: { flexDirection: 'row', backgroundColor: Colors.neutral[0], borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.sm },
  strip: { width: 5 },
  body: { flex: 1, padding: Spacing[4], gap: Spacing[1] },
  shelterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1] },
  shelter: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.neutral[900] },
  date: { fontSize: FontSize.sm, color: Colors.neutral[700], fontWeight: FontWeight.semibold, marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  time: { fontSize: FontSize.sm, color: Colors.neutral[500] },
  pastTag: { fontSize: FontSize.xs, color: Colors.neutral[400], marginLeft: 2 },

  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: Spacing[2],
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  cancelText: { color: Colors.error, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});
