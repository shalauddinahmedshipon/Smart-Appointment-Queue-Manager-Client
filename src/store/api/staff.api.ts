
import { Staff } from "@/types/staff.types";
import { baseApi } from "./baseApi";



const staffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStaffs: builder.query<Staff[], void>({
      query: () => "/staff",
      providesTags: () => ["Staff", "StaffList", "DashboardStats"],
    }),

    createStaff: builder.mutation<Staff, {
      name: string;
      serviceType: Staff["serviceType"];
      dailyCapacity?: number;
      status?: Staff["status"];
    }>({
      query: (body) => ({
        url: "/staff",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Staff", "StaffList", "DashboardStats"],
    }),

    updateStaff: builder.mutation<Staff, { id: string } & Partial<Pick<Staff, "name" | "serviceType" | "dailyCapacity" | "status">>>({
      query: ({ id, ...patch }) => ({
        url: `/staff/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Staff",
        "StaffList",
        "DashboardStats",
        { type: "Staff", id },
      ],
    }),

    deleteStaff: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/staff/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Staff", "StaffList", "DashboardStats"],
    }),
  }),
});

export const {
  useGetStaffsQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
} = staffApi;