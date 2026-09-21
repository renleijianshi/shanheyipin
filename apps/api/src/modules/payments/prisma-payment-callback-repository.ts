import { Prisma, type PrismaClient } from '@prisma/client';
import type { PaymentCallbackEvent, PaymentCallbackRepository } from './payment-callback-service.js';

export class PrismaPaymentCallbackRepository implements PaymentCallbackRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async apply(event: PaymentCallbackEvent): Promise<{ readonly duplicate: boolean; readonly paymentId: string }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const previous = await tx.paymentTransaction.findUnique({
          where: { provider_eventId: { provider: event.provider, eventId: event.eventId } },
          include: { paymentOrder: true }
        });
        if (previous) return { duplicate: true, paymentId: previous.paymentOrder.publicId };

        const payment = await tx.paymentOrder.findUnique({
          where: { paymentNo: event.paymentNo }, include: { order: true }
        });
        if (!payment || payment.provider !== event.provider) throw new Error('Payment callback target not found');
        await tx.$queryRaw`SELECT id FROM payment_orders WHERE id = ${payment.id} FOR UPDATE`;
        await tx.$queryRaw`SELECT id FROM orders WHERE id = ${payment.orderId} FOR UPDATE`;
        const locked = await tx.paymentOrder.findUniqueOrThrow({
          where: { id: payment.id }, include: { order: true }
        });
        if (locked.amountCent !== event.amountCent) throw new Error('Payment callback amount mismatch');
        if (locked.providerPaymentId !== null && locked.providerPaymentId !== event.providerPaymentId) {
          throw new Error('Payment callback transaction mismatch');
        }
        if (locked.status === 'SUCCEEDED') return { duplicate: true, paymentId: locked.publicId };
        if (!['CREATED', 'PENDING', 'UNKNOWN'].includes(locked.status)
          || locked.order.orderStatus !== 'CREATED' || locked.order.paymentStatus !== 'UNPAID') {
          throw new Error('Payment callback state conflict');
        }
        const paidAt = new Date(event.paidAt);
        await tx.paymentTransaction.create({
          data: {
            paymentOrderId: locked.id, provider: event.provider, eventId: event.eventId,
            providerPaymentId: event.providerPaymentId, status: 'SUCCEEDED',
            amountCent: event.amountCent, occurredAt: paidAt
          }
        });
        await tx.paymentOrder.update({
          where: { id: locked.id },
          data: { status: 'SUCCEEDED', providerPaymentId: event.providerPaymentId, failureReason: null }
        });
        await tx.order.update({
          where: { id: locked.orderId },
          data: {
            orderStatus: 'PAID', paymentStatus: 'PAID', paidAmountCent: event.amountCent, paidAt,
            statusLogs: { create: { fromStatus: 'CREATED', toStatus: 'PAID', reason: 'PAYMENT_SUCCEEDED' } }
          }
        });
        return { duplicate: false, paymentId: locked.publicId };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const duplicate = await this.prisma.paymentTransaction.findUnique({
          where: { provider_eventId: { provider: event.provider, eventId: event.eventId } },
          include: { paymentOrder: true }
        });
        if (duplicate) return { duplicate: true, paymentId: duplicate.paymentOrder.publicId };
      }
      throw error;
    }
  }
}
