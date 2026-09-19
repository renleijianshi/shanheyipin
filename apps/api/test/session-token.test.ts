import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { SecureSessionTokenFactory } from '../src/modules/auth/session-token.js';

describe('SecureSessionTokenFactory', () => {
  it('returns a random opaque token and only its SHA-256 hash for storage', () => {
    const factory = new SecureSessionTokenFactory();
    const first = factory.create();
    const second = factory.create();

    expect(first.raw).not.toBe(second.raw);
    expect(first.hash).toBe(createHash('sha256').update(first.raw).digest('hex'));
    expect(first.hash).not.toContain(first.raw);
  });
});
