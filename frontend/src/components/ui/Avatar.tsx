import { Image } from 'expo-image';
import { Text, View } from 'react-native';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  emoji?: string;
}

/** Кругла аватарка: показує фото, або emoji, або першу літеру імені. */
export function Avatar({ uri, name, size = 48, emoji }: AvatarProps) {
  const radius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius }}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View
      className="items-center justify-center bg-primary/15"
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <Text style={{ fontSize: size * 0.4 }}>
        {emoji ?? name?.charAt(0)?.toUpperCase() ?? '🐾'}
      </Text>
    </View>
  );
}
