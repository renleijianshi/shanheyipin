const miniappEnv = (import.meta as ImportMeta & { readonly env?: { readonly VITE_MEDIA_BASE_URL?: string } }).env;

export function resolvePublicMediaUrl(objectKey: string | null | undefined, baseUrl = miniappEnv?.VITE_MEDIA_BASE_URL ?? ''): string {
  const base = baseUrl.trim().replace(/\/+$/, '');
  const key = objectKey?.trim().replace(/^\/+/, '') ?? '';
  if (!base || !key || /^https?:\/\//i.test(key)) return '';

  const segments = key.split('/');
  if (segments.some((segment) => segment === '.' || segment === '..')) return '';
  return `${base}/${segments.map(encodeURIComponent).join('/')}`;
}
