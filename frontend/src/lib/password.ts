// Single source of truth for password rules on the client.
//
// MUST stay in sync with the backend contract (see docs/api/CONTRACT.md and
// backend RegisterRequest): password length 8..72 and at least one letter and
// one digit. The 72 upper bound matches BCrypt's hard byte limit on the
// backend. Anything beyond the minimum (length 12+, mixed case, special
// characters) only *strengthens* an already-valid password — it is NOT
// required, so the UI must never imply otherwise.

/**
 * Utility functions for client-side password validation and strength checking.
 */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

const hasLetter = (pw: string) => /[A-Za-z]/.test(pw);
const hasDigit = (pw: string) => /\d/.test(pw);
const hasSpecial = (pw: string) => /[^A-Za-z0-9]/.test(pw);
const hasMixedCase = (pw: string) => /[a-z]/.test(pw) && /[A-Z]/.test(pw);

/**
 * Returns an error message if the password violates the backend rule, or
 * `null` when it is acceptable. Mirrors the backend exactly so the client
 * never submits a password the server will reject.
 */
export function validatePassword(pw: string): string | null {
  if (!pw) return 'Password is required';
  if (pw.length < PASSWORD_MIN) return `At least ${PASSWORD_MIN} characters`;
  if (pw.length > PASSWORD_MAX) return `At most ${PASSWORD_MAX} characters`;
  if (!hasLetter(pw) || !hasDigit(pw)) {
    return 'Must contain at least one letter and one number';
  }
  return null;
}

export type Strength = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordAnalysis {
  strength: Strength;
  score: number;
  hint: string;
  /** True once the backend's hard requirements are satisfied. */
  meetsRequirements: boolean;
}

/**
 * Derives a strength label that is *consistent* with `validatePassword`:
 * a password can never read better than "fair" until it satisfies the backend
 * requirements (8+ chars, a letter and a number). Mixed case, extra length and
 * special characters are surfaced as optional upgrades, not as blockers.
 */
export function analyzePassword(pw: string): PasswordAnalysis {
  if (!pw) return { strength: 'empty', score: 0, hint: '', meetsRequirements: false };

  // Missing required pieces — these block registration on the backend.
  const missing: string[] = [];
  if (pw.length < PASSWORD_MIN) missing.push(`${PASSWORD_MIN}+ characters`);
  if (!hasLetter(pw)) missing.push('a letter');
  if (!hasDigit(pw)) missing.push('a number');

  const meetsRequirements = missing.length === 0 && pw.length <= PASSWORD_MAX;

  if (!meetsRequirements) {
    // Until the rule is satisfied, cap the meter so it can't look "good".
    const strength: Strength = missing.length >= 2 ? 'weak' : 'fair';
    const hint =
      pw.length > PASSWORD_MAX ? `At most ${PASSWORD_MAX} characters` : `Add ${missing[0]}`;
    return { strength, score: missing.length >= 2 ? 1 : 2, hint, meetsRequirements };
  }

  // Requirements met → score optional upgrades that make it stronger.
  let bonus = 0;
  if (pw.length >= 12) bonus++;
  if (hasMixedCase(pw)) bonus++;
  if (hasSpecial(pw)) bonus++;

  const strength: Strength = bonus >= 2 ? 'strong' : bonus === 1 ? 'good' : 'fair';

  let hint = '';
  if (strength !== 'strong') {
    if (pw.length < 12) hint = 'Add more characters';
    else if (!hasSpecial(pw)) hint = 'Add a special character';
    else if (!hasMixedCase(pw)) hint = 'Mix upper & lower case';
  }

  return { strength, score: 2 + bonus, hint, meetsRequirements };
}
