 
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Copy } from "lucide-react"
import { countries } from "@/lib/data/countries"
import { usStates } from "@/lib/data/us-states"

import {
  Currency,
  AccountMode,
  PortfolioMode,
  ExpirationMode,
  type TradingRule,
} from "@/types/volumetrica"

// Form schemas for each step
const userSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  email: z.string().email("Invalid email address"),
  country: z.string().length(2, "Please select a country"),
  state: z.union([
    z.string().length(2),
    z.literal("")
  ]).optional(),
}).refine(
  (data) => {
    // State is required for US
    if (data.country === "US" && (!data.state || data.state === "")) {
      return false;
    }
    return true;
  },
  {
    message: "State is required for United States",
    path: ["state"],
  }
)

const accountSchema = z.object({
  balance: z.number().min(1000, "Minimum balance is $1,000"),
  currency: z.nativeEnum(Currency),
  mode: z.nativeEnum(AccountMode),
  portfolioMode: z.nativeEnum(PortfolioMode),
  header: z.string().optional(),
  description: z.string().optional(),
  expirationMode: z.nativeEnum(ExpirationMode),
  expirationDays: z.number().optional(),
})

// NEW: discriminated union guarantees required data
const tradingRulesSchema = z.discriminatedUnion("ruleType", [
  z.object({
    ruleType: z.literal("template"),
    templateId: z.string().min(1, "Please select a trading rule template"),
  }),
  z.object({
    ruleType: z.literal("custom"),
    customRule: z.any().refine(
      (val) => val && typeof val === "object" && Object.keys(val).length > 0,
      { message: "Custom trading rule is required" }
    ),
  }),
])

// Combined form schema
const formSchema = z.object({
  user: userSchema,
  account: accountSchema,
  tradingRules: tradingRulesSchema,
})

type FormData = z.infer<typeof formSchema>

export function AccountCreationForm() {
  const [currentStep, setCurrentStep] = useState("user")
  const [isCreating, setIsCreating] = useState(false)
  const [userCreationError, setUserCreationError] = useState<string | null>(null)
  const [createdUserInfo, setCreatedUserInfo] = useState<{
    email: string
    tempPassword: string
    userId: string
  } | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user: {
        firstName: "",
        lastName: "",
        email: "",
        country: "",
        state: "",
      },
      account: {
        balance: 100000,
        currency: Currency.USD,
        mode: AccountMode.Evaluation,
        portfolioMode: PortfolioMode.Hedging,
        header: "",
        description: "",
        expirationMode: ExpirationMode.DaysFromActivation,
        expirationDays: 30,
      },
      tradingRules: {
        ruleType: "template",
        templateId: "",
      },
    },
  })

  // Clear state when country changes (if not US)
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "user.country" && value.user?.country !== "US") {
        form.setValue("user.state", "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Fetch trading rule templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["trading-rule-templates"],
    queryFn: async () => {
      const response = await fetch("/api/trading-rules/templates")
      if (!response.ok) throw new Error("Failed to fetch templates")
      const data = await response.json()
      return data.data?.templates || []
    },
  })

  // Create user mutation - now uses the admin API route
  const createUserMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof userSchema>) => {
      const response = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })
      if (!response.ok) {
        const error = await response.json()
        // Extract validation errors if present
        if (error.errors && Array.isArray(error.errors)) {
          const errorMessages = error.errors.map((e: any) => 
            `${e.field}: ${e.message}`
          ).join(", ");
          throw new Error(errorMessages);
        }
        throw new Error(error.message || "Failed to create user")
      }
      return response.json()
    },
  })

  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: async (data: {
      userId: string
      accountData: z.infer<typeof accountSchema>
      tradingRules: z.infer<typeof tradingRulesSchema>
    }) => {
      const body: any = {
        userId: data.userId,
        ...data.accountData,
      }

      // Attach trading rule based on selection
      if (data.tradingRules.ruleType === "template" && data.tradingRules.templateId) {
        // Find full template details from the cached query result
        const selectedTemplate = templates?.find(
          (t: TradingRule) => t.id === data.tradingRules.templateId
        )

        if (!selectedTemplate) {
          throw new Error("Selected trading rule template not found")
        }

        // Remove internal id before sending to Volumetrica
        const { id, ...customRule } = selectedTemplate as Record<string, unknown>
        body.accountCustomRule = customRule
      } else if (data.tradingRules.ruleType === "custom" && data.tradingRules.customRule) {
        body.accountCustomRule = data.tradingRules.customRule
      }

      const response = await fetch("/api/accounts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create account")
      }
      return response.json()
    },
  })

  const onSubmit = async (values: FormData) => {
    try {
      setIsCreating(true)
      setUserCreationError(null)

      // Step 1: Create user in Clerk, Volumetrica, and database
      const userResponse = await createUserMutation.mutateAsync(values.user)
      
      // Check if user creation was successful
      if (!userResponse.success) {
        throw new Error(userResponse.message || "Failed to create user")
      }
      
      const { userId, tempPassword, email } = userResponse.data
      
      // Store the created user info for display
      setCreatedUserInfo({
        email,
        tempPassword,
        userId
      })

      // Step 2: Create account with trading rules
      const accountResponse = await createAccountMutation.mutateAsync({
        userId,
        accountData: values.account,
        tradingRules: values.tradingRules,
      })

      toast.success("Account created successfully!", {
        description: `Account ID: ${accountResponse.data.accountId}`,
      })

      // Don't reset form immediately - let admin see the temporary password
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setUserCreationError(errorMessage);
      toast.error("Failed to create account", {
        description: errorMessage,
      })
    } finally {
      setIsCreating(false)
    }
  }

  const nextStep = async () => {
    // Validate current step before proceeding
    let isValid = false;
    
    if (currentStep === "user") {
      isValid = await form.trigger("user");
    } else if (currentStep === "account") {
      isValid = await form.trigger("account");
    }
    
    if (isValid) {
      if (currentStep === "user") {
        setCurrentStep("account");
      } else if (currentStep === "account") {
        setCurrentStep("rules");
      }
    } else {
      // Show validation errors
      toast.error("Please fix the errors before proceeding");
    }
  }

  const prevStep = () => {
    if (currentStep === "rules") {
      setCurrentStep("account")
    } else if (currentStep === "account") {
      setCurrentStep("user")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Trading Account</CardTitle>
        <CardDescription>
          Complete all steps to create a new user and trading account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Display temporary password after successful creation */}
        {createdUserInfo && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="space-y-2">
              <p className="font-semibold text-green-800">User created successfully!</p>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Email:</span> {createdUserInfo.email}</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Temporary Password:</span>
                  <code className="bg-green-100 px-2 py-1 rounded text-green-900 font-mono">
                    {createdUserInfo.tempPassword}
                  </code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(createdUserInfo.tempPassword)
                      toast.success("Password copied to clipboard")
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-green-700 mt-2">
                Please share this temporary password with the user. They will be prompted to change it on first login.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  form.reset()
                  setCurrentStep("user")
                  setCreatedUserInfo(null)
                  setUserCreationError(null)
                }}
              >
                Create Another Account
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentStep} onValueChange={setCurrentStep}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="user">User Details</TabsTrigger>
                <TabsTrigger value="account">Account Configuration</TabsTrigger>
                <TabsTrigger value="rules">Trading Rules</TabsTrigger>
              </TabsList>
              <TabsContent value="user" className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Fields marked with <span className="text-red-500">*</span> are required
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="user.firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="user.lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="user.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="user.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name} ({country.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="user.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          State {form.watch("user.country") === "US" && <span className="text-red-500">*</span>}
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={form.watch("user.country") !== "US"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={form.watch("user.country") === "US" ? "Select a state" : "Only for US"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {usStates.map((state) => (
                              <SelectItem key={state.code} value={state.code}>
                                {state.name} ({state.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {userCreationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{userCreationError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setUserCreationError(null);
                    }}
                  >
                    Reset
                  </Button>
                  <Button type="button" onClick={nextStep}>
                    Next: Account Configuration
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="account" className="space-y-4">
                <FormField
                  control={form.control}
                  name="account.balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Starting Balance</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="100000"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>Initial account balance in selected currency</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="account.currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">EUR</SelectItem>
                            <SelectItem value="1">USD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="account.mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Mode</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Evaluation</SelectItem>
                            <SelectItem value="1">Sim Funded</SelectItem>
                            <SelectItem value="2">Funded</SelectItem>
                            <SelectItem value="3">Live</SelectItem>
                            <SelectItem value="4">Trial</SelectItem>
                            <SelectItem value="5">Contest</SelectItem>
                            <SelectItem value="100">Training</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="account.portfolioMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Portfolio Mode</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select portfolio mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Netting</SelectItem>
                            <SelectItem value="1">Hedging</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="account.header"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="My Trading Account" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="account.expirationMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Mode</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select expiration mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Never Expires</SelectItem>
                            <SelectItem value="1">Use End Date</SelectItem>
                            <SelectItem value="2">Days From Activation</SelectItem>
                            <SelectItem value="3">Days From First Order</SelectItem>
                            <SelectItem value="4">Days From First Execution</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                />
                {form.watch("account.expirationMode") === ExpirationMode.DaysFromActivation && (
                  <FormField
                    control={form.control}
                    name="account.expirationDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Days</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="30"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>Days until account expires</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                  <Button type="button" onClick={nextStep}>
                    Next: Trading Rules
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="rules" className="space-y-4">
                <FormField
                  control={form.control}
                  name="tradingRules.ruleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trading Rules</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="space-y-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="template" id="template" />
                            <label
                              htmlFor="template"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Use Rule Template
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="custom" id="custom" />
                            <label
                              htmlFor="custom"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Create Custom Rules
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("tradingRules.ruleType") === "template" && (
                  <FormField
                    control={form.control}
                    name="tradingRules.templateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Template</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templatesLoading ? (
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                Loading templates...
                              </div>
                            ) : templates && templates.length > 0 ? (
                              templates.map((template) => (
                                <SelectItem key={template.id} value={template.id!}>
                                  <div>
                                    <div className="font-medium">{template.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {template.description}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                No templates available
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {form.watch("tradingRules.ruleType") === "custom" && (
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">
                      Custom rule creation would include fields for:
                    </p>
                    <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                      <li>Max drawdown settings</li>
                      <li>Profit targets</li>
                      <li>Daily loss limits</li>
                      <li>Position and portfolio risk limits</li>
                      <li>Trading hours restrictions</li>
                    </ul>
                    <p className="mt-2 text-sm text-muted-foreground">
                      (Full implementation would include these fields)
                    </p>
                  </div>
                )}
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}