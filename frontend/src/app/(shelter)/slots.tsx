import { Picker } from '@react-native-picker/picker';
import { Stack } from 'expo-router';
import { CalendarPlus, Clock, Users } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { notify } from '@/lib/notify';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/lib/theme';
import { bookingService, formatSlotTime, type Slot } from '@/services/booking';
import { useShelterStore } from '@/store/shelter';

const DURATIONS = [30, 60, 90, 120];

/** Local ISO "YYYY-MM-DDTHH:MM:00" without a timezone offset. */
function toLocalIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

function tomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function SlotsScreen() {
  const shelterId = useShelterStore((st) => st.shelter?.id);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [date, setDate] = useState(tomorrowDate());
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(60);
  const [guests, setGuests] = useState('1');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!shelterId) return;
    try {
      setSlots(await bookingService.getSlots(shelterId));
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [shelterId]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!shelterId) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      notify('Error', 'Date in YYYY-MM-DD format');
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      notify('Error', 'Time in HH:MM format');
      return;
    }
    const maxGuests = parseInt(guests, 10);
    if (Number.isNaN(maxGuests) || maxGuests < 1) {
      notify('Error', 'At least 1 spot');
      return;
    }

    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    const start = new Date(y, m - 1, d, hh, mm);
    if (start.getTime() <= Date.now()) {
      notify('Error', 'Slot must be in the future');
      return;
    }
    const end = new Date(start.getTime() + duration * 60_000);

    setCreating(true);
    try {
      await bookingService.createSlot(shelterId, {
        startTime: toLocalIso(start),
        endTime: toLocalIso(end),
        maxGuests,
      });
      await load();
    } catch (err: any) {
      notify('Error', err?.response?.data?.message ?? "Couldn't create the slot");
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={st.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Visit Slots' }} />

      <FlatList
        data={slots}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={st.content}
        ListHeaderComponent={
          <View style={st.formCard}>
            <View style={st.formHeader}>
              <CalendarPlus size={18} color={Colors.primary[600]} strokeWidth={2} />
              <Text style={st.formTitle}>New slot</Text>
            </View>

            <View style={st.formRow}>
              <Field label="Date" flex={2}>
                <TextInput value={date} onChangeText={setDate} placeholder="2025-06-10" placeholderTextColor={Colors.neutral[300]} style={st.input} autoCapitalize="none" />
              </Field>
              <Field label="Time" flex={1}>
                <TextInput value={time} onChangeText={setTime} placeholder="10:00" placeholderTextColor={Colors.neutral[300]} style={st.input} />
              </Field>
            </View>

            <View style={st.formRow}>
              <Field label="Duration" flex={1}>
                <View style={st.pickerBox}>
                  <Picker selectedValue={duration} onValueChange={(v) => setDuration(Number(v))} style={st.picker}>
                    {DURATIONS.map((d) => (
                      <Picker.Item key={d} label={`${d} min`} value={d} />
                    ))}
                  </Picker>
                </View>
              </Field>
              <Field label="Spots" flex={1}>
                <TextInput value={guests} onChangeText={setGuests} keyboardType="number-pad" style={st.input} />
              </Field>
            </View>

            <Button label="Create slot" onPress={create} loading={creating} size="md" />

            <Text style={st.listHeading}>Existing slots</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={Colors.primary[500]} style={{ marginTop: Spacing[10] }} />
          ) : (
            <View style={{ marginTop: Spacing[6] }}>
              <EmptyState
                title={error ? "Couldn't load" : 'No slots yet'}
                subtitle={error ? 'Check your connection' : 'Create the first slot for volunteer visits'}
              />
            </View>
          )
        }
        renderItem={({ item }) => <SlotRow slot={item} />}
      />
    </SafeAreaView>
  );
}

function SlotRow({ slot }: { slot: Slot }) {
  const left = Math.max(0, slot.maxGuests - slot.bookedCount);
  const full = left === 0;
  return (
    <View style={st.slotRow}>
      <View style={st.slotIcon}>
        <Clock size={18} color={full ? Colors.neutral[400] : Colors.primary[600]} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={st.slotTime}>{formatSlotTime(slot.startTime, slot.endTime)}</Text>
        <View style={st.slotMeta}>
          <Users size={13} color={Colors.neutral[500]} strokeWidth={2} />
          <Text style={st.slotMetaText}>{slot.bookedCount}/{slot.maxGuests} booked</Text>
        </View>
      </View>
      <View style={[st.badge, full ? st.badgeFull : st.badgeFree]}>
        <Text style={[st.badgeText, { color: full ? Colors.neutral[500] : '#15803D' }]}>
          {full ? 'Full' : `${left} left`}
        </Text>
      </View>
    </View>
  );
}

function Field({ label, children, flex }: { label: string; children: React.ReactNode; flex: number }) {
  return (
    <View style={{ flex, gap: Spacing[1] }}>
      <Text style={st.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutral[50] },
  content: { padding: Spacing[4], paddingBottom: Spacing[10] },

  formCard: { backgroundColor: Colors.neutral[0], borderRadius: Radius['2xl'], padding: Spacing[4], gap: Spacing[3], ...Shadow.sm },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  formTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.neutral[900] },
  formRow: { flexDirection: 'row', gap: Spacing[3] },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    fontSize: FontSize.base,
    color: Colors.neutral[900],
  },
  pickerBox: { backgroundColor: Colors.neutral[50], borderWidth: 1, borderColor: Colors.neutral[200], borderRadius: Radius.lg, justifyContent: 'center' },
  picker: { color: Colors.neutral[900] },

  listHeading: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.neutral[900], marginTop: Spacing[4] },

  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    padding: Spacing[3],
    marginTop: Spacing[3],
    ...Shadow.sm,
  },
  slotIcon: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  slotTime: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.neutral[900] },
  slotMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  slotMetaText: { fontSize: FontSize.xs, color: Colors.neutral[500] },
  badge: { paddingHorizontal: Spacing[3], paddingVertical: 4, borderRadius: Radius.full },
  badgeFree: { backgroundColor: '#DCFCE7' },
  badgeFull: { backgroundColor: Colors.neutral[150] },
  badgeText: { fontSize: 11, fontWeight: FontWeight.bold },
});
