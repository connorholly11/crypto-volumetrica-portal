"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
  Activity,
  AlertCircle,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

import { AccountCreationForm } from "@/components/admin/AccountCreationForm"
import { AccountsTable } from "@/components/admin/AccountsTable"
import { TradingRulesManager } from "@/components/admin/TradingRulesManager"
import { UserManagement } from "@/components/admin/UserManagement"

import { formatCurrency, formatPercentage } from "@/lib/utils"

interface DashboardStats {
  totalUsers: number
  activeAccounts: number
  totalBalance: number
  totalPnL: number
  avgDrawdown: number
  challengeSuccessRate: number
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      // In a real app, this would fetch from an API endpoint
      // For now, return mock data
      const mockStats: DashboardStats = {
        totalUsers: 156,
        activeAccounts: 342,
        totalBalance: 15_250_000,
        totalPnL: 1_235_000,
        avgDrawdown: 4.2,
        challengeSuccessRate: 68,
      }
      return mockStats
    },
  })

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      </div>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "-" : stats?.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "-" : stats?.activeAccounts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "-" : formatCurrency(stats?.totalBalance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "-" : (
                <span className={stats?.totalPnL! >= 0 ? "text-green-600" : "text-red-600"}>
                  {stats?.totalPnL! >= 0 ? "+" : ""}{formatCurrency(stats?.totalPnL || 0)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined realized P&L
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Average Drawdown</CardTitle>
            <CardDescription>
              Current average drawdown across all active accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {statsLoading ? "-" : formatPercentage(stats?.avgDrawdown || 0)}
                </span>
                <Badge variant={stats?.avgDrawdown! > 7 ? "destructive" : "default"}>
                  {stats?.avgDrawdown! > 7 ? "High Risk" : "Normal"}
                </Badge>
              </div>
              <Progress 
                value={stats?.avgDrawdown || 0} 
                max={10}
                className="h-2"
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Target: Below 5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Challenge Success Rate</CardTitle>
            <CardDescription>
              Percentage of accounts passing evaluation challenges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {statsLoading ? "-" : formatPercentage(stats?.challengeSuccessRate || 0)}
                </span>
                <Badge variant={stats?.challengeSuccessRate! > 60 ? "default" : "destructive"}>
                  {stats?.challengeSuccessRate! > 60 ? "Good" : "Low"}
                </Badge>
              </div>
              <Progress 
                value={stats?.challengeSuccessRate || 0} 
                className="h-2"
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                <span>Industry average: 55%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="rules">Trading Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <AccountCreationForm />
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Account Management</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Enable/disable accounts from the Accounts tab</li>
                    <li>View real-time account performance</li>
                    <li>Export account reports</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">User Management</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Create new traders</li>
                    <li>Generate one-time login URLs</li>
                    <li>Manage user permissions</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Risk Management</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Configure trading rules</li>
                    <li>Set drawdown limits</li>
                    <li>Define profit targets</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <AccountsTable refreshInterval={30000} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <TradingRulesManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}