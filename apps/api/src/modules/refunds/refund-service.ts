import { createHash } from 'node:crypto';

export type RefundProviderName='MOCK'|'DISABLED'|'WECHAT'|'ALIPAY';
export type RefundStatus='CREATED'|'PENDING'|'SUCCEEDED'|'FAILED'|'UNKNOWN';
export interface RefundOrder {readonly id:string;readonly refundNo:string;readonly aftersaleId:string;readonly orderId:string;readonly provider:RefundProviderName;readonly status:RefundStatus;readonly amountCent:number;readonly reason:string;readonly providerRefundId:string|null;}
export interface RefundRepository {
  findApprovedAftersale(aftersaleId:string):Promise<{aftersaleId:string;orderId:string;paidAmountCent:number;refundedAmountCent:number;type:'REFUND_ONLY'|'RETURN_REFUND'|'COMPENSATION'|'RESHIP'}|null>;
  findByIdempotency(adminId:string,key:string,hash:string):Promise<RefundOrder|null>;
  claim(input:{adminId:string;aftersaleId:string;orderId:string;provider:RefundProviderName;amountCent:number;reason:string;key:string;hash:string}):Promise<{refund:RefundOrder;isNew:boolean}>;
  markPending(id:string,providerRefundId:string):Promise<RefundOrder>; markFailed(id:string,reason:string):Promise<RefundOrder>; markUnknown(id:string,reason:string):Promise<RefundOrder>;
  complete(event:{provider:RefundProviderName;eventId:string;providerRefundId:string;amountCent:number;occurredAt:string}):Promise<RefundOrder>;
}
export interface RefundProvider {readonly name:RefundProviderName;createRefund(refund:RefundOrder):Promise<{providerRefundId:string}>;}
export class RefundProviderDisabledError extends Error{constructor(){super('Refund provider disabled');this.name='RefundProviderDisabledError';}}
export class DisabledRefundProvider implements RefundProvider{readonly name='DISABLED' as const;async createRefund():Promise<never>{throw new RefundProviderDisabledError();}}
export class MockRefundProvider implements RefundProvider{readonly name='MOCK' as const;async createRefund(refund:RefundOrder){return{providerRefundId:`mock-refund:${refund.id}`};}}
export class RefundService{
  constructor(private readonly refunds:RefundRepository,private readonly provider:RefundProvider){}
  async create(adminId:string,aftersaleId:string,key:string,amountCent:number,reason:string){
    if(!/^[1-9]\d*$/.test(adminId))throw new Error('Invalid admin user id');assertUuid(aftersaleId,'aftersale');if(!/^[A-Za-z0-9._:-]{8,128}$/.test(key))throw new Error('Invalid refund idempotency key');
    if(!Number.isSafeInteger(amountCent)||amountCent<1)throw new Error('Invalid refund amount');const normalized=reason.trim().normalize('NFC');if(normalized.length<1||normalized.length>200)throw new Error('Invalid refund reason');
    const source=await this.refunds.findApprovedAftersale(aftersaleId);if(!source||source.type==='RESHIP')throw new Error('Aftersale is not refundable');if(source.refundedAmountCent+amountCent>source.paidAmountCent)throw new Error('Refund amount exceeds paid amount');
    const hash=createHash('sha256').update(JSON.stringify({aftersaleId,provider:this.provider.name,amountCent,reason:normalized})).digest('hex');const replay=await this.refunds.findByIdempotency(adminId,key,hash);if(replay)return replay;
    const claimed=await this.refunds.claim({adminId,aftersaleId,orderId:source.orderId,provider:this.provider.name,amountCent,reason:normalized,key,hash});if(!claimed.isNew)return claimed.refund;
    try{const result=await this.provider.createRefund(claimed.refund);return this.refunds.markPending(claimed.refund.id,result.providerRefundId);}catch(error){if(error instanceof RefundProviderDisabledError){await this.refunds.markFailed(claimed.refund.id,'REFUND_PROVIDER_DISABLED');throw error;}await this.refunds.markUnknown(claimed.refund.id,'PROVIDER_RESULT_UNKNOWN');throw new Error('Refund result unknown');}
  }
  async complete(event:{provider:RefundProviderName;eventId:string;providerRefundId:string;amountCent:number;occurredAt:string}){if(!['MOCK','WECHAT','ALIPAY'].includes(event.provider)||!validToken(event.eventId)||!validToken(event.providerRefundId)||!Number.isSafeInteger(event.amountCent)||event.amountCent<1||Number.isNaN(Date.parse(event.occurredAt)))throw new Error('Invalid refund event');return this.refunds.complete(event);}
}
function validToken(v:string){return /^[A-Za-z0-9._:-]{1,128}$/.test(v);}function assertUuid(v:string,l:string){if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v))throw new Error(`Invalid ${l} id`);}
