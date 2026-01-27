import { z } from "zod";

export const appointmentSchema = z.object({
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  serviceId: z.string().min(1, "Please select a service"),
  staffId: z.string().optional(),
  appointmentAt: z
    .string()
    .min(1, "Please select date and time")
    .refine(
      (date) => {
        const selectedDate = new Date(date);
        const now = new Date();
        return selectedDate > now;
      },
      { message: "Appointment must be scheduled for a future date and time" }
    ),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

