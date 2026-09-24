import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

export interface AdminSessionPrincipal {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly permissions: ReadonlySet<string>;
}

export interface AdminAuthRepository {
  findUser(username: string): Promise<{
    readonly id: string;
    readonly username: string;
    readonly displayName: string;
    readonly passwordHash: string;
    readonly status: 'ACTIVE' | 'DISABLED';
  } | null>;
  createSession(input: { readonly adminUserId: string; readonly tokenHash: string; readonly expiresAt: Date }): Promise<void>;
  findSession(tokenHash: string, now: Date): Promise<{
    readonly id: string;
    readonly username: string;
    readonly displayName: string;
    readonly status: 'ACTIVE' | 'DISABLED';
    readonly permissions: readonly string[];
  } | null>;
  revokeSession(tokenHash: string, at: Date): Promise<void>;
}

export class AdminAuthService {
  constructor(private readonly repository: AdminAuthRepository, private readonly now = () => new Date()) {}

  async login(username: string, password: string): Promise<{ readonly accessToken: string; readonly expiresAt: Date; readonly admin: Omit<AdminSessionPrincipal, 'permissions'> }> {
    const normalized = username.trim();
    if (!normalized || normalized.length > 64 || password.length < 1 || password.length > 256) throw new Error('Invalid credentials');
    const user = await this.repository.findUser(normalized);
    if (!user || user.status !== 'ACTIVE' || !(await verifyAdminPassword(password, user.passwordHash))) throw new Error('Invalid credentials');
    const accessToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(this.now().getTime() + SESSION_TTL_MS);
    await this.repository.createSession({ adminUserId: user.id, tokenHash: hashToken(accessToken), expiresAt });
    return { accessToken, expiresAt, admin: { id: user.id, username: user.username, displayName: user.displayName } };
  }

  async authenticate(accessToken: string | null): Promise<AdminSessionPrincipal | null> {
    if (!accessToken || accessToken.length > 256 || !/^[A-Za-z0-9_-]{40,100}$/.test(accessToken)) return null;
    const session = await this.repository.findSession(hashToken(accessToken), this.now());
    if (!session || session.status !== 'ACTIVE') return null;
    return { id: session.id, username: session.username, displayName: session.displayName, permissions: new Set(session.permissions) };
  }

  async logout(accessToken: string | null): Promise<void> {
    if (accessToken && /^[A-Za-z0-9_-]{40,100}$/.test(accessToken)) {
      await this.repository.revokeSession(hashToken(accessToken), this.now());
    }
  }
}

export async function hashAdminPassword(password: string): Promise<string> {
  if (password.length < 12 || password.length > 256) throw new Error('Admin password must be 12 to 256 characters');
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt, 64);
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

async function verifyAdminPassword(password: string, encoded: string): Promise<boolean> {
  const [scheme, nText, rText, pText, saltText, keyText] = encoded.split('$');
  if (scheme !== 'scrypt' || nText !== String(SCRYPT_N) || rText !== String(SCRYPT_R) || pText !== String(SCRYPT_P) || !saltText || !keyText) return false;
  try {
    const salt = Buffer.from(saltText, 'base64url');
    const expected = Buffer.from(keyText, 'base64url');
    if (salt.length !== 16 || expected.length !== 64) return false;
    const actual = await deriveKey(password, salt, expected.length);
    return timingSafeEqual(actual, expected);
  } catch { return false; }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function deriveKey(password: string, salt: Buffer, length: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(password, salt, length, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}
