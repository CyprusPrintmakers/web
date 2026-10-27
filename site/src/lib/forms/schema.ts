import { z } from 'zod'

export const CV_MAX_BYTES = 4 * 1024 * 1024
export const VELOCITY_MS = 3_000

export const CV_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

export const cvSchema = z.object({
  name: z.string().default('cv.pdf'),
  type: z.string(),
  size: z.number(),
})

const baseSchema = z.object({
  name: z.string().max(200),
  email: z.string().max(320),
  phone: z.string().max(60).optional(),
  message: z.string().max(5_000).optional(),
  tier: z.string().max(60).optional(),
    practice: z.string().max(200).optional(),
    consent: z.boolean().optional(),
  cv: cvSchema.optional(),
  honeypot: z.string().optional(),
  website: z.string().optional(),
  // forms.js fills this with Date.now(); a no-JS submit leaves it absent.
  renderedAt: z.union([z.string(), z.number()]).optional(),
})

export const formSchema = baseSchema

export type CvFile = z.infer<typeof cvSchema>
export type FormWire = z.input<typeof baseSchema>
