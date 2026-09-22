export type MiniappFrontendContentKind =
  | 'OWNED_PRODUCT'
  | 'CURATED_PRODUCT'
  | 'STORY'
  | 'TRACE';

export const MINIAPP_FRONTEND_ENTRIES = [
  { kind: 'OWNED_PRODUCT', title: '上传自有商品' },
  { kind: 'CURATED_PRODUCT', title: '上传甄选商品' },
  { kind: 'STORY', title: '小程序山野故事' },
  { kind: 'TRACE', title: '扫码溯源' }
] as const satisfies readonly {
  readonly kind: MiniappFrontendContentKind;
  readonly title: string;
}[];

export interface StoryDraft {
  readonly title: string;
  readonly summary: string;
  readonly body: string;
  readonly coverObjectKey: string;
}

export interface TraceDraft {
  readonly productId: string;
  readonly batchNo: string;
  readonly origin: string;
}

export function validateStoryDraft(draft: StoryDraft): readonly string[] {
  const errors: string[] = [];
  if (!draft.title.trim()) errors.push('STORY_TITLE_REQUIRED');
  if (!draft.summary.trim()) errors.push('STORY_SUMMARY_REQUIRED');
  if (!draft.body.trim()) errors.push('STORY_BODY_REQUIRED');
  return errors;
}

export function validateTraceDraft(draft: TraceDraft): readonly string[] {
  const errors: string[] = [];
  if (!draft.productId.trim()) errors.push('TRACE_PRODUCT_REQUIRED');
  if (!draft.batchNo.trim()) errors.push('TRACE_BATCH_REQUIRED');
  if (!draft.origin.trim()) errors.push('TRACE_ORIGIN_REQUIRED');
  return errors;
}
