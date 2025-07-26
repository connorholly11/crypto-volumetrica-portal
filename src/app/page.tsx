import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Users, Settings, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Crypto Volumetrica Portal
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Professional trading management platform for prop firms
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/trader">Trader Dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/admin">Admin Dashboard</Link>
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader>
            <LineChart className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle>Real-time Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Track account balances, P&L, and drawdown status in real-time with automatic updates every 30 seconds.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Users className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Create and manage dedicated users, generate login URLs, and control access to trading accounts.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Settings className="h-8 w-8 text-purple-600 mb-2" />
            <CardTitle>Trading Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Configure risk parameters, drawdown limits, and trading restrictions for each account or globally.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <TrendingUp className="h-8 w-8 text-orange-600 mb-2" />
            <CardTitle>Performance Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              View detailed performance metrics, trade history, and account progression over time.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Important Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-blue-800">
            <li>• This portal is for monitoring only - traders execute trades via Volumetrica platforms</li>
            <li>• Currently connected to the staging environment for testing</li>
            <li>• All data refreshes automatically every 30 seconds</li>
            <li>• Authentication will be added in the next phase</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}