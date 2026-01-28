// store/api/auth.api.ts
import { User } from "@/types/auth.types";
import { baseApi } from "./baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<
      { user: User; accessToken: string },
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: any) => ({
        user: response.data.account,
        accessToken: response.data.accessToken,
      }),
    }),

    signup: builder.mutation<
      { user: User; accessToken: string },
      FormData
    >({
      query: (formData) => ({
        url: "/auth/signup",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: any) => ({
        user: response.data.account,
        accessToken: response.data.accessToken,
      }),
    }),

    getMe: builder.query<User, void>({
      query: () => "/auth/me",
      transformResponse: (response: any) => response,
      providesTags: ["User"],
    }),
    
    updateAccount: builder.mutation<
      { message: string; account: User },
      FormData
    >({
      query: (formData) => ({
        url: "/auth/update-account",
        method: "PATCH",
        body: formData,
      }),
      transformResponse: (response: any) => response.data,
      // Invalidate the getMe query to refetch user data after update
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetMeQuery,
  useUpdateAccountMutation,
} = authApi;