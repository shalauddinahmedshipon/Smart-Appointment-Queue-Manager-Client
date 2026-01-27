// store/api/service.api.ts
import { Service } from "@/types/service.types";
import { baseApi } from "./baseApi";


const serviceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // List all services
    getServices: builder.query<Service[], void>({
      query: () => "/service",
      providesTags: () => ["Services", "ServicesList"],
    }),

    // Get single service
    getServiceById: builder.query<Service, string>({
      query: (id) => `/service/${id}`,
      providesTags: (result, error, id) => [{ type: "Services", id }],
    }),

    // Create service
    createService: builder.mutation<Service, {
      name: string;
      duration: Service["duration"];
      requiredStaffType: Service["requiredStaffType"];
    }>({
      query: (body) => ({
        url: "/service",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Services", "ServicesList", "DashboardStats"],
    }),

    // Update service
    updateService: builder.mutation<Service, { id: string } & Partial<{
      name?: string;
      duration?: Service["duration"];
      requiredStaffType?: Service["requiredStaffType"];
    }>>({
      query: ({ id, ...patch }) => ({
        url: `/service/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Services",
        "ServicesList",
        "DashboardStats",
        { type: "Services", id },
      ],
    }),

    // Delete service
    deleteService: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/service/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Services", "ServicesList", "DashboardStats"],
    }),
  }),
});

export const {
  useGetServicesQuery,
  useGetServiceByIdQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} = serviceApi;