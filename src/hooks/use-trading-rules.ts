import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { TradingRule, TradingRuleCreate, TradingRuleUpdate } from '@/types/volumetrica'

// API response types
interface TradingRulesListResponse {
  success: boolean
  data?: {
    rules: TradingRule[]
    pagination: {
      page: number
      pageSize: number
      totalPages: number
      totalItems: number
    }
  }
  message?: string
}

interface TradingRuleResponse {
  success: boolean
  data?: TradingRule
  message?: string
}

interface TradingRuleTemplate {
  id: string
  name: string
  description: string
  accountSize: number
  riskLevel: 'conservative' | 'standard' | 'aggressive'
  rule: TradingRuleCreate
}

interface TradingRuleTemplatesResponse {
  success: boolean
  data?: {
    templates: TradingRuleTemplate[]
    totalCount: number
  }
  message?: string
}

// Filter options for list query
interface TradingRulesFilters {
  page?: number
  pageSize?: number
  sortBy?: 'name' | 'createdAt' | 'id'
  sortOrder?: 'asc' | 'desc'
  search?: string
}

// Fetch all trading rules
export function useTradingRules(
  filters?: TradingRulesFilters,
  options?: UseQueryOptions<TradingRulesListResponse['data']>
) {
  const queryKey = ['trading-rules', filters]
  
  return useQuery<TradingRulesListResponse['data']>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString())
      if (filters?.sortBy) params.append('sortBy', filters.sortBy)
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)
      if (filters?.search) params.append('search', filters.search)
      
      const response = await fetch(`/api/trading-rules/list?${params}`)
      const data: TradingRulesListResponse = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch trading rules')
      }
      
      return data.data!
    },
    ...options,
  })
}

// Fetch single trading rule
export function useTradingRule(
  ruleId: string,
  options?: UseQueryOptions<TradingRule>
) {
  return useQuery<TradingRule>({
    queryKey: ['trading-rule', ruleId],
    queryFn: async () => {
      const response = await fetch(`/api/trading-rules/${ruleId}`)
      const data: TradingRuleResponse = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch trading rule')
      }
      
      return data.data!
    },
    enabled: !!ruleId,
    ...options,
  })
}

// Fetch trading rule templates
export function useTradingRuleTemplates(
  options?: UseQueryOptions<TradingRuleTemplate[]>
) {
  return useQuery<TradingRuleTemplate[]>({
    queryKey: ['trading-rule-templates'],
    queryFn: async () => {
      const response = await fetch('/api/trading-rules/templates')
      const data: TradingRuleTemplatesResponse = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch trading rule templates')
      }
      
      return data.data?.templates || []
    },
    staleTime: 5 * 60 * 1000, // Templates don't change often, cache for 5 minutes
    ...options,
  })
}

// Create trading rule mutation
export function useCreateTradingRule(
  options?: UseMutationOptions<TradingRule, Error, TradingRuleCreate>
) {
  const queryClient = useQueryClient()
  
  return useMutation<TradingRule, Error, TradingRuleCreate>({
    mutationFn: async (ruleData) => {
      const response = await fetch('/api/trading-rules/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      })
      
      const data: TradingRuleResponse = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create trading rule')
      }
      
      return data.data!
    },
    onSuccess: (newRule) => {
      // Invalidate rules list to include new rule
      queryClient.invalidateQueries({ queryKey: ['trading-rules'] })
      // Cache the new rule
      queryClient.setQueryData(['trading-rule', newRule.id], newRule)
      toast.success(`Trading rule "${newRule.name}" created successfully`)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create trading rule')
    },
    ...options,
  })
}

// Update trading rule mutation
export function useUpdateTradingRule(
  options?: UseMutationOptions<TradingRule, Error, TradingRuleUpdate>
) {
  const queryClient = useQueryClient()
  
  return useMutation<TradingRule, Error, TradingRuleUpdate>({
    mutationFn: async (ruleData) => {
      const response = await fetch(`/api/trading-rules/${ruleData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      })
      
      const data: TradingRuleResponse = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update trading rule')
      }
      
      return data.data!
    },
    onSuccess: (updatedRule) => {
      // Update the specific rule in cache
      queryClient.setQueryData(['trading-rule', updatedRule.id], updatedRule)
      // Invalidate rules list to reflect changes
      queryClient.invalidateQueries({ queryKey: ['trading-rules'] })
      toast.success(`Trading rule "${updatedRule.name}" updated successfully`)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update trading rule')
    },
    ...options,
  })
}

// Helper hook to create a rule from template
export function useCreateRuleFromTemplate() {
  const createRuleMutation = useCreateTradingRule()
  
  return useMutation<TradingRule, Error, { template: TradingRuleTemplate; name: string }>({
    mutationFn: async ({ template, name }) => {
      const ruleData: TradingRuleCreate = {
        ...template.rule,
        name, // Override the template name with custom name
      }
      
      return createRuleMutation.mutateAsync(ruleData)
    },
  })
}