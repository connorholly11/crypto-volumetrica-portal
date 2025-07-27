"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Copy,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  User,
  Users,
} from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { type User, UserStatus, type TradingAccount } from "@/types/volumetrica"

// User creation schema
const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  country: z.string().length(2, "Country must be 2-letter code"),
  state: z.string().optional(),
  phone: z.string().optional(),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

interface UserWithAccounts extends User {
  accounts?: TradingAccount[]
}

export function UserManagement() {
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loginUrlDialogOpen, setLoginUrlDialogOpen] = useState(false)
  const [generatedLoginUrl, setGeneratedLoginUrl] = useState<string | null>(null)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)

  const queryClient = useQueryClient()

  // Mock data - in real app this would fetch from API
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      // This would be a real API call
      // For now, return mock data
      const mockUsers: UserWithAccounts[] = [
        {
          userId: "user-1",
          email: "john.doe@example.com",
          firstName: "John",
          lastName: "Doe",
          country: "US",
          status: UserStatus.Active,
          createdAt: new Date().toISOString(),
          accounts: [
            {
              accountId: "acc-1",
              userId: "user-1",
              header: "$100K Challenge",
              balance: 100000,
              equity: 102500,
              status: 1,
              currency: 1,
              mode: 0,
              portfolioMode: 1,
              usedMargin: 0,
              freeMargin: 102500,
              marginLevel: 0,
              unrealizedPnL: 0,
              realizedPnL: 2500,
              dailyPnL: 500,
              weeklyPnL: 1500,
              monthlyPnL: 2500,
              openPositions: 0,
              drawdown: 0,
              maxDrawdown: 10000,
              runup: 2500,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      ]
      return mockUsers
    },
  })

  // Create user form
  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      country: "",
      state: "",
      phone: "",
    },
  })

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      // Clean empty strings before sending
      const cleanedData = {
        ...data,
        state: data.state?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
      }
      
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create user")
      }
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("User created successfully")
      setCreateUserDialogOpen(false)
      form.reset()
      
      // Show password if returned
      if (data.data.password) {
        setGeneratedPassword(data.data.password)
      }
    },
    onError: (error) => {
      toast.error("Failed to create user", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })

  // Generate login URL mutation
  const generateLoginUrlMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch("/api/users/login-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (!response.ok) throw new Error("Failed to generate login URL")
      return response.json()
    },
    onSuccess: (data) => {
      setGeneratedLoginUrl(data.data.loginUrl)
      toast.success("Login URL generated successfully")
    },
    onError: (error) => {
      toast.error("Failed to generate login URL", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })

  const onSubmit = (data: CreateUserFormData) => {
    createUserMutation.mutate(data)
  }

  const handleGenerateLoginUrl = (user: User) => {
    setSelectedUser(user)
    setGeneratedLoginUrl(null)
    setLoginUrlDialogOpen(true)
    generateLoginUrlMutation.mutate(user.userId)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case UserStatus.Active:
        return <Badge variant="default">Active</Badge>
      case UserStatus.Inactive:
        return <Badge variant="secondary">Inactive</Badge>
      case UserStatus.Invited:
        return <Badge variant="outline">Invited</Badge>
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage users and their trading accounts
              </CardDescription>
            </div>
            <Button onClick={() => setCreateUserDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {usersLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : users?.length ? (
                <div className="space-y-4">
                  {users.map((user) => (
                    <Card key={user.userId}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="rounded-full bg-muted p-2">
                              <User className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {user.firstName} {user.lastName}
                              </h3>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(user.status)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateLoginUrl(user)}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Login URL
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">User ID:</span>
                              <span className="font-mono">{user.userId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Country:</span>
                              <span>{user.country}</span>
                            </div>
                            {user.createdAt && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Created:</span>
                                <span>
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>

                          {user.accounts && user.accounts.length > 0 && (
                            <div>
                              <h4 className="mb-2 text-sm font-medium">Trading Accounts</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Account</TableHead>
                                    <TableHead>Balance</TableHead>
                                    <TableHead>Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {user.accounts.map((account) => (
                                    <TableRow key={account.accountId}>
                                      <TableCell className="font-medium">
                                        {account.header}
                                      </TableCell>
                                      <TableCell className="font-mono">
                                        ${account.balance.toLocaleString()}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline">
                                          {account.status === 1 ? "Enabled" : "Disabled"}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground p-8">
                  No users found
                </div>
              )}
            </TabsContent>

            <TabsContent value="active">
              <div className="text-center text-muted-foreground p-8">
                Active users view
              </div>
            </TabsContent>

            <TabsContent value="inactive">
              <div className="text-center text-muted-foreground p-8">
                Inactive users view
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a dedicated user for the platform
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
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
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="US" {...field} />
                      </FormControl>
                      <FormDescription>2-letter country code</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="CA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateUserDialogOpen(false)
                    form.reset()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Login URL Dialog */}
      <Dialog open={loginUrlDialogOpen} onOpenChange={setLoginUrlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generated Login URL</DialogTitle>
            <DialogDescription>
              One-time login URL for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {generateLoginUrlMutation.isPending ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : generatedLoginUrl ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  This is a one-time login URL. It will expire after first use.
                </AlertDescription>
              </Alert>
            ) : null}

            {generatedLoginUrl && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Login URL</label>
                <div className="flex gap-2">
                  <Input
                    value={generatedLoginUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(generatedLoginUrl, "Login URL")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setLoginUrlDialogOpen(false)
                  setGeneratedLoginUrl(null)
                  setSelectedUser(null)
                }}
              >
                Close
              </Button>
              {generatedLoginUrl && (
                <Button
                  onClick={() => generateLoginUrlMutation.mutate(selectedUser!.userId)}
                  disabled={generateLoginUrlMutation.isPending}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate New
                </Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      {generatedPassword && (
        <Dialog open={!!generatedPassword} onOpenChange={() => setGeneratedPassword(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>User Created Successfully</DialogTitle>
              <DialogDescription>
                Save these credentials - the password cannot be retrieved later
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Copy and securely share these credentials with the user.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <label className="text-sm font-medium">Generated Password</label>
                <div className="flex gap-2">
                  <Input
                    value={generatedPassword}
                    readOnly
                    type="password"
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(generatedPassword, "Password")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setGeneratedPassword(null)}>
                I've saved the password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}