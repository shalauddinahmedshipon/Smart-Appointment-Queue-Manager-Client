
import { baseApi } from "./baseApi";

export const activityLogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActivityLogs: builder.query<
      Array<{
        id: string;
        message: string;
        createdAt: string;
      }>,
      { limit?: number }
    >({
      query: ({ limit }) => ({
        url: "/activity-log",
        params: limit ? { limit } : undefined,
      }),
      transformResponse: (response: any) => response || [],
      providesTags: ['ActivityLogs'] as const,
    }),
  }),
});

export const { useGetActivityLogsQuery } = activityLogApi;