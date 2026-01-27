import z from "zod";

export const serviceSchema = z.object({
  name: z.string().min(2, "Service name must be at least 2 characters"),
  duration: z.enum(["MIN_15", "MIN_30", "MIN_60"]),
  requiredStaffType: z.enum(["DOCTOR", "CONSULTANT", "SUPPORT_AGENT"]),
});

export type ServiceForm = z.infer<typeof serviceSchema>;