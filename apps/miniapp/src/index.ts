import type { AppManifest } from '@shanheyipin/shared-types';

export const miniappManifest: AppManifest = {
  kind: 'miniapp',
  name: '山禾颐品小程序',
  status: 'bootstrap'
};

export * from './v12-catalog-controller.js';
export * from './v12-ports.js';
export * from './v12-ui-model.js';
