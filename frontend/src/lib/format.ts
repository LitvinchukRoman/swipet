import type { AnimalSize, Gender, Species } from '@/types/models';

// Українська форма слова "місяць"/"рік" залежно від числа.
function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

/** 5 → "5 міс", 14 → "1 рік 2 міс", 24 → "2 роки" */
export function formatAge(ageMonths: number): string {
  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;

  if (years === 0) {
    return `${months} ${plural(months, 'місяць', 'місяці', 'місяців')}`;
  }

  const yearStr = `${years} ${plural(years, 'рік', 'роки', 'років')}`;
  if (months === 0) return yearStr;
  return `${yearStr} ${months} ${plural(months, 'місяць', 'місяці', 'місяців')}`;
}

/** 2.34 → "2.3 км", 0.4 → "поруч" */
export function formatDistance(km?: number): string {
  if (km == null) return '';
  if (km < 1) return 'поруч';
  return `${km.toFixed(1)} км`;
}

/** ISO-рядок → "14:05" або "вчора" або "24.05" */
export function formatMessageTime(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'вчора';
  return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
}

export const SPECIES_EMOJI: Record<Species, string> = {
  DOG: '🐶',
  CAT: '🐱',
  RABBIT: '🐰',
  OTHER: '🐾',
};

export const SPECIES_LABEL: Record<Species, string> = {
  DOG: 'Собака',
  CAT: 'Кіт',
  RABBIT: 'Кролик',
  OTHER: 'Інше',
};

export const SIZE_LABEL: Record<AnimalSize, string> = {
  SMALL: 'Малий',
  MEDIUM: 'Середній',
  LARGE: 'Великий',
};

export const GENDER_LABEL: Record<Gender, string> = {
  MALE: 'Хлопчик',
  FEMALE: 'Дівчинка',
};
