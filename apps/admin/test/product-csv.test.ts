import { describe, expect, it } from 'vitest';
import { serializeProductsCsv } from '../web/product-csv.js';

describe('product CSV export', () => {
  it('includes the UTF-8 header and all current product fields as CRLF rows', () => {
    const csv = serializeProductsCsv([{
      publicId: 'QA-001',
      name: '内部验收商品 · 舟曲吊柿',
      category: '应季甄选',
      origin: '甘肃舟曲（内部测试资料）',
      status: '已下架',
      coverObjectKey: 'products/uploads/gift.png'
    }]);

    expect(csv.startsWith('\uFEFF"商品编号","名称","分类","产地","状态","封面对象键"\r\n')).toBe(true);
    expect(csv).toContain('"QA-001","内部验收商品 · 舟曲吊柿","应季甄选","甘肃舟曲（内部测试资料）","已下架","products/uploads/gift.png"');
    expect(csv.split('\r\n')).toHaveLength(2);
  });

  it('quotes delimiters and neutralizes spreadsheet formulas', () => {
    const csv = serializeProductsCsv([{
      publicId: 'QA-002',
      name: '=HYPERLINK("https://example.invalid")',
      category: '测试, 分类',
      origin: '甘肃',
      status: '草稿',
      coverObjectKey: ''
    }]);

    expect(csv).toContain('"QA-002","\'=HYPERLINK(""https://example.invalid"")","测试, 分类","甘肃","草稿",""');
  });
});
