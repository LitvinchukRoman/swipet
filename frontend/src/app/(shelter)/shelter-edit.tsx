import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera, Store } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { notify } from '@/lib/notify';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/lib/theme';
import { shelterService } from '@/services/shelter';
import { useShelterStore } from '@/store/shelter';

/**
 * Screen for editing shelter details (name, address, description, logo).
 */
const DEFAULT_LAT = '50.4501';
const DEFAULT_LNG = '30.5234';

export default function ShelterEditScreen() {
  const { shelter, load } = useShelterStore();

  const [name, setName] = useState(shelter?.name ?? '');
  const [description, setDescription] = useState(shelter?.description ?? '');
  const [address, setAddress] = useState(shelter?.address ?? '');
  const [city, setCity] = useState(shelter?.city ?? '');
  const [phone, setPhone] = useState(shelter?.phone ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(shelter?.websiteUrl ?? '');
  const [lat, setLat] = useState(shelter?.locationLat != null ? String(shelter.locationLat) : DEFAULT_LAT);
  const [lng, setLng] = useState(shelter?.locationLng != null ? String(shelter.locationLng) : DEFAULT_LNG);

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!shelter) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.center}>
          <Text style={st.muted}>Shelter not loaded</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      notify('Permission needed', 'Please allow photo access in settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setUploadingLogo(true);
    try {
      const form = new FormData();
      if (Platform.OS === 'web') {
        const blob = await (await fetch(uri)).blob();
        form.append('file', blob, 'logo.jpg');
      } else {
        form.append('file', { uri, type: 'image/jpeg', name: 'logo.jpg' } as any);
      }
      await shelterService.uploadLogo(shelter.id, form);
      await load();
    } catch {
      notify('Error', "Couldn't upload the logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const submit = async () => {
    setError(null);
    if (!name.trim() || !address.trim() || !city.trim()) {
      setError('Fill in name, address and city.');
      return;
    }
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      setError('Coordinates must be numbers (e.g. 50.4501 and 30.5234).');
      return;
    }

    setSaving(true);
    try {
      await shelterService.updateShelter(shelter.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim(),
        city: city.trim(),
        locationLat: latNum,
        locationLng: lngNum,
        phone: phone.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
      });
      await load();
      router.back();
    } catch (err: any) {
      const msg =
        err?.response?.data?.violations?.[0]?.message ??
        err?.response?.data?.message ??
        "Couldn't save changes.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={st.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <TouchableOpacity style={st.logoWrap} onPress={pickLogo} activeOpacity={0.85} disabled={uploadingLogo}>
          {shelter.logoUrl ? (
            <Image source={{ uri: shelter.logoUrl }} style={st.logo} contentFit="cover" />
          ) : (
            <View style={[st.logo, st.logoEmpty]}>
              <Store size={28} color={Colors.primary[500]} strokeWidth={1.8} />
            </View>
          )}
          <View style={st.logoBadge}>
            <Camera size={14} color={Colors.neutral[0]} strokeWidth={2.2} />
          </View>
        </TouchableOpacity>
        <Text style={st.logoHint}>{uploadingLogo ? 'Uploading…' : 'Tap to change the logo'}</Text>

        <Field label="Shelter name">
          <TextInput value={name} onChangeText={setName} placeholderTextColor={Colors.neutral[300]} style={st.input} />
        </Field>

        <Field label="Description">
          <TextInput value={description} onChangeText={setDescription} placeholder="A short description of the shelter…" placeholderTextColor={Colors.neutral[300]} multiline style={[st.input, st.textArea]} />
        </Field>

        <Field label="Address">
          <TextInput value={address} onChangeText={setAddress} placeholderTextColor={Colors.neutral[300]} style={st.input} />
        </Field>

        <Field label="City">
          <TextInput value={city} onChangeText={setCity} placeholderTextColor={Colors.neutral[300]} style={st.input} />
        </Field>

        <Field label="Phone">
          <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+380…" placeholderTextColor={Colors.neutral[300]} style={st.input} />
        </Field>

        <Field label="Website">
          <TextInput value={websiteUrl} onChangeText={setWebsiteUrl} autoCapitalize="none" keyboardType="url" placeholder="https://…" placeholderTextColor={Colors.neutral[300]} style={st.input} />
        </Field>

        <View style={st.coordsRow}>
          <Field label="Latitude (lat)" flex>
            <TextInput value={lat} onChangeText={setLat} keyboardType="numbers-and-punctuation" style={st.input} />
          </Field>
          <Field label="Longitude (lng)" flex>
            <TextInput value={lng} onChangeText={setLng} keyboardType="numbers-and-punctuation" style={st.input} />
          </Field>
        </View>

        {error ? <Text style={st.error}>{error}</Text> : null}

        <Button label="Save changes" onPress={submit} loading={saving} />
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: Colors.neutral[500], fontSize: FontSize.base },
  content: { padding: Spacing[4], gap: Spacing[3], paddingBottom: Spacing[10] },

  logoWrap: { alignSelf: 'center', marginTop: Spacing[2] },
  logo: { width: 96, height: 96, borderRadius: Radius.xl },
  logoEmpty: {
    backgroundColor: Colors.primary[50],
    borderWidth: 1.5,
    borderColor: Colors.primary[200],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral[50],
  },
  logoHint: { alignSelf: 'center', fontSize: FontSize.xs, color: Colors.neutral[400], marginBottom: Spacing[2] },

  field: { gap: Spacing[1] },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coordsRow: { flexDirection: 'row', gap: Spacing[3] },
  input: {
    backgroundColor: Colors.neutral[0],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: FontSize.base,
    color: Colors.neutral[900],
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  error: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.md,
    padding: Spacing[3],
  },
});
