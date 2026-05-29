import type { AnimalSize, Gender, Species } from '@/types/models';
import { Cat, Dog, Rabbit, PawPrint } from 'lucide-react-native';
import type { ComponentType } from 'react';

export function formatAge(ageMonths: number): string {
  if (ageMonths <= 0) return '< 1mo';
  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;
  if (years === 0) return `${months}mo`;
  if (months === 0) return `${years}y`;
  return `${years}y ${months}mo`;
}

export function formatDistance(km?: number): string {
  if (km == null) return '';
  if (km < 0.5) return 'nearby';
  return `${km.toFixed(1)} km`;
}

export function formatMessageTime(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now  = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export const SPECIES_EMOJI: Record<Species, string> = {
  DOG:    '🐶',
  CAT:    '🐱',
  RABBIT: '🐰',
  OTHER:  '🐾',
};

export const SPECIES_LABEL: Record<Species, string> = {
  DOG:    'Dog',
  CAT:    'Cat',
  RABBIT: 'Rabbit',
  OTHER:  'Other',
};

export const SIZE_LABEL: Record<AnimalSize, string> = {
  SMALL:  'Small',
  MEDIUM: 'Medium',
  LARGE:  'Large',
};

export const GENDER_LABEL: Record<Gender, string> = {
  MALE:   'Male',
  FEMALE: 'Female',
};

export const SPECIES_ICON: Record<
  Species,
  ComponentType<{ size: number; color: string; strokeWidth?: number }>
> = {
  DOG:    Dog,
  CAT:    Cat,
  RABBIT: Rabbit,
  OTHER:  PawPrint,
};