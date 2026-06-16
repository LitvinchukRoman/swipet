import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { notify } from '@/lib/notify';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/lib/theme';
import { adminService } from '@/services/admin';

/**
 * Screen for system administrators to register a new shelter in the platform.
 */
const DEFAULT_LAT = '50.4501';
const DEFAULT_LNG = '30.5234';

export default function AdminShelterNewScreen() {
  const [adminEmail, setAdminEmail] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!adminEmail.trim() || !name.trim() || !address.trim() || !city.trim()) {
      setError('Fill in admin email, name, address and city.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(adminEmail.trim())) {
      setError('Invalid admin email format.');
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
      await adminService.createShelter({
        adminEmail: adminEmail.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim(),
        city: city.trim(),
        locationLat: latNum,
        locationLng: lngNum,
        phone: phone.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
      });
      notify('Done', `Shelter created. ${adminEmail.trim()} is now the shelter administrator.`);
      router.back();
    } catch (err: any) {
      const msg =
        err?.response?.data?.violations?.[0]?.message ??
        err?.response?.data?.message ??
        "Couldn't create the shelter.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={st.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={st.hintCard}>
          <Mail size={16} color={Colors.primary[600]} strokeWidth={2} />
          <Text style={st.hintText}>
            The user with this email becomes the shelter administrator. They will fill in the profile details
            (description, logo, contacts) themselves.
          </Text>
        </View>

        <Field label="Shelter admin email">
          <TextInput
            value={adminEmail}
            onChangeText={setAdminEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="user@example.com"
            placeholderTextColor={Colors.neutral[300]}
            style={st.input}
          />
        </Field>

        <Field label="Shelter name">
          <TextInput value={name} onChangeText={setName} placeholder="e.g. Sirius" placeholderTextColor={Colors.neutral[300]} style={st.input} />
        </Field>

        <Field label="Description (optional)">
          <TextInput value={description} onChangeText={setDescription} placeholder="A short description of the shelter…" placeholderTextColor={Colors.neutral[300]} multiline style={[st.input, st.textArea]} />
        </Field>

        <Field label="Address">
          <TextInput value={address} onChangeText={setAddress} placeholder="e.g. 1 Main St" placeholderTextColor={Colors.neutral[300]} style={st.input} />
        </Field>

        <Field label="City">
          <TextInput value={city} onChangeText={setCity} placeholder="Kyiv" placeholderTextColor={Colors.neutral[300]} style={st.input} />
        </Field>

        <Field label="Phone (optional)">
          <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+380…" placeholderTextColor={Colors.neutral[300]} style={st.input} />
        </Field>

        <Field label="Website (optional)">
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

        <Button label="Create shelter" onPress={submit} loading={saving} />
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

  hintCard: {
    flexDirection: 'row',
    gap: Spacing[2],
    alignItems: 'flex-start',
    backgroundColor: Colors.primary[50],
    borderRadius: Radius.lg,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  hintText: { flex: 1, fontSize: FontSize.sm, color: Colors.primary[700], lineHeight: 19 },

  field: { gap: Spacing[1] },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.5 },
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
