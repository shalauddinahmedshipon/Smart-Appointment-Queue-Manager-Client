// store/api/auth.api.ts
import { User } from "@/types/auth.types";
import { baseApi } from "./baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<{
      user: any;
    }, { email: string; password: string }>({
      query: (credentials) => ({
        url: "/auth/login",        // ← Fixed: was "/auth/"
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: any) => ({
        user: response.data,       // ← Backend returns { data: account }
      }),
    }),

    signup: builder.mutation<{
      user: any;
    }, FormData>({
      query: (formData) => ({
        url: "/auth/signup",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: any) => ({
        user: response.data,
      }),
    }),

    getMe: builder.query<User, void>({
      query: () => "/auth/me",
      transformResponse: (response: any) => response, // ← getMe returns account directly
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetMeQuery,
  useLogoutMutation,
} = authApi;