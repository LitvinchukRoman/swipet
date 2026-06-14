import { Picker } from '@react-native-picker/picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Camera, Check } from 'lucide-react-native';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { GENDER_LABEL, SIZE_LABEL, SPECIES_LABEL } from '@/lib/format';
import { notify } from '@/lib/notify';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/lib/theme';
import { shelterService, type AnimalPayload } from '@/services/shelter';
import { useShelterStore } from '@/store/shelter';
import type { AnimalSize, Gender, Species } from '@/types/models';

const SPECIES: Species[] = ['DOG', 'CAT', 'RABBIT', 'OTHER'];
const SIZES: AnimalSize[] = ['SMALL', 'MEDIUM', 'LARGE'];
const GENDERS: Gender[] = ['MALE', 'FEMALE'];
const STATUSES: Animal['status'][] = ['AVAILABLE', 'RESERVED', 'ADOPTED'];
const STATUS_LABEL: Record<Animal['status'], string> = {
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  ADOPTED: 'Adopted',
};

export default function AnimalFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEdit = id !== 'new';
  const editingId = isEdit ? Number(id) : undefined;

  const shelter = useShelterStore((st) => st.shelter);
  const reload = useShelterStore((st) => st.load);
  const existing = useShelterStore((st) => (editingId != null ? st.animals.find((a) => a.id === editingId) : undefined));

  const [name, setName] = useState(existing?.name ?? '');
  const [species, setSpecies] = useState<Species>(existing?.species ?? 'DOG');
  const [breed, setBreed] = useState(existing?.breed ?? '');
  const [ageMonths, setAgeMonths] = useState(existing?.ageMonths != null ? String(existing.ageMonths) : '');
  const [size, setSize] = useState<AnimalSize>(existing?.size ?? 'MEDIUM');
  const [gender, setGender] = useState<Gender>(existing?.gender ?? 'MALE');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [isVaccinated, setIsVaccinated] = useState(existing?.isVaccinated ?? false);
  const [isSterilized, setIsSterilized] = useState(existing?.isSterilized ?? false);
  const [status, setStatus] = useState<Animal['status']>(existing?.status ?? 'AVAILABLE');
  const [photoUri, setPhotoUri] = useState<string | null>(existing?.primaryPhotoUrl ?? null);

  const [saving, setSaving] = useState(false);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      notify('Permission needed', 'Please allow photo access in settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const uploadPhoto = async (animalId: number, uri: string) => {
    const form = new FormData();
    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      form.append('file', blob, 'animal.jpg');
    } else {
      form.append('file', { uri, type: 'image/jpeg', name: 'animal.jpg' } as any);
    }
    await shelterService.uploadAnimalPhoto(animalId, form);
  };

  const handleSave = async () => {
    if (!shelter) {
      notify('Error', 'Shelter not loaded');
      return;
    }
    if (!name.trim()) {
      notify('Error', "Enter the animal's name");
      return;
    }
    const age = parseInt(ageMonths, 10);
    if (Number.isNaN(age) || age < 0) {
      notify('Error', 'Enter a valid age in months');
      return;
    }

    const payload: AnimalPayload = {
      shelterId: shelter.id,
      name: name.trim(),
      species,
      breed: breed.trim() || undefined,
      ageMonths: age,
      size,
      gender,
      description: description.trim() || undefined,
      isVaccinated,
      isSterilized,
      status: isEdit ? status : undefined,
    };

    setSaving(true);
    try {
      const animal = isEdit
        ? await shelterService.updateAnimal(editingId!, payload)
        : await shelterService.createAnimal(payload);

      // Only upload a freshly picked local photo (a remote http URL in edit mode is skipped)
      if (photoUri && !photoUri.startsWith('http')) {
        await uploadPhoto(animal.id, photoUri).catch(() => {
          notify('Notice', "Profile saved, but the photo didn't upload.");
        });
      }

      await reload();
      router.back();
    } catch (err: any) {
      notify('Error', err?.response?.data?.message ?? "Couldn't save the profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={st.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: isEdit ? 'Edit animal' : 'New animal' }} />
      <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable style={st.photoWrap} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={st.photo} contentFit="cover" />
          ) : (
            <View style={st.photoEmpty}>
              <Camera size={28} color={Colors.primary[500]} strokeWidth={1.8} />
              <Text style={st.photoLabel}>Add photo</Text>
            </View>
          )}
        </Pressable>

        <Field label="Name">
          <TextInput value={name} onChangeText={setName} placeholder="e.g. Rex" placeholderTextColor={Colors.neutral[300]} style={st.input} />
        </Field>

        {isEdit && (
          <Field label="Adoption Status">
            <PickerBox selected={status} onChange={setStatus} options={STATUSES} labelMap={STATUS_LABEL} />
          </Field>
        )}

        <Row>
          <Field label="Species" flex>
            <PickerBox selected={species} onChange={setSpecies} options={SPECIES} labelMap={SPECIES_LABEL} />
          </Field>
          <Field label="Gender" flex>
            <PickerBox selected={gender} onChange={setGender} options={GENDERS} labelMap={GENDER_LABEL} />
          </Field>
        </Row>

        <Row>
          <Field label="Size" flex>
            <PickerBox selected={size} onChange={setSize} options={SIZES} labelMap={SIZE_LABEL} />
          </Field>
          <Field label="Age (months)" flex>
            <TextInput value={ageMonths} onChangeText={setAgeMonths} keyboardType="number-pad" placeholder="12" placeholderTextColor={Colors.neutral[300]} style={st.input} />
          </Field>
        </Row>

        <Field label="Breed (optional)">
          <TextInput value={breed} onChangeText={setBreed} placeholder="e.g. Labrador" placeholderTextColor={Colors.neutral[300]} style={st.input} />
        </Field>

        <Field label="Personality">
          <TextInput value={description} onChangeText={setDescription} placeholder="Tell us about this pet…" placeholderTextColor={Colors.neutral[300]} multiline style={[st.input, st.textArea]} />
        </Field>

        <ToggleRow label="Vaccinated" value={isVaccinated} onValueChange={setIsVaccinated} />
        <ToggleRow label="Sterilized" value={isSterilized} onValueChange={setIsSterilized} />

        <Button label={isEdit ? 'Save changes' : 'Add animal'} onPress={handleSave} loading={saving} />
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

function Row({ children }: { children: React.ReactNode }) {
  return <View style={st.row}>{children}</View>;
}

function PickerBox<T extends string>({
  selected,
  onChange,
  options,
  labelMap,
}: {
  selected: T;
  onChange: (v: T) => void;
  options: T[];
  labelMap: Record<T, string>;
}) {
  return (
    <View style={st.pickerBox}>
      <Picker selectedValue={selected} onValueChange={(v) => onChange(v as T)} style={st.picker}>
        {options.map((opt) => (
          <Picker.Item key={opt} label={labelMap[opt]} value={opt} />
        ))}
      </Picker>
    </View>
  );
}

function ToggleRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={st.toggleRow}>
      <View style={st.toggleLeft}>
        {value ? <Check size={16} color={Colors.success} strokeWidth={2.5} /> : null}
        <Text style={st.toggleLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.neutral[200], true: Colors.primary[300] }}
        thumbColor={value ? Colors.primary[500] : Colors.neutral[0]}
      />
    </View>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutral[50] },
  content: { padding: Spacing[4], gap: Spacing[3], paddingBottom: Spacing[10] },

  photoWrap: { alignSelf: 'center', marginBottom: Spacing[2] },
  photo: { width: 160, height: 120, borderRadius: Radius.xl },
  photoEmpty: {
    width: 160,
    height: 120,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary[50],
    borderWidth: 1.5,
    borderColor: Colors.primary[200],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoLabel: { fontSize: FontSize.sm, color: Colors.primary[500], fontWeight: FontWeight.semibold },

  field: { gap: Spacing[1] },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: Spacing[3] },

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
  textArea: { minHeight: 90, textAlignVertical: 'top' },

  pickerBox: {
    backgroundColor: Colors.neutral[0],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: Radius.lg,
    justifyContent: 'center',
    ...(Platform.OS === 'android' ? {} : { paddingHorizontal: Spacing[2] }),
  },
  picker: { color: Colors.neutral[900] },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.neutral[150],
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  toggleLabel: { fontSize: FontSize.base, color: Colors.neutral[800], fontWeight: FontWeight.medium },
});
