import { randomBytes } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import type { Aftersale } from '@shanheyipin/shared-types';
import type { AftersaleRepository } from './aftersale-service.js';

const include = { order:{select:{publicId:true}}, items:{orderBy:{id:'asc' as const},include:{orderItem:{select:{publicId:true}}}} } satisfies Prisma.AftersaleInclude;
type Row=Prisma.AftersaleGetPayload<{include:typeof include}>;
export class PrismaAftersaleRepository implements AftersaleRepository {
  constructor(private readonly prisma:PrismaClient){}
  async findByIdempotency(userId:string,key:string,hash:string){const row=await this.prisma.aftersale.findUnique({where:{userId_idempotencyKey:{userId:BigInt(userId),idempotencyKey:key}},include}); return row?replay(row,hash):null;}
  async create(input:Parameters<AftersaleRepository['create']>[0]){
    const prior=await this.findByIdempotency(input.userId,input.key,input.hash); if(prior)return prior;
    try{return toAftersale(await this.prisma.$transaction(async tx=>{
      const userId=BigInt(input.userId); const order=await tx.order.findFirst({where:{publicId:input.request.orderId,userId},include:{items:true}}); if(!order)throw new Error('Order not found');
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${order.id} FOR UPDATE`;
      if(order.paymentStatus!=='PAID'||['CANCELLED','REFUNDED'].includes(order.orderStatus))throw new Error('Order is not eligible for aftersale');
      const byPublic=new Map(order.items.map(x=>[x.publicId,x])); for(const item of input.request.items){const row=byPublic.get(item.orderItemId);if(!row)throw new Error('Aftersale item does not belong to order');if(item.quantity>row.quantity)throw new Error('Aftersale quantity exceeds ordered quantity');}
      const created=await tx.aftersale.create({data:{aftersaleNo:`AS${randomBytes(16).toString('hex').toUpperCase()}`,orderId:order.id,userId,type:input.request.type,reason:input.request.reason,description:input.request.description,idempotencyKey:input.key,requestHash:input.hash,items:{create:input.request.items.map(x=>({orderItemId:byPublic.get(x.orderItemId)!.id,quantity:x.quantity}))},logs:{create:{fromStatus:null,toStatus:'APPLIED',operatorType:'USER',operatorId:userId,note:'AFTERSALE_APPLIED'}}},include});
      await tx.order.update({where:{id:order.id},data:{aftersaleStatus:'PROCESSING'}}); return created;
    }));}catch(e){if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==='P2002'){const raced=await this.findByIdempotency(input.userId,input.key,input.hash);if(raced)return raced;}throw e;}
  }
  async listOwned(userId:string){return (await this.prisma.aftersale.findMany({where:{userId:BigInt(userId)},include,orderBy:{createdAt:'desc'}})).map(toAftersale);}
  async findOwned(userId:string,id:string){const row=await this.prisma.aftersale.findFirst({where:{publicId:id,userId:BigInt(userId)},include});return row?toAftersale(row):null;}
  async decide(adminId:string,id:string,approved:boolean,note:string){return toAftersale(await this.prisma.$transaction(async tx=>{const admin=await tx.adminUser.findUnique({where:{id:BigInt(adminId)}});if(!admin||admin.status!=='ACTIVE')throw new Error('Admin user unavailable');const row=await tx.aftersale.findUnique({where:{publicId:id}});if(!row)throw new Error('Aftersale not found');await tx.$queryRaw`SELECT id FROM aftersales WHERE id = ${row.id} FOR UPDATE`;const locked=await tx.aftersale.findUniqueOrThrow({where:{id:row.id}});if(locked.status!=='APPLIED')throw new Error('Aftersale cannot be decided');const status=approved?'APPROVED' as const:'REJECTED' as const;return tx.aftersale.update({where:{id:row.id},data:{status,logs:{create:{fromStatus:'APPLIED',toStatus:status,operatorType:'ADMIN',operatorId:BigInt(adminId),note}}},include});}));}
}
function replay(row:Row,hash:string){if(row.requestHash!==hash)throw new Error('Aftersale idempotency key reused with different request');return toAftersale(row);}
function toAftersale(row:Row):Aftersale{return{id:row.publicId,aftersaleNo:row.aftersaleNo,orderId:row.order.publicId,type:row.type,status:row.status,reason:row.reason,description:row.description,items:row.items.map(x=>({orderItemId:x.orderItem.publicId,quantity:x.quantity})),createdAt:row.createdAt.toISOString()};}
