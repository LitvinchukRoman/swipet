import { ActivityIndicator, Pressable, Text } from 'react-native';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

// Класи фону/рамки під кожен варіант
const CONTAINER: Record<Variant, string> = {
  primary: 'bg-primary active:bg-primary-dark',
  outline: 'border border-primary bg-transparent active:bg-primary/10',
  ghost: 'bg-transparent active:bg-gray-100',
};

// Класи тексту під кожен варіант
const LABEL: Record<Variant, string> = {
  primary: 'text-white',
  outline: 'text-primary',
  ghost: 'text-gray-700',
};

const PADDING: Record<Size, string> = {
  md: 'py-3 px-5',
  lg: 'py-4 px-6',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center rounded-2xl ${CONTAINER[variant]} ${PADDING[size]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#FF6B6B'} />
      ) : (
        <Text className={`text-base font-semibold ${LABEL[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
