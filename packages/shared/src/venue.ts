import { z } from 'zod'
import { RepeatRuleSchema, VenueCategorySchema, VenueStatusSchema } from './enums'

export const BusinessHourSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  openMinute: z.number().int().min(0).max(1440),
  closeMinute: z.number().int().min(0).max(1440),
})
export type BusinessHour = z.infer<typeof BusinessHourSchema>

export const HolidaySchema = z.object({
  date: z.string(),
  repeat: RepeatRuleSchema.default('NONE'),
  reason: z.string().max(40).optional(),
})
export type Holiday = z.infer<typeof HolidaySchema>

export const CreateVenueSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: VenueCategorySchema,
  addressJibun: z.string().trim().min(1).max(200),
  addressRoad: z.string().trim().min(1).max(200),
  addressDetail: z.string().trim().max(80).optional(),
  lat: z.number().min(33).max(43),
  lng: z.number().min(124).max(132),
  region: z.string().trim().max(20),
  district: z.string().trim().max(30),
  description: z.string().trim().min(20).max(2000),
  businessHours: z.array(BusinessHourSchema).min(1),
  holidays: z.array(HolidaySchema).default([]),
})
export type CreateVenueInput = z.infer<typeof CreateVenueSchema>

export const UpdateVenueSchema = CreateVenueSchema.partial()
export type UpdateVenueInput = z.infer<typeof UpdateVenueSchema>

export const VenueSchema = z.object({
  id: z.string(),
  hostId: z.string(),
  name: z.string(),
  category: VenueCategorySchema,
  addressJibun: z.string(),
  addressRoad: z.string(),
  addressDetail: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  region: z.string(),
  district: z.string(),
  description: z.string(),
  status: VenueStatusSchema,
  createdAt: z.string(),
  businessHours: z.array(BusinessHourSchema).optional(),
  holidays: z.array(HolidaySchema).optional(),
})
export type Venue = z.infer<typeof VenueSchema>
