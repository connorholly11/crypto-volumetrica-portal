# Welcome AI Agent! 👋

This is your starting point for working on the Crypto Volumetrica Portal project. Read this first!

## 🎯 Project Overview
We're building a **crypto trading portal** for a prop firm that integrates with Volumetrica's API:
- **Trader Dashboard**: View accounts, balances, P&L, drawdown status
- **Admin Dashboard**: Create accounts, manage users, set trading rules
- **No Trading**: This portal is for monitoring only - traders use Volumetrica's platforms

## 📚 Essential Files to Read (In Order)

### 1. Start Here - Understand the System
- 📋 **`AGENT_RULES.md`** - How we collaborate (READ THIS FIRST!)
- 📝 **`AGENT_COLLABORATION.md`** - Current work status and TODO list
- 🎯 **`PROTOTYPE_PLAN.md`** - Complete implementation plan

### 2. Technical References
- 🚀 **`QUICK_START.md`** - Setup instructions and dependencies
- 🎨 **`UI_COMPONENTS_GUIDE.md`** - UI patterns and component examples
- 📚 **`volumetrica/platform.md`** - Volumetrica API documentation
- 🔐 **`.env.local`** - API credentials (already configured)

## 🏃 Quick Start Workflow

### Step 1: Check Current Status
```bash
# Read the collaboration log to see what's been done
cat AGENT_COLLABORATION.md
```

### Step 2: Claim Your Task
1. Choose an unclaimed task from the TODO list in `AGENT_COLLABORATION.md`
2. Update the collaboration log:
```markdown
## [WORKING] Agent [YourName] - Installing Dependencies
Started: 2024-01-26 4:00 PM
Expected Completion: 30 minutes
```

### Step 3: Do The Work
Follow the patterns and examples in the documentation. Key points:
- Use **TypeScript** for everything
- Use **shadcn/ui** components (see UI_COMPONENTS_GUIDE.md)
- Follow **Next.js 13+ App Router** patterns
- All Volumetrica API calls go through API routes (not direct from frontend)

### Step 4: Update When Done
```markdown
## [COMPLETED] Agent [YourName] - Installing Dependencies
Started: 2024-01-26 4:00 PM
Finished: 2024-01-26 4:25 PM

### What I Did:
- ✅ Installed all npm packages
- ✅ Initialized shadcn/ui
- ✅ Added all required components

### Files Modified:
- package.json
- components.json (new)
- src/components/ui/* (new)
```

## 🔧 Technical Setup

### Current Stack
- **Framework**: Next.js 15.4.4 with TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **API**: Next.js API Routes (no separate backend)
- **State**: React Query for caching
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Tables**: TanStack Table

### Project Structure
```
crypto-vol-integration/
├── src/
│   ├── app/             # Next.js app directory
│   │   ├── api/         # API routes
│   │   ├── trader/      # Trader dashboard
│   │   └── admin/       # Admin dashboard
│   ├── components/      # React components
│   ├── lib/            # Utilities & API client
│   └── types/          # TypeScript types
├── volumetrica/        # API documentation
└── [config files]
```

## 🚨 Important Rules

### DO:
✅ Check `AGENT_COLLABORATION.md` before starting  
✅ Update the log when you start/finish  
✅ Follow existing patterns  
✅ Use TypeScript strictly  
✅ Test your work  
✅ Ask questions in the collaboration log  

### DON'T:
❌ Edit files another agent is working on  
❌ Change established patterns  
❌ Skip documentation updates  
❌ Leave broken code  

## 🎯 Current Priorities

1. **If nothing is started**: Begin with Phase 1 (dependencies & setup)
2. **If setup is done**: Create the Volumetrica API client
3. **If API client exists**: Build API routes
4. **If routes exist**: Create UI components
5. **Always**: Update collaboration log!

## 💡 Key Decisions Already Made

1. **No Backend** - Using Next.js API routes only
2. **No Database** - All data from Volumetrica (for prototype)
3. **No Auth** - Adding later (prototype first)
4. **shadcn/ui** - For all UI components
5. **Polling** - Refresh data every 30 seconds (no websockets yet)

## 🔍 Where to Find Examples

### API Route Pattern
See `PROTOTYPE_PLAN.md` section "Server-side in API Routes"

### Component Pattern
See `UI_COMPONENTS_GUIDE.md` for complete examples

### Volumetrica API
See `volumetrica/platform.md` for endpoints and responses

## 📞 Getting Help

If you're stuck:
1. Check if your question is answered in the docs
2. Look for similar patterns in the plan
3. Add a `[BLOCKED]` entry in `AGENT_COLLABORATION.md`
4. Explain what you need to get unblocked

## 🚀 Ready to Start?

1. Read `AGENT_COLLABORATION.md` 
2. Pick your task
3. Update the log
4. Start coding!
5. Have fun building! 

Remember: **Communication prevents conflicts!** Always update the collaboration log.

---
*Good luck! You're building something awesome! 🎯*