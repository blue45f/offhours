import { z } from 'zod'
import { PaymentProviderSchema, PaymentStatusSchema, SettlementStatusSchema } from './enums'

export const CreatePaymentIntentSchema = z.object({
  reservationId: z.string().min(1),
  method: z.string().min(1),
})
export type CreatePaymentIntentInput = z.infer<typeof CreatePaymentIntentSchema>

export const ConfirmPaymentSchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().int().min(0),
})
export type ConfirmPaymentInput = z.infer<typeof ConfirmPaymentSchema>

export const PaymentSchema = z.object({
  id: z.string(),
  reservationId: z.string(),
  provider: PaymentProviderSchema,
  providerKey: z.string(),
  method: z.string(),
  amountKRW: z.number(),
  status: PaymentStatusSchema,
  receiptUrl: z.string().nullable(),
  capturedAt: z.string().nullable(),
  refundedAt: z.string().nullable(),
  createdAt: z.string(),
})
export type Payment = z.infer<typeof PaymentSchema>

export const SettlementSchema = z.object({
  id: z.string(),
  hostId: z.string(),
  amountKRW: z.number(),
  periodStart: z.string(),
  periodEnd: z.string(),
  status: SettlementStatusSchema,
  invoiceUrl: z.string().nullable(),
  paidAt: z.string().nullable(),
  createdAt: z.string(),
})
export type Settlement = z.infer<typeof SettlementSchema>
