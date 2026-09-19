export interface AdminPrincipal {
  readonly status: 'active' | 'disabled';
  readonly permissions: ReadonlySet<string>;
}

export function isAdminAuthorized(
  principal: AdminPrincipal,
  requiredPermissions: readonly string[]
): boolean {
  if (principal.status !== 'active') {
    return false;
  }

  if (principal.permissions.has('*')) {
    return true;
  }

  return requiredPermissions.every((permission) => principal.permissions.has(permission));
}
