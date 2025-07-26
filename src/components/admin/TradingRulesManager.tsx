"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Edit, Copy, Trash2, Loader2, AlertCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  type TradingRule,
  type RiskParameter,
  RiskAction,
  RiskValueSelection,
  RiskAnchor,
} from "@/types/volumetrica"
import { formatPercentage } from "@/lib/utils"

// Validation schema for trading rules
const riskParameterSchema = z.object({
  enabled: z.boolean(),
  action: z.nativeEnum(RiskAction),
  value: z.number().optional(),
  percentage: z.number().optional(),
  selection: z.nativeEnum(RiskValueSelection).optional(),
  anchor: z.nativeEnum(RiskAnchor).optional(),
})

const tradingRuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  maxDrawdown: riskParameterSchema.optional(),
  runup: riskParameterSchema.optional(),
  intradayDrawdown: riskParameterSchema.optional(),
  intradayRunup: riskParameterSchema.optional(),
  maxPositionLoss: riskParameterSchema.optional(),
  maxPositionGain: riskParameterSchema.optional(),
  maxPortfolioLoss: riskParameterSchema.optional(),
  maxPortfolioGain: riskParameterSchema.optional(),
  maxDailyTrades: z.number().optional(),
  minSessionNumbers: z.number().optional(),
  overnightAllowed: z.boolean().optional(),
  overweekAllowed: z.boolean().optional(),
})

type TradingRuleFormData = z.infer<typeof tradingRuleSchema>

export function TradingRulesManager() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<TradingRule | null>(null)
  const [activeTab, setActiveTab] = useState("templates")

  const queryClient = useQueryClient()

  // Fetch trading rules
  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ["trading-rules"],
    queryFn: async () => {
      const response = await fetch("/api/trading-rules/list")
      if (!response.ok) throw new Error("Failed to fetch trading rules")
      const result = await response.json()
      return result.data.items as TradingRule[]
    },
  })

  // Fetch templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["trading-rule-templates"],
    queryFn: async () => {
      const response = await fetch("/api/trading-rules/templates")
      if (!response.ok) throw new Error("Failed to fetch templates")
      const data = await response.json()
      return data.data as TradingRule[]
    },
  })

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (data: TradingRuleFormData) => {
      const response = await fetch("/api/trading-rules/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Failed to create trading rule")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading-rules"] })
      toast.success("Trading rule created successfully")
      setDialogOpen(false)
      form.reset()
    },
    onError: (error) => {
      toast.error("Failed to create trading rule", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })

  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TradingRuleFormData }) => {
      const response = await fetch(`/api/trading-rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, id }),
      })
      if (!response.ok) throw new Error("Failed to update trading rule")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading-rules"] })
      toast.success("Trading rule updated successfully")
      setDialogOpen(false)
      setEditingRule(null)
      form.reset()
    },
    onError: (error) => {
      toast.error("Failed to update trading rule", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })

  const form = useForm<TradingRuleFormData>({
    resolver: zodResolver(tradingRuleSchema),
    defaultValues: {
      name: "",
      description: "",
      maxDrawdown: {
        enabled: false,
        action: RiskAction.ChallengeFail,
        percentage: 10,
        selection: RiskValueSelection.Percentage,
        anchor: RiskAnchor.Balance,
      },
      intradayDrawdown: {
        enabled: false,
        action: RiskAction.IntradayDisable,
        percentage: 5,
        selection: RiskValueSelection.Percentage,
        anchor: RiskAnchor.Balance,
      },
      runup: {
        enabled: false,
        action: RiskAction.ChallengeFail,
        percentage: 10,
        selection: RiskValueSelection.Percentage,
        anchor: RiskAnchor.Balance,
      },
      maxDailyTrades: undefined,
      overnightAllowed: true,
      overweekAllowed: true,
    },
  })

  const onSubmit = (data: TradingRuleFormData) => {
    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id!, data })
    } else {
      createRuleMutation.mutate(data)
    }
  }

  const openEditDialog = (rule: TradingRule) => {
    setEditingRule(rule)
    form.reset({
      name: rule.name,
      description: rule.description,
      maxDrawdown: rule.maxDrawdown,
      intradayDrawdown: rule.intradayDrawdown,
      runup: rule.runup,
      intradayRunup: rule.intradayRunup,
      maxPositionLoss: rule.maxPositionLoss,
      maxPositionGain: rule.maxPositionGain,
      maxPortfolioLoss: rule.maxPortfolioLoss,
      maxPortfolioGain: rule.maxPortfolioGain,
      maxDailyTrades: rule.maxDailyTrades,
      minSessionNumbers: rule.minSessionNumbers,
      overnightAllowed: rule.overnightAllowed,
      overweekAllowed: rule.overweekAllowed,
    })
    setDialogOpen(true)
  }

  const renderRiskParameter = (param?: RiskParameter, label?: string) => {
    if (!param || !param.enabled) return null

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{label}:</span>
        {param.selection === RiskValueSelection.Percentage && param.percentage && (
          <Badge variant="outline">{formatPercentage(param.percentage)}</Badge>
        )}
        {param.selection === RiskValueSelection.Value && param.value && (
          <Badge variant="outline">${param.value.toLocaleString()}</Badge>
        )}
        <Badge variant={param.action === RiskAction.ChallengeFail ? "destructive" : "default"}>
          {getRiskActionLabel(param.action)}
        </Badge>
      </div>
    )
  }

  const getRiskActionLabel = (action: RiskAction) => {
    switch (action) {
      case RiskAction.None:
        return "None"
      case RiskAction.ChallengeFail:
        return "Fail Challenge"
      case RiskAction.Flat:
        return "Flatten Positions"
      case RiskAction.IntradayDisable:
        return "Disable for Day"
    }
  }

  const RuleCard = ({ rule, isTemplate = false }: { rule: TradingRule; isTemplate?: boolean }) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{rule.name}</CardTitle>
            {rule.description && (
              <CardDescription className="mt-1">{rule.description}</CardDescription>
            )}
          </div>
          {!isTemplate && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditDialog(rule)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {renderRiskParameter(rule.maxDrawdown, "Max Drawdown")}
        {renderRiskParameter(rule.intradayDrawdown, "Daily Drawdown")}
        {renderRiskParameter(rule.runup, "Profit Target")}
        {rule.maxDailyTrades && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Max Daily Trades:</span>
            <Badge variant="outline">{rule.maxDailyTrades}</Badge>
          </div>
        )}
        <div className="flex gap-2 mt-3">
          {!rule.overnightAllowed && (
            <Badge variant="secondary">No Overnight</Badge>
          )}
          {!rule.overweekAllowed && (
            <Badge variant="secondary">No Weekend</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Trading Rules</CardTitle>
              <CardDescription>
                Manage trading rules and risk parameters for accounts
              </CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="custom">Custom Rules</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-4">
              {templatesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : templates?.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {templates.map((template) => (
                    <RuleCard key={template.id} rule={template} isTemplate />
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground p-8">
                  No templates available
                </div>
              )}
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              {rulesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : rules?.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {rules.map((rule) => (
                    <RuleCard key={rule.id} rule={rule} />
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground p-8">
                  No custom rules created yet
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create/Edit Rule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Edit Trading Rule" : "Create Trading Rule"}
            </DialogTitle>
            <DialogDescription>
              Define risk parameters and trading restrictions
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Name</FormLabel>
                    <FormControl>
                      <Input placeholder="$100K Challenge Rules" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the purpose of this rule set..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Risk Parameters</h3>

                {/* Max Drawdown */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Maximum Drawdown</CardTitle>
                      <FormField
                        control={form.control}
                        name="maxDrawdown.enabled"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardHeader>
                  {form.watch("maxDrawdown.enabled") && (
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="maxDrawdown.percentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Percentage</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="10"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="maxDrawdown.action"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Action</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(Number(value))}
                                defaultValue={field.value.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="0">None</SelectItem>
                                  <SelectItem value="1">Challenge Fail</SelectItem>
                                  <SelectItem value="2">Flatten Positions</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Intraday Drawdown */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Daily Drawdown</CardTitle>
                      <FormField
                        control={form.control}
                        name="intradayDrawdown.enabled"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardHeader>
                  {form.watch("intradayDrawdown.enabled") && (
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="intradayDrawdown.percentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Percentage</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="5"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="intradayDrawdown.action"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Action</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(Number(value))}
                                defaultValue={field.value.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="0">None</SelectItem>
                                  <SelectItem value="3">Disable for Day</SelectItem>
                                  <SelectItem value="2">Flatten Positions</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Profit Target */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Profit Target (Runup)</CardTitle>
                      <FormField
                        control={form.control}
                        name="runup.enabled"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardHeader>
                  {form.watch("runup.enabled") && (
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="runup.percentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Percentage</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="10"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="runup.action"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Action</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(Number(value))}
                                defaultValue={field.value.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="0">None</SelectItem>
                                  <SelectItem value="1">Challenge Success</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Trading Restrictions</h3>

                <FormField
                  control={form.control}
                  name="maxDailyTrades"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Daily Trades (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="No limit"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty for no limit
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="overnightAllowed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Allow Overnight Trading
                          </FormLabel>
                          <FormDescription>
                            Traders can hold positions overnight
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="overweekAllowed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Allow Weekend Trading
                          </FormLabel>
                          <FormDescription>
                            Traders can hold positions over weekends
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false)
                    setEditingRule(null)
                    form.reset()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
                >
                  {createRuleMutation.isPending || updateRuleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingRule ? "Updating..." : "Creating..."}
                    </>
                  ) : editingRule ? (
                    "Update Rule"
                  ) : (
                    "Create Rule"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}