import type { FeedFilters } from '@/types/models';

/** Радіус за замовчуванням — не вважається активним фільтром. */
export const DEFAULT_RADIUS_KM = 50;

/**
 * Єдине джерело правди для лічильника активних фільтрів.
 * Раніше стрічка рахувала `radiusKm: 50` як активний (бо truthy), а sheet — ні,
 * тож бейдж показував «1» при дефолтах. Тепер логіка однакова в обох місцях.
 */
export function countActiveFilters(f: FeedFilters): number {
  return (
    [f.species, f.size, f.ageMax].filter(Boolean).length +
    (f.radiusKm != null && f.radiusKm !== DEFAULT_RADIUS_KM ? 1 : 0)
  );
}
