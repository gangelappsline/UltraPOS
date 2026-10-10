import { z } from "zod";
export const businessSchema = z.object({
  id: z.number(),
  name: z.string(),
  business_type: z.string(),
});
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "business", "seller"]),
  businesses: z.array(businessSchema).default([]),
});
export const authResponseSchema = z.object({
  token: z.string().min(1),
  user: userSchema,
});
export const envelopeSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.unknown(),
  error: z
    .object({ code: z.string(), details: z.record(z.unknown()).optional() })
    .optional(),
  meta: z.object({
    timestamp: z.string(),
    request_id: z.string(),
    pagination: z
      .object({
        current_page: z.number(),
        last_page: z.number(),
        per_page: z.number(),
        total: z.number(),
      })
      .optional(),
  }),
});
