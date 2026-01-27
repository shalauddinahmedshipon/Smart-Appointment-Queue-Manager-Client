import z from "zod";

export const appointmentSchema = z.object({
  customerName: z.string().min(2, "Customer name required"),
  serviceId: z.string().min(1, "Select a service"),
  staffId: z.string().optional(),
  appointmentAt: z.date(),
});

export type AppointmentForm = z.infer<typeof appointmentSchema>;