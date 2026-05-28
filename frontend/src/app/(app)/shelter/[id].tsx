import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatAge, SPECIES_EMOJI } from '@/lib/format';
import { animalService } from '@/services/animal';
import type { Shelter } from '@/types/models';

export default function ShelterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shelter, setShelter] = useState<Shelter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    animalService.getShelter(Number(id)).then((s) => {
      setShelter(s);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (!shelter) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <EmptyState emoji="🔍" title="Притулок не знайдено" />
      </SafeAreaView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Шапка */}
      <View className="items-center bg-primary/5 px-5 pb-6 pt-6">
        <Avatar uri={shelter.logoUrl} name={shelter.name} size={80} emoji="🏠" />
        <View className="mt-3 flex-row items-center gap-1">
          <Text className="text-xl font-extrabold text-gray-900">{shelter.name}</Text>
          {shelter.isVerified ? <Text className="text-base">✅</Text> : null}
        </View>
        <Text className="mt-1 text-sm text-gray-500">
          📍 {shelter.city}, {shelter.address}
        </Text>
      </View>

      {/* Контакти / опис */}
      <View className="px-5 py-4">
        {shelter.description ? (
          <Text className="text-base leading-6 text-gray-600">{shelter.description}</Text>
        ) : null}
        {shelter.phone ? (
          <Text className="mt-3 text-base text-gray-700">📞 {shelter.phone}</Text>
        ) : null}
        {shelter.websiteUrl ? (
          <Text className="mt-1 text-base text-blue-500">🌐 {shelter.websiteUrl}</Text>
        ) : null}
      </View>

      {/* Тварини притулку */}
      <Text className="px-5 pb-2 pt-2 text-lg font-bold text-gray-900">
        Наші тваринки ({shelter.animals?.length ?? 0})
      </Text>
      <View className="flex-row flex-wrap px-3">
        {shelter.animals?.map((animal) => (
          <Pressable
            key={animal.id}
            onPress={() => router.push(`/(app)/animal/${animal.id}`)}
            className="w-1/2 p-2 active:opacity-80"
          >
            <Image
              source={{ uri: animal.primaryPhotoUrl }}
              style={{ width: '100%', height: 150, borderRadius: 16 }}
              contentFit="cover"
              transition={200}
            />
            <Text className="mt-1.5 text-base font-semibold text-gray-900">
              {SPECIES_EMOJI[animal.species]} {animal.name}
            </Text>
            <Text className="text-xs text-gray-500">{formatAge(animal.ageMonths)}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
