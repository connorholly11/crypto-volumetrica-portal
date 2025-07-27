# Quick Start - Crypto Volumetrica Portal

## What We're Building
A professional trading portal for your prop firm with:
- **Trader Dashboard**: View accounts, balances, P&L, drawdown status
- **Admin Dashboard**: Create accounts, manage users, set trading rules
- **No Trading Execution**: Traders use Volumetrica's platforms to trade

## UI/UX Approach
✅ **Using shadcn/ui** - Professional, customizable components
✅ **Functional First** - Clean data display, not decorative
✅ **Color Coding** - Green/red for P&L, status badges, risk indicators
✅ **Responsive Tables** - TanStack Table for sorting/filtering
✅ **Real-time Updates** - Auto-refresh every 30 seconds
✅ **Professional Look** - Similar to trading platforms

## Key Design Elements

### 1. Account Cards
- Large, clear numbers for balance/equity
- Color-coded P&L with trend arrows
- Progress bars for drawdown visualization
- Status badges (Enabled/Failed/Success)

### 2. Data Tables
- Sortable columns
- Quick action dropdowns
- Inline risk indicators
- Responsive horizontal scroll

### 3. Forms
- Multi-step account creation
- Validation with helpful errors
- Loading states during submission
- Success toasts

### 4. Charts
- Clean line/area charts for performance
- Tooltips with detailed info
- Responsive containers

## Next Steps

1. **Install Dependencies** (5 minutes)
```bash
cd crypto-vol-integration
npm install @tanstack/react-query @tanstack/react-table axios zod
npm install react-hook-form @hookform/resolvers
npm install recharts date-fns lucide-react sonner
npm install class-variance-authority clsx tailwind-merge
```

2. **Setup shadcn/ui** (10 minutes)
```bash
npx shadcn-ui@latest init
# Choose: TypeScript, Yes to CSS variables, src/app structure

# Add components we need
npx shadcn-ui@latest add button card dialog form input label
npx shadcn-ui@latest add select table tabs badge alert
npx shadcn-ui@latest add dropdown-menu progress skeleton toast
```

3. **Start Building**
- Create API client first
- Build API routes
- Create UI components
- Wire everything together

## File References
- 📋 Full Plan: `PROTOTYPE_PLAN.md`
- 🎨 UI Guide: `UI_COMPONENTS_GUIDE.md`
- 📚 API Docs: `volumetrica/platform.md`
- 🔐 Credentials: `.env.local`

Ready to start building! The UI will be clean, professional, and efficient to develop with shadcn/ui.