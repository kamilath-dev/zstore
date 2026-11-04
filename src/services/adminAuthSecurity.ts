import bcrypt from 'bcryptjs';

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const MIN_BCRYPT_COST = 12;

export interface AdminAuthConfig {
  email: string;
  passwordHash: string;
}

export function isValidBcryptHash(hash: string): boolean {
  if (!BCRYPT_HASH_PATTERN.test(hash)) return false;
  const cost = Number.parseInt(hash.slice(4, 6), 10);
  return cost >= MIN_BCRYPT_COST && cost <= 31;
}

export function validateAdminAuthConfig(
  emailValue: string | undefined,
  passwordHashValue: string | undefined
): AdminAuthConfig {
  const email = emailValue?.trim().toLowerCase();
  const passwordHash = passwordHashValue?.trim();
  if (!email || !passwordHash) {
    throw new Error('ADMIN_EMAIL et ADMIN_PASSWORD_HASH doivent être configurés côté serveur.');
  }
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !isValidBcryptHash(passwordHash)
  ) {
    throw new Error('La configuration d’authentification administrateur est invalide.');
  }
  return { email, passwordHash };
}

export async function verifyAdminPassword(
  submittedEmail: string,
  password: string,
  configuredEmail: string,
  passwordHash: string
): Promise<boolean> {
  if (!isValidBcryptHash(passwordHash)) {
    throw new Error('ADMIN_PASSWORD_HASH must contain a valid bcrypt hash.');
  }
  const passwordMatches = await bcrypt.compare(password, passwordHash);
  return submittedEmail.trim().toLowerCase() === configuredEmail.trim().toLowerCase() &&
    passwordMatches;
}
