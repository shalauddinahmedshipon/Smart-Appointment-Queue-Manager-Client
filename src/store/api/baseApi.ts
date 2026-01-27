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
   'ActivityLogs'
  ,'DashboardStats'
  ,'Appointments'
  ,'AppointmentsList'
  ,'WaitingQueue'
  ,'Services'
  ,'ServicesList'
  ,'Staff'
  ,'StaffList'] as AppTagTypes[],
});
