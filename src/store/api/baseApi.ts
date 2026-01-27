import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { AppTagTypes } from "./tags";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    credentials: "include",
  }),
  endpoints: () => ({}),
  tagTypes: [
    "Appointments",
    "AppointmentsList",
    "WaitingQueue",
    "DashboardStats",
    "ActivityLogs",
    "Appointment",
    "Staff",
    "StaffList",
    "Services",
    "ServicesList",
  ] as AppTagTypes[],
});
