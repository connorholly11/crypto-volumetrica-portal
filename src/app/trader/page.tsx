import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function TraderDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Trader Dashboard</h1>
        <p className="text-gray-600">Monitor your trading accounts and performance</p>
      </div>

      <Alert className="mb-6">
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          This is a placeholder page. The trader dashboard will display account balances, P&L metrics, 
          drawdown status, and trading rules once the API integration is complete.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
            <CardDescription>View all your trading accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Track your P&L and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trading Rules</CardTitle>
            <CardDescription>View active trading restrictions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}