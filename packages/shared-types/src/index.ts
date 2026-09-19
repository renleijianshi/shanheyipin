export type AppKind = 'api' | 'admin' | 'miniapp';

export interface AppManifest {
  readonly kind: AppKind;
  readonly name: string;
  readonly status: 'bootstrap';
}
