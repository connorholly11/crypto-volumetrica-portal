# Agent Collaboration Rules

## Purpose
This document establishes clear rules for how multiple AI agents should collaborate on the Crypto Volumetrica Portal project to ensure consistency, avoid conflicts, and maintain high code quality.

## Core Principles

### 1. Communication First
- **Always check** `AGENT_COLLABORATION.md` before starting work
- **Update immediately** when starting a new task
- **Document completion** when finishing a task
- **Flag blockers** if you encounter issues

### 2. Task Ownership
- **One agent per file** - Don't edit files another agent is working on
- **Claim your task** - Update collaboration.md with your current work
- **Complete your scope** - Finish what you start before moving on
- **Hand off cleanly** - Document what's done and what's next

### 3. Code Consistency
- **Follow existing patterns** - Check how similar features are implemented
- **Use project conventions** - TypeScript, shadcn/ui components, API patterns
- **Maintain file structure** - Follow the established project organization
- **Test your changes** - Ensure nothing breaks before marking complete

## Workflow Rules

### Starting Work
1. Read `AGENT_COLLABORATION.md` to see current status
2. Choose an unclaimed task from the TODO list
3. Add entry: `[WORKING] Agent X - Task description - Started: timestamp`
4. Begin implementation

### During Work
1. If you need to modify a file another agent touched:
   - Check if they marked it complete
   - If not complete, wait or choose different task
2. Follow the established patterns in:
   - API route structure
   - Component organization
   - Type definitions
   - Error handling

### Completing Work
1. Test your implementation
2. Update collaboration.md: `[COMPLETED] Agent X - Task description - Finished: timestamp`
3. List any new TODOs discovered
4. Note any important decisions made

### Handling Conflicts
1. **File conflicts**: Don't edit files marked as "WORKING" by another agent
2. **Design conflicts**: Follow existing patterns, note concerns in collaboration.md
3. **Dependency conflicts**: Use versions specified in package.json
4. **API conflicts**: Follow the Volumetrica API patterns established

## Technical Standards

### Code Style
```typescript
// Always use TypeScript with proper types
interface AccountData {
  id: string;
  balance: number;
  status: 'Enabled' | 'Disabled' | 'ChallengeFailed';
}

// Use async/await for API calls
async function fetchAccount(id: string): Promise<AccountData> {
  // Implementation
}

// Follow Next.js 13+ App Router conventions
export async function GET(request: Request) {
  // API route implementation
}
```

### Component Standards
```tsx
// Use shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Consistent prop interfaces
interface AccountCardProps {
  account: AccountData;
  onRefresh?: () => void;
}

// Proper loading/error states
if (isLoading) return <Skeleton />;
if (error) return <ErrorAlert message={error.message} />;
```

### API Integration
- All Volumetrica calls go through `/lib/volumetrica/client.ts`
- Use consistent error handling
- Follow the response wrapper pattern
- Implement proper TypeScript types

### File Organization
```
/src/app/api/[resource]/       # API routes
/src/components/[feature]/      # Feature-specific components  
/src/components/ui/            # shadcn/ui components only
/src/lib/                      # Utilities and API clients
/src/types/                    # Shared TypeScript types
```

## Documentation Standards

### In-Code Documentation
```typescript
/**
 * Fetches account data from Volumetrica API
 * @param accountId - The Volumetrica account ID
 * @returns Account data with current balance and status
 * @throws {VolumetricaError} If API request fails
 */
```

### Collaboration Updates
```markdown
## [WORKING] Agent Alpha - Implementing Account API Routes
Started: 2024-01-26 10:30 AM

### Progress:
- ✅ Created `/api/accounts/[accountId]/route.ts`
- ✅ Added TypeScript types for account response
- 🔄 Working on error handling

### Notes:
- Using standard Volumetrica response wrapper
- Following existing pattern from user routes
```

## Priority Order

1. **Core API Client** - Must be done first
2. **API Routes** - Required for frontend
3. **UI Components** - Can be built in parallel
4. **Integration** - Wire everything together
5. **Polish** - Error handling, loading states

## Do's and Don'ts

### DO:
- ✅ Read existing code before implementing
- ✅ Follow TypeScript strictly
- ✅ Use shadcn/ui components
- ✅ Handle errors gracefully
- ✅ Update documentation
- ✅ Test your implementation
- ✅ Communicate blockers

### DON'T:
- ❌ Modify files marked as "WORKING"
- ❌ Change established patterns
- ❌ Skip error handling
- ❌ Leave console.logs in code
- ❌ Commit broken code
- ❌ Work on multiple features simultaneously
- ❌ Assume - ask in collaboration.md if unsure

## Communication Template

### Starting Task
```
## [WORKING] Agent [Name] - [Task Description]
Started: [Timestamp]
Expected Completion: [Estimate]
Dependencies: [Any files/features needed]
```

### Completing Task
```
## [COMPLETED] Agent [Name] - [Task Description]
Started: [Start Time]
Finished: [End Time]

### What I Did:
- [List of completed items]

### Files Modified:
- [List of files changed]

### Next Steps:
- [What needs to be done next]

### Notes:
- [Any important decisions or patterns established]
```

### Blocking Issue
```
## [BLOCKED] Agent [Name] - [Task Description]
Blocked Since: [Timestamp]
Reason: [Why you're blocked]
Need: [What would unblock you]
```

Remember: Clear communication prevents conflicts and speeds development!