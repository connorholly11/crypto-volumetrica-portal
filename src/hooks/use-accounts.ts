import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Account, AccountCreate, AccountData, AccountStatus } from '@/types/volumetrica'

// API response types
interface AccountListResponse {
  success: boolean
  data?: {
    accounts: Account[]
    summary: {
      total: number
      active: number
      disabled: number
      totalBalance: number
      totalEquity: number
      totalPnL: number
    }
  }
  message?: string
}

interface AccountDataResponse {
  success: boolean
  data?: AccountData
  message?: string
}

interface AccountCreateResponse {
  success: boolean
  data?: Account
  message?: string
}

interface EnableDisableResponse {
  success: boolean
  message?: string
}

// Filter options for list query
interface AccountFilters {
  userId?: string
  status?: AccountStatus
  page?: number
  pageSize?: number
  sortBy?: 'createdAt' | 'balance' | 'equity' | 'drawdown'
  sortOrder?: 'asc' | 'desc'
}

// Fetch single account data
export function useAccount(accountId: string, options?: UseQueryOptions<AccountData>) {
  return useQuery<AccountData>({
    queryKey: ['account', accountId],
    queryFn: async () => {
      const response = await fetch(`/api/accounts/${accountId}`)
      const data: AccountDataResponse = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch account')
      }
      
      return data.data!
    },
    enabled: !!accountId,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time data
    ...options,
  })
}

// Fetch account list with filters
export function useAccounts(filters?: AccountFilters, options?: UseQueryOptions<AccountListResponse['data']>) {
  const queryKey = ['accounts', filters]
  
  return useQuery<AccountListResponse['data']>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.userId) params.append('userId', filters.userId)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString())
      if (filters?.sortBy) params.append('sortBy', filters.sortBy)
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)
      
      const response = await fetch(`/api/accounts/list?${params}`)
      const data: AccountListResponse = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch accounts')
      }
      
      return data.data!
    },
    ...options,
  })
}

// Create new account mutation
export function useCreateAccount(
  options?: UseMutationOptions<Account, Error, AccountCreate>
) {
  const queryClient = useQueryClient()
  
  return useMutation<Account, Error, AccountCreate>({
    mutationFn: async (accountData) => {
      const response = await fetch('/api/accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
      })
      
      const data: AccountCreateResponse = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create account')
      }
      
      return data.data!
    },
    onSuccess: (newAccount) => {
      // Invalidate accounts list to include new account
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success(`Account ${newAccount.username} created successfully`)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create account')
    },
    ...options,
  })
}

// Enable account mutation
export function useEnableAccount(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, string>({
    mutationFn: async (accountId) => {
      const response = await fetch(`/api/accounts/${accountId}/enable`, {
        method: 'POST',
      })
      
      const data: EnableDisableResponse = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to enable account')
      }
    },
    onSuccess: (_, accountId) => {
      // Invalidate both the specific account and the list
      queryClient.invalidateQueries({ queryKey: ['account', accountId] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Account enabled successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to enable account')
    },
    ...options,
  })
}

// Disable account mutation
interface DisableAccountParams {
  accountId: string
  reason: string
  forceClose?: boolean
}

export function useDisableAccount(
  options?: UseMutationOptions<void, Error, DisableAccountParams>
) {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, DisableAccountParams>({
    mutationFn: async ({ accountId, reason, forceClose }) => {
      const response = await fetch(`/api/accounts/${accountId}/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, forceClose }),
      })
      
      const data: EnableDisableResponse = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to disable account')
      }
    },
    onSuccess: (_, { accountId }) => {
      // Invalidate both the specific account and the list
      queryClient.invalidateQueries({ queryKey: ['account', accountId] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Account disabled successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to disable account')
    },
    ...options,
  })
}