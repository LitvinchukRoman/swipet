import { Text, View } from 'react-native';

interface TagProps {
  label: string;
  icon?: string;
  tone?: 'neutral' | 'success' | 'primary';
}

const TONE: Record<NonNullable<TagProps['tone']>, string> = {
  neutral: 'bg-gray-100',
  success: 'bg-green-100',
  primary: 'bg-primary/10',
};

const TONE_TEXT: Record<NonNullable<TagProps['tone']>, string> = {
  neutral: 'text-gray-700',
  success: 'text-green-700',
  primary: 'text-primary',
};

/** Маленька «пігулка» для характеристик: порода, розмір, вакцинація тощо. */
export function Tag({ label, icon, tone = 'neutral' }: TagProps) {
  return (
    <View className={`flex-row items-center gap-1 rounded-full px-3 py-1.5 ${TONE[tone]}`}>
      {icon ? <Text className="text-xs">{icon}</Text> : null}
      <Text className={`text-xs font-medium ${TONE_TEXT[tone]}`}>{label}</Text>
    </View>
  );
}
