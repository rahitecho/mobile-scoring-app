/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/types'
import { useDispatch } from 'react-redux'
import { clearAuthUser, setAuthUser } from '@/store/slices/authSlice'
import {
  useCompleteRegistrationMutation,
  useGenerateOtpMutation,
  useVerifyOtpMutation,
} from '@/store/otpApi'
import { getPasswordFromPhone } from '@/utils/helpers'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isUmpire: boolean
  isAuthenticated: boolean
  isLoading: boolean
  signInWithPhone: (phone: string) => Promise<{ userExists: boolean }>
  verifyOtp: (
    phone: string,
    otp: string,
    type?: string
  ) => Promise<{ user: any; needsRegistration: boolean }>
  completeRegistration: (phone: string, userData: any) => Promise<User>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [sendOtp] = useGenerateOtpMutation()
  const [verifyPhoneOtp] = useVerifyOtpMutation()
  const [completeUserRegistration] = useCompleteRegistrationMutation()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        dispatch(clearAuthUser())
        setLoading(false)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        setLoading(false)
        setIsLoading(false)
        return
      }

      setUser(data)
      dispatch(setAuthUser(data))
      setLoading(false)
      setIsLoading(false)
    } catch (error) {
      console.error('Exception in fetchUserProfile:', error)
      setLoading(false)
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
  }

  const signInWithPhone = async (
    phone: string
  ): Promise<{ userExists: boolean }> => {
    try {
      // Verify OTP with dupr-service
      const { data, error } = await sendOtp({ phone })
      if (error) {
        throw error
      }

      const userExists = data.userExists

      return { userExists }
    } catch (error) {
      console.error('Error in signInWithPhone:', error)
      throw error
    }
  }

  const verifyOtp = async (
    phone: string,
    otp: string,
    type?: string
  ): Promise<{ user: any; needsRegistration: boolean }> => {
    try {
      // Verify OTP with dupr-service
      const { data, error } = await verifyPhoneOtp({ phone, otp, type })

      if (error) {
        throw error
      }

      const userData = data.user

      // Check if we need registration completion
      const needsRegistration =
        !data.userExists ||
        userData?.role === 'guest' ||
        !userData?.name ||
        !userData?.email

      // If user exists and is complete, create Supabase session
      if (!needsRegistration && userData?.id) {
        // 1️⃣ Try with full phone number as password
        let { data, error } = await supabase.auth.signInWithPassword({
          email: userData?.email, // or phone if you're using phone-based login
          password: phone,
        })

        if (!error) {
          return { user: userData, needsRegistration }
        }

        // 2️⃣ If error, fallback to stripped phone (no dial code)
        const password = getPasswordFromPhone(phone)

        ;({ data, error } = await supabase.auth.signInWithPassword({
          email: userData?.email,
          password,
        }))

        if (error) throw error
        return { user: userData, needsRegistration }
      }

      return { user: userData, needsRegistration }
    } catch (error) {
      console.error('Error in verifyOtp:', error)
      throw error
    }
  }

  const completeRegistration = async (
    phone: string,
    userData: any
  ): Promise<User> => {
    try {
      // Call dupr-service to complete registration
      const { data, error } = await completeUserRegistration({
        phone,
        userData,
      })

      if (error) {
        throw error
      }

      // 1️⃣ Try login with full phone as password
      let { error: loginError } = await supabase.auth.signInWithPassword({
        email: userData?.email,
        password: phone,
      })

      // 2️⃣ If error, retry with stripped phone
      if (loginError) {
        ;({ error: loginError } = await supabase.auth.signInWithPassword({
          email: userData?.email,
          password: getPasswordFromPhone(phone),
        }))

        if (loginError) {
          throw loginError // still failed after retry
        }
      }

      return data.user
    } catch (error) {
      console.error('Error in completeRegistration:', error)
      throw error
    }
  }

  const refreshUser = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id)
    }
  }

  const isUmpire = user?.role === 'umpire' || user?.role === 'admin'
  const isAuthenticated = !!user

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isUmpire,
    isAuthenticated,
    isLoading,
    signInWithPhone,
    verifyOtp,
    completeRegistration,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)