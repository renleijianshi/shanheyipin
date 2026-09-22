import { describe, expect, it } from 'vitest';
import {
  MINIAPP_FRONTEND_ENTRIES,
  validateStoryDraft,
  validateTraceDraft
} from '../src/miniapp-frontend-content-model.js';

describe('admin miniapp frontend module', () => {
  it('contains the four confirmed entrances', () => {
    expect(MINIAPP_FRONTEND_ENTRIES.map((entry) => entry.title)).toEqual([
      '上传自有商品', '上传甄选商品', '小程序山野故事', '扫码溯源'
    ]);
  });

  it('keeps M37 and M38 drafts behind explicit validation boundaries', () => {
    expect(validateStoryDraft({ title: '', summary: '', body: '', coverObjectKey: '' })).toEqual([
      'STORY_TITLE_REQUIRED', 'STORY_SUMMARY_REQUIRED', 'STORY_BODY_REQUIRED'
    ]);
    expect(validateTraceDraft({ productId: '', batchNo: '', origin: '' })).toEqual([
      'TRACE_PRODUCT_REQUIRED', 'TRACE_BATCH_REQUIRED', 'TRACE_ORIGIN_REQUIRED'
    ]);
  });
});
