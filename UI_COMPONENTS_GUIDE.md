# UI Components Guide - Crypto Volumetrica Portal

## Component Library Strategy

### Why shadcn/ui?
- **No bloat**: Copy only components you need
- **Full control**: Components live in your codebase
- **TypeScript first**: Complete type safety
- **Accessible**: WCAG compliant out of the box
- **Customizable**: Tailwind-based styling
- **Production ready**: Battle-tested components

## Core Components Needed

### 1. Data Display Components
```tsx
// Account Balance Card
<Card className="border-0 shadow-sm">
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">
      Total Balance
    </CardTitle>
    <DollarSign className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">$124,589.00</div>
    <p className="text-xs text-muted-foreground">
      <span className="text-green-600">+4.5%</span> from yesterday
    </p>
  </CardContent>
</Card>

// Status Badges
<Badge variant="default">Enabled</Badge>
<Badge variant="success">Challenge Passed</Badge>
<Badge variant="destructive">Challenge Failed</Badge>
<Badge variant="warning">At Risk</Badge>
```

### 2. Drawdown Visualization
```tsx
// Linear Progress Bar with Danger Zones
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>Drawdown</span>
    <span className="font-medium">7.2% / 10%</span>
  </div>
  <Progress 
    value={72} 
    className="h-2"
    indicatorClassName={cn(
      value > 90 ? "bg-red-600" :
      value > 80 ? "bg-orange-500" :
      value > 50 ? "bg-yellow-500" :
      "bg-green-500"
    )}
  />
</div>
```

### 3. Data Tables (TanStack Table + shadcn/ui)
```tsx
// Accounts Overview Table
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Account</TableHead>
      <TableHead>Balance</TableHead>
      <TableHead>P&L</TableHead>
      <TableHead>Drawdown</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {accounts.map((account) => (
      <TableRow key={account.id}>
        <TableCell className="font-medium">{account.header}</TableCell>
        <TableCell className="font-mono">${account.balance}</TableCell>
        <TableCell>
          <span className={cn(
            "font-medium",
            account.pnl >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {account.pnl >= 0 ? "+" : ""}{account.pnl}%
          </span>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Progress value={account.drawdownPercent} className="w-20 h-2" />
            <span className="text-sm">{account.drawdownPercent}%</span>
          </div>
        </TableCell>
        <TableCell>
          <StatusBadge status={account.status} />
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Enable/Disable</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 4. Forms (React Hook Form + shadcn/ui)
```tsx
// Account Creation Form
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
      name="balance"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Starting Balance</FormLabel>
          <FormControl>
            <Input 
              type="number" 
              placeholder="100000"
              {...field}
              onChange={e => field.onChange(+e.target.value)}
            />
          </FormControl>
          <FormDescription>
            Initial account balance in USD
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
    
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating Account...
        </>
      ) : (
        "Create Account"
      )}
    </Button>
  </form>
</Form>
```

### 5. Charts (Recharts)
```tsx
// P&L Chart
<Card>
  <CardHeader>
    <CardTitle>Performance</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={performanceData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip 
          content={<CustomTooltip />}
          contentStyle={{ 
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))'
          }}
        />
        <Area 
          type="monotone" 
          dataKey="balance" 
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.2}
        />
      </AreaChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

### 6. Loading States
```tsx
// Skeleton Loading
<Card>
  <CardHeader>
    <Skeleton className="h-4 w-32" />
  </CardHeader>
  <CardContent className="space-y-2">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-4 w-24" />
  </CardContent>
</Card>

// Inline Loading
{isLoading ? (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
) : (
  <DataTable data={accounts} />
)}
```

### 7. Notifications (Sonner)
```tsx
// Success/Error Toasts
toast.success("Account created successfully");
toast.error("Failed to disable account", {
  description: error.message,
});

// Custom Styled Toast
toast.custom((t) => (
  <div className="flex items-center gap-2 rounded-lg border bg-background p-4 shadow-lg">
    <AlertCircle className="h-5 w-5 text-yellow-600" />
    <div>
      <p className="font-medium">Account at Risk</p>
      <p className="text-sm text-muted-foreground">
        Drawdown approaching limit (85%)
      </p>
    </div>
  </div>
));
```

## Color Scheme

### Semantic Colors
```css
/* Profit/Loss */
--profit: #10b981; /* green-500 */
--loss: #ef4444;   /* red-500 */

/* Risk Levels */
--safe: #10b981;     /* green-500 */
--caution: #f59e0b;  /* amber-500 */
--warning: #f97316;  /* orange-500 */
--danger: #ef4444;   /* red-500 */

/* Status */
--enabled: #3b82f6;  /* blue-500 */
--disabled: #6b7280; /* gray-500 */
--success: #10b981;  /* green-500 */
--failed: #ef4444;   /* red-500 */
```

## Responsive Design

### Breakpoints
- **Desktop First**: Primary target is desktop traders
- **Tablet**: Simplified layout, stacked cards
- **Mobile**: Basic view only (not priority)

```tsx
// Responsive Grid
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {/* Account cards */}
</div>

// Responsive Table (scroll on mobile)
<div className="overflow-x-auto">
  <Table className="min-w-[600px]">
    {/* Table content */}
  </Table>
</div>
```

## Installation Commands

```bash
# Install all UI dependencies
npm install @tanstack/react-query @tanstack/react-table
npm install react-hook-form @hookform/resolvers zod
npm install recharts date-fns
npm install lucide-react
npm install sonner
npm install class-variance-authority clsx tailwind-merge

# Initialize shadcn/ui
npx shadcn-ui@latest init

# Add essential components
npx shadcn-ui@latest add button card dialog form input label
npx shadcn-ui@latest add select table tabs badge alert
npx shadcn-ui@latest add dropdown-menu progress skeleton
npx shadcn-ui@latest add toast sheet command
```

## Best Practices

1. **Consistent Spacing**: Use Tailwind's spacing scale
2. **Accessible**: Always include ARIA labels
3. **Loading States**: Show skeletons, not spinners
4. **Error States**: Clear, actionable error messages
5. **Mobile**: Ensure critical features work on tablet
6. **Performance**: Virtualize long lists
7. **Animations**: Subtle, not distracting