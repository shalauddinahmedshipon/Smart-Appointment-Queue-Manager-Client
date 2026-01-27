import { baseApi } from "./baseApi";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<{
      todayTotal: number;
      completedToday: number;
      pendingToday: number;
      waitingQueue: number;
      staffLoad?: Array<{ name: string; load: string; status: string }>;
    }, void>({
      query: () => '/dashboard/stats',
      providesTags: () => ["DashboardStats"],
    }),
  }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;