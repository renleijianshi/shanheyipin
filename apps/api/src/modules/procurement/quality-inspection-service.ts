import { createHash } from 'node:crypto';

export const QUALITY_INSPECTION_CONCLUSIONS = ['PASS', 'DOWNGRADE', 'PARTIAL_REJECT', 'REJECT_ALL'] as const;
export type QualityInspectionConclusion = typeof QUALITY_INSPECTION_CONCLUSIONS[number];

export interface QualityInspectionInput {
  readonly sampleQuantity: number;
  readonly acceptedQuantity: number;
  readonly downgradedQuantity: number;
  readonly rejectedQuantity: number;
  readonly appearance: string | null;
  readonly sizeObservation: string | null;
  readonly firmness: string | null;
  readonly bloom: string | null;
  readonly dryness: string | null;
  readonly damage: string | null;
  readonly mold: string | null;
  readonly foreignMatter: string | null;
  readonly odor: string | null;
  readonly qualityGrade: string | null;
  readonly sampleImageObjectKeys: readonly string[];
  readonly conclusion: QualityInspectionConclusion;
  readonly note: string | null;
}

export interface QualityInspection extends QualityInspectionInput {
  readonly id: string;
  readonly receiptId: string;
  readonly receiptNo: string;
  readonly skuId: string;
  readonly skuName: string;
  readonly inspectorAdminId: string;
  readonly createdAt: string;
}

export interface QualityInspectionRepository {
  create(input: QualityInspectionInput, context: {
    readonly receiptId: string;
    readonly skuId: string;
    readonly inspectorAdminId: string;
    readonly idempotencyKey: string;
    readonly requestHash: string;
  }): Promise<QualityInspection>;
  listForReceipt(receiptId: string): Promise<readonly QualityInspection[]>;
}

export class QualityInspectionService {
  constructor(private readonly inspections: QualityInspectionRepository) {}

  create(
    receiptId: string,
    skuId: string,
    inspectorAdminId: string,
    idempotencyKey: string,
    input: QualityInspectionInput
  ): Promise<QualityInspection> {
    validateUuid(receiptId, 'receipt');
    validateUuid(skuId, 'SKU');
    if (!/^\d{1,19}$/.test(inspectorAdminId) || BigInt(inspectorAdminId) < 1n) throw new Error('Invalid inspector id');
    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) throw new Error('Invalid inspection idempotency key');
    const normalized = validate(input);
    const requestHash = createHash('sha256').update(JSON.stringify({ receiptId, skuId, inspectorAdminId, ...normalized })).digest('hex');
    return this.inspections.create(normalized, { receiptId, skuId, inspectorAdminId, idempotencyKey, requestHash });
  }

  listForReceipt(receiptId: string): Promise<readonly QualityInspection[]> {
    validateUuid(receiptId, 'receipt');
    return this.inspections.listForReceipt(receiptId);
  }
}

function validate(input: QualityInspectionInput): QualityInspectionInput {
  const quantities = [input.sampleQuantity, input.acceptedQuantity, input.downgradedQuantity, input.rejectedQuantity];
  if (quantities.some((value) => !Number.isSafeInteger(value) || value < 0 || value > 1_000_000)
    || input.sampleQuantity < 1
    || input.acceptedQuantity + input.downgradedQuantity + input.rejectedQuantity !== input.sampleQuantity) {
    throw new Error('Invalid inspection quantities');
  }
  if (!QUALITY_INSPECTION_CONCLUSIONS.includes(input.conclusion)) throw new Error('Invalid inspection conclusion');
  const validConclusion = input.conclusion === 'PASS'
    ? input.acceptedQuantity === input.sampleQuantity && input.downgradedQuantity === 0 && input.rejectedQuantity === 0
    : input.conclusion === 'DOWNGRADE'
      ? input.downgradedQuantity === input.sampleQuantity && input.acceptedQuantity === 0 && input.rejectedQuantity === 0
      : input.conclusion === 'PARTIAL_REJECT'
        ? input.rejectedQuantity > 0 && input.acceptedQuantity + input.downgradedQuantity > 0
        : input.rejectedQuantity === input.sampleQuantity && input.acceptedQuantity === 0 && input.downgradedQuantity === 0;
  if (!validConclusion) throw new Error('Inspection quantities do not match conclusion');

  const details = {
    appearance: optionalText(input.appearance, 200), sizeObservation: optionalText(input.sizeObservation, 200),
    firmness: optionalText(input.firmness, 200), bloom: optionalText(input.bloom, 200),
    dryness: optionalText(input.dryness, 200), damage: optionalText(input.damage, 200),
    mold: optionalText(input.mold, 200), foreignMatter: optionalText(input.foreignMatter, 200),
    odor: optionalText(input.odor, 200)
  };
  const qualityGrade = optionalText(input.qualityGrade, 32);
  if (input.acceptedQuantity + input.downgradedQuantity > 0 && !qualityGrade) {
    throw new Error('Quality grade is required for accepted or downgraded quantity');
  }
  if (!Array.isArray(input.sampleImageObjectKeys) || input.sampleImageObjectKeys.length > 20) {
    throw new Error('Invalid inspection sample images');
  }
  const sampleImageObjectKeys = [...new Set(input.sampleImageObjectKeys)];
  if (sampleImageObjectKeys.some((key) => typeof key !== 'string' || key.length > 512
    || !/^quality-inspections\/[A-Za-z0-9/_-]+\.[A-Za-z0-9]{1,10}$/.test(key) || key.split('/').includes('..'))) {
    throw new Error('Invalid inspection image object key');
  }
  return {
    sampleQuantity: input.sampleQuantity, acceptedQuantity: input.acceptedQuantity,
    downgradedQuantity: input.downgradedQuantity, rejectedQuantity: input.rejectedQuantity,
    ...details, qualityGrade, sampleImageObjectKeys,
    conclusion: input.conclusion, note: optionalText(input.note, 500)
  };
}

function optionalText(value: string | null, max: number): string | null {
  if (value === null) return null;
  const text = value.trim().normalize('NFC');
  if (text.length > max) throw new Error('Invalid inspection text');
  return text || null;
}

function validateUuid(value: string, entity: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`Invalid ${entity} id`);
  }
}
