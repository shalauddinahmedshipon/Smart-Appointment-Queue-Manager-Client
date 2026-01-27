import { baseApi } from "./baseApi";
import { Appointment } from "@/types/appointment.types";

export const appointmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAppointments: builder.query<Appointment[], { date?: string; staffId?: string }>({
      query: (params) => ({
        url: "/appointment",
        params,
      }),
      providesTags: () => ["Appointments", "AppointmentsList"],
    }),

    createAppointment: builder.mutation<
      Appointment,
      {
        customerName: string;
        serviceId: string;
        staffId?: string;
        appointmentAt: string;
      }
    >({
      query: (body) => ({
        url: "/appointment",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Appointments", "AppointmentsList", "WaitingQueue", "DashboardStats", "ActivityLogs"],
    }),

    updateAppointment: builder.mutation<
      Appointment,
      { id: string } & Partial<{
        customerName?: string;
        serviceId?: string;
        staffId?: string;
        appointmentAt?: string;
        status?: Appointment["status"];
      }>
    >({
      query: ({ id, ...patch }) => ({
        url: `/appointment/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, arg) => [
        "Appointments",
        "AppointmentsList",
        "WaitingQueue",
        "DashboardStats",
        "ActivityLogs",
        { type: "Appointment", id: arg.id },
      ],
    }),

    cancelAppointment: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/appointment/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Appointments", "AppointmentsList", "WaitingQueue", "DashboardStats", "ActivityLogs"],
    }),

    getWaitingQueue: builder.query<Appointment[], void>({
      query: () => "/appointment/waiting-queue",
      providesTags: () => ["WaitingQueue"],
    }),

    assignFromQueue: builder.mutation<
      { processed: number; assigned: number; skipped: number },
      void
    >({
      query: () => ({
        url: "/appointment/assign-queue",
        method: "PATCH",
      }),
      invalidatesTags: ["WaitingQueue", "Appointments", "DashboardStats", "ActivityLogs"],
    }),
  }),
});

export const {
  useGetAppointmentsQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useCancelAppointmentMutation,
  useGetWaitingQueueQuery,
  useAssignFromQueueMutation,
} = appointmentApi;