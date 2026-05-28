import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tag } from '@/components/ui/Tag';
import {
  formatAge,
  formatDistance,
  GENDER_LABEL,
  SIZE_LABEL,
  SPECIES_EMOJI,
  SPECIES_LABEL,
} from '@/lib/format';
import { animalService } from '@/services/animal';
import { chatService } from '@/services/chat';
import type { Animal } from '@/types/models';

const { width: SCREEN_W } = Dimensions.get('window');

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    animalService.getById(Number(id)).then((a) => {
      setAnimal(a);
      setLoading(false);
    });
  }, [id]);

  const openChat = async () => {
    if (!animal) return;
    const { roomId } = await chatService.createRoom(animal.id, animal.shelterId);
    router.push(`/(app)/chat/${roomId}`);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (!animal) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <EmptyState emoji="🔍" title="Тваринку не знайдено" />
      </SafeAreaView>
    );
  }

  const photos = animal.photos.length ? animal.photos : [animal.primaryPhotoUrl ?? ''];

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Карусель фото */}
        <View>
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={(e) =>
              setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))
            }
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={{ width: SCREEN_W, height: SCREEN_W }}
                contentFit="cover"
                transition={250}
              />
            )}
          />
          {/* Точки-індикатори */}
          {photos.length > 1 ? (
            <View className="absolute bottom-3 w-full flex-row justify-center gap-1.5">
              {photos.map((_, i) => (
                <View
                  key={i}
                  className={`h-2 rounded-full ${
                    i === photoIndex ? 'w-5 bg-white' : 'w-2 bg-white/50'
                  }`}
                />
              ))}
            </View>
          ) : null}
        </View>

        {/* Інфо */}
        <View className="p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-3xl font-extrabold text-gray-900">{animal.name}</Text>
            <Text className="text-xl text-gray-400">
              {animal.gender === 'MALE' ? '♂️' : '♀️'} {GENDER_LABEL[animal.gender]}
            </Text>
          </View>
          <Text className="mt-1 text-base text-gray-500">
            {SPECIES_EMOJI[animal.species]} {animal.breed ?? SPECIES_LABEL[animal.species]} ·{' '}
            {formatAge(animal.ageMonths)}
          </Text>

          {/* Характеристики */}
          <View className="mt-4 flex-row flex-wrap gap-2">
            <Tag label={SIZE_LABEL[animal.size]} icon="📏" />
            {animal.isVaccinated ? <Tag label="Вакцинований" icon="💉" tone="success" /> : null}
            {animal.isSterilized ? <Tag label="Стерилізований" icon="✓" tone="success" /> : null}
          </View>

          {/* Опис */}
          {animal.description ? (
            <>
              <Text className="mt-6 text-lg font-bold text-gray-900">Про мене</Text>
              <Text className="mt-2 text-base leading-6 text-gray-600">
                {animal.description}
              </Text>
            </>
          ) : null}

          {/* Притулок */}
          <View className="mt-6 rounded-2xl bg-gray-50 p-4">
            <Text className="text-sm text-gray-400">Притулок</Text>
            <Text className="mt-1 text-base font-semibold text-gray-900">
              🏠 {animal.shelterName}
            </Text>
            <Text className="mt-0.5 text-sm text-gray-500">
              📍 {formatDistance(animal.distanceKm)} від тебе
            </Text>
            <Button
              label="Профіль притулку"
              variant="ghost"
              size="md"
              className="mt-2 self-start"
              onPress={() => router.push(`/(app)/shelter/${animal.shelterId}`)}
            />
          </View>
        </View>
      </ScrollView>

      {/* Закріплені дії знизу */}
      <SafeAreaView edges={['bottom']} className="border-t border-gray-100 bg-white">
        <View className="flex-row gap-3 px-5 py-3">
          <Button label="💰 Підтримати" variant="outline" className="flex-1" onPress={() => {}} />
          <Button label="✉️ Написати" className="flex-1" onPress={openChat} />
        </View>
      </SafeAreaView>
    </View>
  );
}
