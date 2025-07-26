import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { User, UserCreate } from '@/types/volumetrica'

// API response types
interface UserResponse {
  success: boolean
  data?: User
  message?: string
}

interface LoginUrlResponse {
  success: boolean
  data?: {
    loginUrl: string
  }
  message?: string
}

// Fetch single user data
export function useUser(userId: string, options?: UseQueryOptions<User>) {
  return useQuery<User>({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`)
      const data: UserResponse = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch user')
      }
      
      return data.data!
    },
    enabled: !!userId,
    ...options,
  })
}

// Create new user mutation
export function useCreateUser(
  options?: UseMutationOptions<User, Error, UserCreate>
) {
  const queryClient = useQueryClient()
  
  return useMutation<User, Error, UserCreate>({
    mutationFn: async (userData) => {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })
      
      const data: UserResponse = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create user')
      }
      
      return data.data!
    },
    onSuccess: (newUser) => {
      // Cache the new user data
      queryClient.setQueryData(['user', newUser.id], newUser)
      toast.success(`User ${newUser.email} created successfully`)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create user')
    },
    ...options,
  })
}

// Generate OTP login URL mutation
export function useGenerateLoginUrl(
  options?: UseMutationOptions<string, Error, string>
) {
  return useMutation<string, Error, string>({
    mutationFn: async (userId) => {
      const response = await fetch('/api/users/login-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      
      const data: LoginUrlResponse = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to generate login URL')
      }
      
      return data.data!.loginUrl
    },
    onSuccess: (loginUrl) => {
      // Copy to clipboard
      navigator.clipboard.writeText(loginUrl)
      toast.success('Login URL generated and copied to clipboard')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate login URL')
    },
    ...options,
  })
}

// Helper hook to get user with their accounts
export function useUserWithAccounts(userId: string) {
  const userQuery = useUser(userId)
  
  // We'll use the accounts hook once it's imported
  // For now, we return just the user data
  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    error: userQuery.error,
  }
}