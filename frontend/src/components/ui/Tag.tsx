import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface TagProps {
  label: string;
  /**
   * Optional leading icon — accepts either:
   *  - a string (emoji): rendered inside a <Text>
   *  - a ReactNode (e.g. Lucide icon): rendered directly
   */
  icon?: ReactNode;
  tone?: 'neutral' | 'success' | 'primary' | 'warning';
}

// NativeWind classes per tone — must be full class names (no dynamic concat)
const BG: Record<NonNullable<TagProps['tone']>, string> = {
  neutral: 'bg-stone-100',
  success: 'bg-green-50',
  primary: 'bg-orange-50',
  warning: 'bg-yellow-50',
};

const TEXT_COLOR: Record<NonNullable<TagProps['tone']>, string> = {
  neutral: 'text-stone-600',
  success: 'text-green-700',
  primary: 'text-orange-600',
  warning: 'text-yellow-700',
};

export function Tag({ label, icon, tone = 'neutral' }: TagProps) {
  return (
    <View
      className={`flex-row items-center self-start rounded-full px-2.5 py-1 ${BG[tone]}`}
      style={{ gap: 4 }}
    >
      {icon != null ? (
        typeof icon === 'string' ? (
          <Text className="text-xs leading-none">{icon}</Text>
        ) : (
          icon
        )
      ) : null}
      <Text className={`text-xs font-semibold ${TEXT_COLOR[tone]}`}>{label}</Text>
    </View>
  );
}