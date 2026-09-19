import type { AppManifest } from '@shanheyipin/shared-types';

export const apiManifest: AppManifest = {
  kind: 'api',
  name: '山禾颐品 API',
  status: 'bootstrap'
};

export function getHealthStatus() {
  return { service: 'api', status: 'ok' } as const;
}
