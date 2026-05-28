import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { formatAge, formatDistance, SPECIES_EMOJI } from '@/lib/format';
import type { Animal } from '@/types/models';

interface SwipeCardProps {
  animal: Animal;
  // Анімовані стилі прозорості для overlay-міток (передає SwipeDeck)
  likeStyle?: object;
  nopeStyle?: object;
}

export function SwipeCard({ animal, likeStyle, nopeStyle }: SwipeCardProps) {
  return (
    <View className="flex-1 overflow-hidden rounded-3xl bg-gray-200">
      <Image
        source={{ uri: animal.primaryPhotoUrl }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={250}
      />

      {/* Затемнення знизу — щоб білий текст читався поверх фото */}
      <View
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{ backgroundColor: 'transparent' }}
      >
        <View className="flex-1 justify-end bg-black/40 p-5">
          <View className="flex-row items-end justify-between">
            <View className="flex-1">
              <Text className="text-3xl font-extrabold text-white" numberOfLines={1}>
                {animal.name}
                {'  '}
                <Text className="text-2xl font-medium text-white/90">
                  {formatAge(animal.ageMonths)}
                </Text>
              </Text>
              {animal.breed ? (
                <Text className="mt-1 text-base text-white/80" numberOfLines={1}>
                  {SPECIES_EMOJI[animal.species]} {animal.breed}
                </Text>
              ) : null}
              <Text className="mt-1 text-sm text-white/70" numberOfLines={1}>
                🏠 {animal.shelterName} · 📍 {formatDistance(animal.distanceKm)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Overlay LIKE — з'являється при свайпі вправо */}
      <Animated.View
        pointerEvents="none"
        style={likeStyle}
        className="absolute left-5 top-8 -rotate-12 rounded-xl border-4 border-green-400 px-4 py-1"
      >
        <Text className="text-3xl font-extrabold text-green-400">LIKE</Text>
      </Animated.View>

      {/* Overlay NOPE — при свайпі вліво */}
      <Animated.View
        pointerEvents="none"
        style={nopeStyle}
        className="absolute right-5 top-8 rotate-12 rounded-xl border-4 border-red-500 px-4 py-1"
      >
        <Text className="text-3xl font-extrabold text-red-500">NOPE</Text>
      </Animated.View>
    </View>
  );
}
