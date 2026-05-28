import { useCallback } from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { SwipeCard } from '@/components/SwipeCard';
import type { Animal, SwipeDirection } from '@/types/models';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.25; // чверть екрана — поріг спрацювання
const EXIT_X = SCREEN_W * 1.5; // куди відлітає картка

interface SwipeDeckProps {
  cards: Animal[];
  currentIndex: number;
  onSwipe: (animal: Animal, direction: SwipeDirection) => void;
  onOpenDetail?: (animal: Animal) => void;
}

export function SwipeDeck({ cards, currentIndex, onSwipe, onOpenDetail }: SwipeDeckProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const top = cards[currentIndex];
  const behind = cards[currentIndex + 1];

  // Єдиний шлях анімації виходу — використовується і жестом, і кнопками.
  const animateExit = useCallback(
    (direction: SwipeDirection) => {
      if (!top) return;
      const toX = direction === 'RIGHT' ? EXIT_X : -EXIT_X;
      translateX.value = withTiming(toX, { duration: 250 }, (finished) => {
        'worklet';
        if (finished) {
          translateX.value = 0;
          translateY.value = 0;
          runOnJS(onSwipe)(top, direction);
        }
      });
    },
    [top, onSwipe, translateX, translateY]
  );

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
        const dir: SwipeDirection = e.translationX > 0 ? 'RIGHT' : 'LEFT';
        runOnJS(animateExit)(dir);
      } else {
        // не дотягнув — пружинка повертає на місце
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      {
        rotateZ: `${interpolate(
          translateX.value,
          [-SCREEN_W, 0, SCREEN_W],
          [-10, 0, 10],
          Extrapolation.CLAMP
        )}deg`,
      },
    ],
  }));

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View className="flex-1">
      {/* Стос карток */}
      <View className="flex-1 px-4">
        {/* Картка позаду (наступна) — статична, трохи зменшена */}
        {behind ? (
          <View
            className="absolute inset-x-4 inset-y-0"
            style={{ transform: [{ scale: 0.95 }], opacity: 0.8 }}
          >
            <SwipeCard animal={behind} />
          </View>
        ) : null}

        {/* Верхня картка — з жестом */}
        {top ? (
          <GestureDetector gesture={pan}>
            <Animated.View className="absolute inset-x-4 inset-y-0" style={cardStyle}>
              <SwipeCard animal={top} likeStyle={likeStyle} nopeStyle={nopeStyle} />
            </Animated.View>
          </GestureDetector>
        ) : null}
      </View>

      {/* Кнопки дій */}
      <View className="flex-row items-center justify-center gap-5 py-5">
        <CircleButton emoji="✕" color="#EF4444" onPress={() => animateExit('LEFT')} />
        {onOpenDetail && top ? (
          <CircleButton emoji="ℹ️" color="#3B82F6" small onPress={() => onOpenDetail(top)} />
        ) : null}
        <CircleButton emoji="♥" color="#22C55E" onPress={() => animateExit('RIGHT')} />
      </View>
    </View>
  );
}

function CircleButton({
  emoji,
  color,
  onPress,
  small,
}: {
  emoji: string;
  color: string;
  onPress: () => void;
  small?: boolean;
}) {
  const size = small ? 52 : 64;
  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center rounded-full bg-white active:opacity-70"
      style={{
        width: size,
        height: size,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
      }}
    >
      <Text style={{ fontSize: small ? 20 : 26, color }}>{emoji}</Text>
    </Pressable>
  );
}
