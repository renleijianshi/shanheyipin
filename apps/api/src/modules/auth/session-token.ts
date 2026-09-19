import { createHash, randomBytes } from 'node:crypto';
import type { SessionTokenFactory } from './wechat-login-service.js';

export class SecureSessionTokenFactory implements SessionTokenFactory {
  create() {
    const raw = randomBytes(32).toString('base64url');
    const hash = createHash('sha256').update(raw).digest('hex');
    return { raw, hash } as const;
  }
}
