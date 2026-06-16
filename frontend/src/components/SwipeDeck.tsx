import { Heart, Info, X } from 'lucide-react-native';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
 
import { SwipeCard } from '@/components/SwipeCard';
import { Colors, Shadow, Spacing } from '@/lib/theme';
import type { Animal, SwipeDirection } from '@/types/models';
 
/**
 * Core feed component managing the stack of SwipeCards.
 * Handles gestures, swipe logic, and loading more animals from the feed store.
 */
const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.28;
const VELOCITY_THRESHOLD = 500;
const EXIT_X = SCREEN_W * 1.6;
const EXIT_DURATION = 380;
 
// Floating tab bar geometry — must match TabsLayout values
const TAB_BAR_HEIGHT   = 72;
const TAB_BAR_MARGIN_B = 12;
const TAB_BAR_CLEARANCE = TAB_BAR_HEIGHT + TAB_BAR_MARGIN_B + 12;
 
//  TopCard
interface TopCardRef {
  swipeLeft: () => void;
  swipeRight: () => void;
}
 
interface TopCardProps {
  animal: Animal;
  swipeProgress: SharedValue<number>;
  onSwipeDone: (direction: SwipeDirection) => void;
  onPress?: () => void;
}
 
const TopCard = forwardRef<TopCardRef, TopCardProps>(
  ({ animal, swipeProgress, onSwipeDone, onPress }, ref) => {
    const x = useSharedValue(0);
    const y = useSharedValue(0);
    // Гард від подвійного свайпу однієї картки та від переривання жестів
    const isExiting = useSharedValue(false);

    const animateExit = useCallback(
      (direction: SwipeDirection) => {
        'worklet';
        if (isExiting.value) return;
        isExiting.value = true;
        const toX = direction === 'RIGHT' ? EXIT_X : -EXIT_X;
        x.value = withTiming(toX, { duration: EXIT_DURATION }, (finished) => {
          if (finished) {
            swipeProgress.value = withSpring(0);
            runOnJS(onSwipeDone)(direction);
          } else {
            // Фолбек: якщо анімація раптом перервана, все одно завершуємо свайп
            runOnJS(onSwipeDone)(direction);
          }
        });
        y.value = withTiming(-24, { duration: EXIT_DURATION });
      },
      [onSwipeDone, swipeProgress, x, y, isExiting],
    );
 
    useImperativeHandle(ref, () => ({
      swipeLeft:  () => animateExit('LEFT'),
      swipeRight: () => animateExit('RIGHT'),
    }));
 
    const isWeb = Platform.OS === 'web';
    
    const pan = Gesture.Pan()
      .enabled(!isWeb)
      .onUpdate((e) => {
        if (isExiting.value) return;
        x.value = e.translationX;
        y.value = e.translationY * 0.18;
        swipeProgress.value = Math.min(Math.abs(e.translationX) / SWIPE_THRESHOLD, 1);
      })
      .onEnd((e) => {
        if (isExiting.value) return;
        const goRight = e.translationX > SWIPE_THRESHOLD || e.velocityX > VELOCITY_THRESHOLD;
        const goLeft  = e.translationX < -SWIPE_THRESHOLD || e.velocityX < -VELOCITY_THRESHOLD;
 
        if (goRight) {
          animateExit('RIGHT');
        } else if (goLeft) {
          animateExit('LEFT');
        } else {
          x.value = withSpring(0, { damping: 18, stiffness: 180, mass: 0.9 });
          y.value = withSpring(0, { damping: 18, stiffness: 180, mass: 0.9 });
          swipeProgress.value = withSpring(0, { damping: 18, stiffness: 180 });
        }
      });
 
    const cardStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: x.value },
        { translateY: y.value },
        {
          rotateZ: `${interpolate(
            x.value,
            [-SCREEN_W / 2, 0, SCREEN_W / 2],
            [-13, 0, 13],
            Extrapolation.CLAMP,
          )}deg`,
        },
      ],
    }));
 
    const likeStyle = useAnimatedStyle(() => ({
      opacity: interpolate(x.value, [0, SWIPE_THRESHOLD * 0.6], [0, 1], Extrapolation.CLAMP),
    }));
 
    const nopeStyle = useAnimatedStyle(() => ({
      opacity: interpolate(x.value, [-SWIPE_THRESHOLD * 0.6, 0], [1, 0], Extrapolation.CLAMP),
    }));
 
    return (
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.cardWrapper, cardStyle]}>
          <SwipeCard
            animal={animal}
            likeStyle={likeStyle}
            nopeStyle={nopeStyle}
            onPress={isWeb ? undefined : (onPress ? () => onPress() : undefined)}
          />
        </Animated.View>
      </GestureDetector>
    );
  },
);
TopCard.displayName = 'TopCard';
 
//  SwipeDeck
interface SwipeDeckProps {
  cards: Animal[];
  currentIndex: number;
  onSwipe: (animal: Animal, direction: SwipeDirection) => void;
  onOpenDetail?: (animal: Animal) => void;
}
 
export function SwipeDeck({ cards, currentIndex, onSwipe, onOpenDetail }: SwipeDeckProps) {
  const insets = useSafeAreaInsets();
  const swipeProgress = useSharedValue(0);
  const topCardRef = useRef<TopCardRef>(null);
 
  const top     = cards[currentIndex];
  const behind1 = cards[currentIndex + 1];
  const behind2 = cards[currentIndex + 2];
 
  const handleSwipeDone = useCallback(
    (direction: SwipeDirection) => {
      if (top) onSwipe(top, direction);
    },
    [top, onSwipe],
  );
 
  const behind1Style = useAnimatedStyle(() => ({
    transform: [
      { scale:      interpolate(swipeProgress.value, [0, 1], [0.945, 1.0],  Extrapolation.CLAMP) },
      { translateY: interpolate(swipeProgress.value, [0, 1], [16,    0],    Extrapolation.CLAMP) },
    ],
    opacity: interpolate(swipeProgress.value, [0, 0.4], [0.82, 1.0], Extrapolation.CLAMP),
  }));
 
  const behind2Style = useAnimatedStyle(() => ({
    transform: [
      { scale:      interpolate(swipeProgress.value, [0, 1], [0.89, 0.945], Extrapolation.CLAMP) },
      { translateY: interpolate(swipeProgress.value, [0, 1], [32,   16],    Extrapolation.CLAMP) },
    ],
    opacity: interpolate(swipeProgress.value, [0, 0.6], [0.60, 0.82], Extrapolation.CLAMP),
  }));
 
  // Total bottom padding = safe area + tab bar pill + its margin from edge
  const actionBarPaddingBottom = insets.bottom + TAB_BAR_CLEARANCE;
 
  return (
    <View style={styles.container}>
      {/* ── Card stack ───────────────────────── */}
      <View style={styles.stack}>
        {behind2 && (
          <Animated.View style={[styles.cardWrapper, behind2Style]}>
            <SwipeCard animal={behind2} />
          </Animated.View>
        )}
        {behind1 && (
          <Animated.View style={[styles.cardWrapper, behind1Style]}>
            <SwipeCard animal={behind1} />
          </Animated.View>
        )}
        {top && (
          <TopCard
            key={top.id}
            ref={topCardRef}
            animal={top}
            swipeProgress={swipeProgress}
            onSwipeDone={handleSwipeDone}
            onPress={onOpenDetail ? () => onOpenDetail(top) : undefined}
          />
        )}
      </View>
 
      {/* ── Action buttons ───────────────────── */}
      <View style={[styles.buttonsRow, { paddingBottom: actionBarPaddingBottom }]}>
        <ActionBtn
          onPress={() => topCardRef.current?.swipeLeft()}
          size={64}
          borderColor={Colors.error}
          shadowStyle={null}
        >
          <X size={26} color={Colors.error} strokeWidth={2.5} />
        </ActionBtn>
 
        {top && onOpenDetail && (
          <ActionBtn
            onPress={() => onOpenDetail(top)}
            size={52}
            borderColor={Colors.neutral[200]}
            shadowStyle={null}
          >
            <Info size={20} color={Colors.neutral[400]} strokeWidth={2} />
          </ActionBtn>
        )}
 
        <ActionBtn
          onPress={() => topCardRef.current?.swipeRight()}
          size={64}
          borderColor={Colors.primary[500]}
          shadowStyle={Shadow.orange}
        >
          <Heart size={26} color={Colors.primary[500]} fill={Colors.primary[500]} strokeWidth={0} />
        </ActionBtn>
      </View>
    </View>
  );
}
 
//  ActionBtn
interface ActionBtnProps {
  onPress: () => void;
  size: number;
  borderColor: string;
  shadowStyle: object | null;
  children: React.ReactNode;
}
 
function ActionBtn({ onPress, size, borderColor, shadowStyle, children }: ActionBtnProps) {
  const scale = useSharedValue(1);
 
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
 
  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.86, { damping: 14, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1.0, { damping: 14, stiffness: 320 });
      }}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.actionBtn,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor,
          },
          shadowStyle ?? Shadow.sm,
          animStyle,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stack: {
    flex: 1,
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[2],
  },
  cardWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[5],
    paddingTop: Spacing[5],
    // paddingBottom is set dynamically via insets + tab bar clearance
  },
  actionBtn: {
    backgroundColor: Colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
 