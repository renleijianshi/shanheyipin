import { describe, expect, it } from 'vitest';
import { isAdminAuthorized } from '../src/modules/admin/rbac.js';

describe('isAdminAuthorized', () => {
  it('allows an active administrator with every required permission', () => {
    expect(
      isAdminAuthorized(
        { status: 'active', permissions: new Set(['product:read', 'product:write']) },
        ['product:read', 'product:write']
      )
    ).toBe(true);
  });

  it('denies access when one required permission is missing', () => {
    expect(
      isAdminAuthorized(
        { status: 'active', permissions: new Set(['product:read']) },
        ['product:read', 'product:write']
      )
    ).toBe(false);
  });

  it('allows a wildcard permission for a super administrator', () => {
    expect(
      isAdminAuthorized({ status: 'active', permissions: new Set(['*']) }, ['finance:read'])
    ).toBe(true);
  });

  it('always denies a disabled administrator', () => {
    expect(
      isAdminAuthorized({ status: 'disabled', permissions: new Set(['*']) }, ['audit:read'])
    ).toBe(false);
  });
});
