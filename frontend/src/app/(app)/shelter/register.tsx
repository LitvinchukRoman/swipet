import * as Location from 'expo-location';
import { router, Stack } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/lib/theme';
import { shelterService } from '@/services/shelter';

// Дефолт — центр Києва, щоб форма була одразу робочою (можна змінити вручну або «Моя локація»).
const DEFAULT_LAT = '50.4501';
const DEFAULT_LNG = '30.5234';

export default function ShelterRegisterScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);

  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Геолокація: на web — браузерний API (надійно у secure context), на native — expo-location.
  const useMyLocation = async () => {
    setLocating(true);
    setError(null);
    try {
      if (Platform.OS === 'web') {
        if (!('geolocation' in navigator)) {
          setError('Браузер не підтримує геолокацію — введіть координати вручну.');
          return;
        }
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setLat(String(pos.coords.latitude));
              setLng(String(pos.coords.longitude));
              resolve();
            },
            (err) => reject(new Error(err.message)),
            { enableHighAccuracy: false, timeout: 10000 },
          );
        });
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Дозвіл на геолокацію не надано — введіть координати вручну.');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
      }
    } catch (e: any) {
      setError(`Не вдалося отримати геолокацію (${e?.message ?? 'помилка'}). Введіть вручну.`);
    } finally {
      setLocating(false);
    }
  };

  const submit = async () => {
    setError(null);
    if (!name.trim() || !address.trim() || !city.trim()) {
      setError('Заповніть назву, адресу та місто.');
      return;
    }
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      setError('Координати мають бути числами (напр. 50.4501 та 30.5234).');
      return;
    }

    setSaving(true);
    try {
      await shelterService.registerShelter({
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim(),
        city: city.trim(),
        locationLat: latNum,
        locationLng: lngNum,
        phone: phone.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
      });
      // Прямий редірект (Alert на web не виконує onPress).
      router.replace('/(app)/shelter/dashboard');
    } catch (err: any) {
      const msg =
        err?.response?.data?.violations?.[0]?.message ??
        err?.response?.data?.message ??
        'Не вдалося зареєструвати притулок.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={st.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Реєстрація притулку' }} />
      <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Field label="Назва притулку">
          <TextInput value={name} onChangeText={setName} placeholder="Напр. Сіріус" placeholderTextColor={Colors.neutral[300]} style={st.input} />
        </Field>

        <Field label="Опис (необов'язково)">
          <TextInput value={description} onChangeText={setDescription} placeholder="Коротко про притулок…" placeholderTextColor={Colors.neutral[300]} multiline style={[st.input, st.textArea]} />
        </Field>

        <Field label="Адреса">
          <TextInput value={address} onChangeText={setAddress} placeholder="вул. Молодіжна 1" placeholderTextColor={Colors.neutral[300]} style={st.input} />
        </Field>

        <Field label="Місто">
          <TextInput value={city} onChangeText={setCity} placeholder="Київ" placeholderTextColor={Colors.neutral[300]} style={st.input} />
        </Field>

        <Field label="Телефон (необов'язково)">
          <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+380…" placeholderTextColor={Colors.neutral[300]} style={st.input} />
        </Field>

        <Field label="Сайт (необов'язково)">
          <TextInput value={websiteUrl} onChangeText={setWebsiteUrl} autoCapitalize="none" keyboardType="url" placeholder="https://…" placeholderTextColor={Colors.neutral[300]} style={st.input} />
        </Field>

        {/* Координати: ручне введення + кнопка авто */}
        <View style={st.coordsRow}>
          <Field label="Широта (lat)" flex>
            <TextInput value={lat} onChangeText={setLat} keyboardType="numbers-and-punctuation" style={st.input} />
          </Field>
          <Field label="Довгота (lng)" flex>
            <TextInput value={lng} onChangeText={setLng} keyboardType="numbers-and-punctuation" style={st.input} />
          </Field>
        </View>

        <TouchableOpacity style={st.locationBtn} onPress={useMyLocation} activeOpacity={0.8} disabled={locating}>
          {locating ? (
            <ActivityIndicator size="small" color={Colors.primary[500]} />
          ) : (
            <MapPin size={18} color={Colors.primary[500]} strokeWidth={2} />
          )}
          <Text style={st.locationText}>{locating ? 'Визначення…' : 'Заповнити моєю локацією'}</Text>
        </TouchableOpacity>

        {error ? <Text style={st.error}>{error}</Text> : null}

        <Button label="Зареєструвати притулок" onPress={submit} loading={saving} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children, flex }: { label: string; children: React.ReactNode; flex?: boolean }) {
  return (
    <View style={[st.field, flex && { flex: 1 }]}>
      <Text style={st.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutral[50] },
  content: { padding: Spacing[4], gap: Spacing[3], paddingBottom: Spacing[10] },
  field: { gap: Spacing[1] },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.5 },
  coordsRow: { flexDirection: 'row', gap: Spacing[3] },
  input: {
    backgroundColor: Colors.neutral[0], borderWidth: 1, borderColor: Colors.neutral[200], borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], fontSize: FontSize.base, color: Colors.neutral[900],
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2],
    backgroundColor: Colors.neutral[0], borderWidth: 1.5, borderColor: Colors.primary[200], borderStyle: 'dashed',
    borderRadius: Radius.lg, paddingVertical: Spacing[3],
  },
  locationText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary[500] },
  error: {
    color: Colors.error, fontSize: FontSize.sm, fontWeight: FontWeight.medium,
    backgroundColor: '#FEF2F2', borderRadius: Radius.md, padding: Spacing[3],
  },
});
