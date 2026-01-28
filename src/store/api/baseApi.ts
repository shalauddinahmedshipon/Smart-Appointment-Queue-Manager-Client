import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/store"; // ✅ IMPORT YOUR OWN ROOT STATE
import { AppTagTypes } from "./tags";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,

    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
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
