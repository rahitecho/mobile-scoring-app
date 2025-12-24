import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const duprServiceUrl = import.meta.env.VITE_DUPR_SERVICE_URL || 'http://localhost:3001'

export const otpApi = createApi({
  reducerPath: 'otpApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${duprServiceUrl}/api`,
  }),
  endpoints: (builder) => ({
    generateOtp: builder.mutation({
      query: ({ phone }: { phone: string }) => ({
        url: '/otp/generate',
        method: 'POST',
        body: { phone },
      }),
    }),
    verifyOtp: builder.mutation({
      query: ({ phone, otp, type }: { phone: string; otp: string; type?: string }) => ({
        url: '/otp/verify',
        method: 'POST',
        body: { phone, otp, type },
      }),
    }),
    completeRegistration: builder.mutation({
      query: ({ phone, userData }: { phone: string; userData: any }) => ({
        url: '/otp/complete-registration',
        method: 'POST',
        body: { phone, userData },
      }),
    }),
  }),
})

export const {
  useGenerateOtpMutation,
  useVerifyOtpMutation,
  useCompleteRegistrationMutation,
} = otpApi