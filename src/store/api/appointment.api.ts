// store/api/appointment.api.ts
import { AppointmentInput } from "@/lib/validations/appointment.schema";
import { baseApi } from "./baseApi";
import { Appointment } from "@/types/appointment.types";

const appointmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all appointments
    getAppointments: builder.query<Appointment[], void>({
      query: () => "/appointment",
      providesTags: ["Appointments", "AppointmentsList", "DashboardStats"],
    }),

    // Get single appointment
    getAppointment: builder.query<Appointment, string>({
      query: (id) => `/appointment/${id}`,
      providesTags: (result, error, id) => [{ type: "Appointment", id }],
    }),

    // Create appointment
    createAppointment: builder.mutation<Appointment, AppointmentInput>({
      query: (body) => ({
        url: "/appointment",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "Appointments",
        "AppointmentsList",
        "WaitingQueue",
        "DashboardStats",
        "ActivityLogs",
      ],
    }),

    // Update appointment
    updateAppointment: builder.mutation<
      Appointment,
      { id: string } & Partial<AppointmentInput>
    >({
      query: ({ id, ...patch }) => ({
        url: `/appointment/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Appointments",
        "AppointmentsList",
        "WaitingQueue",
        "DashboardStats",
        "ActivityLogs",
        { type: "Appointment", id },
      ],
    }),

    // Delete appointment
    deleteAppointment: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/appointment/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        "Appointments",
        "AppointmentsList",
        "WaitingQueue",
        "DashboardStats",
        "ActivityLogs",
      ],
    }),

    // Get waiting queue
    getWaitingQueue: builder.query<Appointment[], void>({
      query: () => "/appointment/waiting-queue",
      providesTags: ["WaitingQueue", "DashboardStats"],
    }),

    // Assign from queue (auto-assign)
    assignFromQueue: builder.mutation<
      { processed: number; assigned: number; skipped: number; message: string },
      void
    >({
      query: () => ({
        url: "/appointment/assign-queue",
        method: "PATCH",
      }),
      invalidatesTags: [
        "Appointments",
        "AppointmentsList",
        "WaitingQueue",
        "DashboardStats",
        "ActivityLogs",
      ],
    }),
  }),
});

export const {
  useGetAppointmentsQuery,
  useGetAppointmentQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useDeleteAppointmentMutation,
  useGetWaitingQueueQuery,
  useAssignFromQueueMutation,
} = appointmentApi;