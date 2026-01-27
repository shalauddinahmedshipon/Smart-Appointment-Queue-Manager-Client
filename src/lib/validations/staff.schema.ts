// lib/validations/staff.schema.ts
import { z } from "zod";

export const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  serviceType: z.enum(["DOCTOR", "CONSULTANT", "SUPPORT_AGENT"]),
  dailyCapacity: z
    .number()
    .int("Capacity must be a whole number")
    .min(1, "Minimum capacity is 1")
    .max(50, "Maximum capacity is 12"),
  status: z.enum(["AVAILABLE", "ON_LEAVE"]),
});

export type StaffInput = z.infer<typeof staffSchema>;