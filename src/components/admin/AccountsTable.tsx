"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { toast } from "sonner"
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Loader2,
  AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

import { type TradingAccount, AccountStatus } from "@/types/volumetrica"
import { cn, formatCurrency, formatPercentage } from "@/lib/utils"

interface AccountsTableProps {
  userId?: string
  refreshInterval?: number
}

export function AccountsTable({ userId, refreshInterval = 30000 }: AccountsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [disableDialogOpen, setDisableDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<TradingAccount | null>(null)
  const [disableReason, setDisableReason] = useState("")

  const queryClient = useQueryClient()

  // Fetch accounts data
  const { data, isLoading, error } = useQuery({
    queryKey: ["accounts", userId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (userId) params.append("userId", userId)
      
      const response = await fetch(`/api/accounts/list?${params}`)
      if (!response.ok) throw new Error("Failed to fetch accounts")
      const result = await response.json()
      return result.data.items as TradingAccount[]
    },
    refetchInterval: refreshInterval,
  })

  // Enable account mutation
  const enableAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await fetch(`/api/accounts/${accountId}/enable`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to enable account")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      toast.success("Account enabled successfully")
    },
    onError: (error) => {
      toast.error("Failed to enable account", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })

  // Disable account mutation
  const disableAccountMutation = useMutation({
    mutationFn: async ({ accountId, reason }: { accountId: string; reason: string }) => {
      const response = await fetch(`/api/accounts/${accountId}/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      if (!response.ok) throw new Error("Failed to disable account")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      toast.success("Account disabled successfully")
      setDisableDialogOpen(false)
      setSelectedAccount(null)
      setDisableReason("")
    },
    onError: (error) => {
      toast.error("Failed to disable account", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })

  const getStatusBadge = (status: AccountStatus) => {
    switch (status) {
      case AccountStatus.Enabled:
        return <Badge variant="default">Enabled</Badge>
      case AccountStatus.ChallengeSuccess:
        return <Badge className="bg-green-500">Challenge Passed</Badge>
      case AccountStatus.ChallengeFailed:
        return <Badge variant="destructive">Challenge Failed</Badge>
      case AccountStatus.Disabled:
        return <Badge variant="secondary">Disabled</Badge>
      default:
        return <Badge variant="outline">Initialized</Badge>
    }
  }

  const getDrawdownColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 80) return "text-orange-500"
    if (percentage >= 50) return "text-yellow-500"
    return "text-green-500"
  }

  const columns: ColumnDef<TradingAccount>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "accountId",
      header: "Account ID",
      cell: ({ row }) => (
        <div className="font-mono text-xs">{row.getValue("accountId")}</div>
      ),
    },
    {
      accessorKey: "header",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Account
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("header")}</div>,
    },
    {
      accessorKey: "balance",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Balance
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("balance"))
        return <div className="font-mono">{formatCurrency(amount)}</div>
      },
    },
    {
      accessorKey: "equity",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Equity
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("equity"))
        return <div className="font-mono">{formatCurrency(amount)}</div>
      },
    },
    {
      id: "pnl",
      header: "P&L",
      cell: ({ row }) => {
        const account = row.original
        const pnl = account.realizedPnL + account.unrealizedPnL
        const pnlPercentage = (pnl / account.balance) * 100
        return (
          <div className="flex flex-col">
            <span
              className={cn(
                "font-medium",
                pnl >= 0 ? "text-green-600" : "text-red-600"
              )}
            >
              {pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}
            </span>
            <span className="text-xs text-muted-foreground">
              {pnl >= 0 ? "+" : ""}{formatPercentage(pnlPercentage)}
            </span>
          </div>
        )
      },
    },
    {
      id: "drawdown",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Drawdown
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const account = row.original
        const drawdownPercent = (account.drawdown / account.balance) * 100
        const maxDrawdownPercent = (account.maxDrawdown / account.balance) * 100
        return (
          <div className="flex items-center gap-2">
            <Progress
              value={(drawdownPercent / maxDrawdownPercent) * 100}
              className="h-2 w-20"
            />
            <span className={cn("text-sm", getDrawdownColor(drawdownPercent))}>
              {formatPercentage(drawdownPercent)}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const account = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(account.accountId)}
              >
                Copy account ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem>View trading rules</DropdownMenuItem>
              <DropdownMenuSeparator />
              {account.status === AccountStatus.Enabled ? (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedAccount(account)
                    setDisableDialogOpen(true)
                  }}
                  className="text-red-600"
                >
                  Disable account
                </DropdownMenuItem>
              ) : account.status === AccountStatus.Disabled ? (
                <DropdownMenuItem
                  onClick={() => enableAccountMutation.mutate(account.accountId)}
                >
                  Enable account
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: data || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load accounts</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Trading Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <Input
              placeholder="Filter accounts..."
              value={(table.getColumn("header")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("header")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disable Account Dialog */}
      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to disable this account? This action can be reversed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm">
              <p className="font-medium">Account: {selectedAccount?.header}</p>
              <p className="text-muted-foreground">ID: {selectedAccount?.accountId}</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium">
                Reason for disabling
              </label>
              <Textarea
                id="reason"
                placeholder="Enter reason..."
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDisableDialogOpen(false)
                setSelectedAccount(null)
                setDisableReason("")
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedAccount && disableReason) {
                  disableAccountMutation.mutate({
                    accountId: selectedAccount.accountId,
                    reason: disableReason,
                  })
                }
              }}
              disabled={!disableReason || disableAccountMutation.isPending}
            >
              {disableAccountMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}