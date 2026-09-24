export type ProductCsvRecord = {
  publicId: string;
  name: string;
  category: string;
  origin: string;
  status: string;
  coverObjectKey: string;
};

const headers = ['商品编号', '名称', '分类', '产地', '状态', '封面对象键'];

function cell(value: string): string {
  const safe = /^[=+@\-\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function serializeProductsCsv(records: readonly ProductCsvRecord[]): string {
  const rows = [headers, ...records.map((record) => [
    record.publicId,
    record.name,
    record.category,
    record.origin,
    record.status,
    record.coverObjectKey
  ])];
  return `\uFEFF${rows.map((row) => row.map(cell).join(',')).join('\r\n')}`;
}
