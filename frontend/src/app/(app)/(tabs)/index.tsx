import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { SwipeDeck } from '@/components/SwipeDeck';
import { useFeedStore } from '@/store/feed';
import type { Animal, SwipeDirection } from '@/types/models';

export default function FeedScreen() {
  const { cards, currentIndex, isLoading, loadFeed, swipe } = useFeedStore();
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadFeed();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  };

  const handleSwipe = (animal: Animal, direction: SwipeDirection) => {
    swipe(animal, direction);
    if (direction === 'RIGHT') showToast(`💚 ${animal.name} додано до вподобаних!`);
  };

  const isDone = !isLoading && currentIndex >= cards.length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Шапка */}
      <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
        <Text className="text-2xl font-extrabold text-primary">🐾 Swipet</Text>
        <Text className="text-sm text-gray-400">{cards.length - currentIndex} карток</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      ) : isDone ? (
        <EmptyState
          emoji="🎉"
          title="Це всі тваринки поблизу"
          subtitle="Загляни пізніше або зміни фільтри — нові улюбленці з'являються щодня"
        />
      ) : (
        <SwipeDeck
          cards={cards}
          currentIndex={currentIndex}
          onSwipe={handleSwipe}
          onOpenDetail={(animal) => router.push(`/(app)/animal/${animal.id}`)}
        />
      )}

      {/* Toast */}
      {toast ? (
        <Animated.View
          entering={FadeInUp}
          exiting={FadeOut}
          pointerEvents="none"
          className="absolute inset-x-0 top-20 items-center"
        >
          <View className="rounded-full bg-gray-900/90 px-5 py-3">
            <Text className="text-base font-semibold text-white">{toast}</Text>
          </View>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}
