import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';
// import { userService } from '@/services/user'; // ← коли бекенд готовий (ТЗ 3.2)

export default function EditProfileScreen() {
  const { user, updateUser } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!fullName.trim()) {
      Alert.alert('Помилка', "Ім'я не може бути порожнім");
      return;
    }
    setSaving(true);
    // TODO: await userService.updateMe({ fullName, phone });
    await updateUser({ fullName: fullName.trim(), phone: phone.trim() || undefined });
    setSaving(false);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <View className="items-center py-6">
        <Avatar uri={user?.avatarUrl} name={fullName} size={96} />
        <Pressable className="mt-2 active:opacity-60">
          <Text className="text-sm font-semibold text-primary">Змінити фото</Text>
        </Pressable>
      </View>

      <View className="gap-4 px-5">
        <View>
          <Text className="mb-1.5 text-sm font-medium text-gray-500">Ім'я та прізвище</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base"
            placeholder="Ваше ім'я"
          />
        </View>

        <View>
          <Text className="mb-1.5 text-sm font-medium text-gray-500">Телефон</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base"
            placeholder="+380..."
          />
        </View>

        <Button label="Зберегти" loading={saving} onPress={save} className="mt-2" />
      </View>
    </SafeAreaView>
  );
}
