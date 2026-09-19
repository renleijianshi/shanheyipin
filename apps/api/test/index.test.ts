import { describe, expect, it } from 'vitest';
import { apiManifest, getHealthStatus } from '../src/index.js';

describe('api bootstrap', () => {
  it('exposes an API application manifest', () => {
    expect(apiManifest).toEqual({
      kind: 'api',
      name: '山禾颐品 API',
      status: 'bootstrap'
    });
  });

  it('reports a healthy bootstrap process', () => {
    expect(getHealthStatus()).toEqual({ service: 'api', status: 'ok' });
  });
});
