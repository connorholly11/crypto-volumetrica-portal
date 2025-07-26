# Crypto Volumetrica Portal

A professional trading portal for prop firm crypto trading management integrated with Volumetrica's platform.

## 🤖 For AI Agents
**Start here**: [`AI_AGENT_INTRO.md`](./AI_AGENT_INTRO.md)

## 📋 Documentation Structure

### Planning & Architecture
- [`PROTOTYPE_PLAN.md`](./PROTOTYPE_PLAN.md) - Complete implementation plan
- [`QUICK_START.md`](./QUICK_START.md) - Quick setup guide
- [`UI_COMPONENTS_GUIDE.md`](./UI_COMPONENTS_GUIDE.md) - UI component patterns

### Collaboration
- [`AI_AGENT_INTRO.md`](./AI_AGENT_INTRO.md) - Starting point for AI agents
- [`AGENT_RULES.md`](./AGENT_RULES.md) - Collaboration guidelines
- [`AGENT_COLLABORATION.md`](./AGENT_COLLABORATION.md) - Work tracking log

### API Documentation
- [`volumetrica/platform.md`](./volumetrica/platform.md) - Volumetrica platform API
- [`volumetrica/trading-api.md`](./volumetrica/trading-api.md) - Trading API (reference only)

## 🚀 Quick Start

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment** (already configured in `.env.local`)

3. **Run development server**:
```bash
npm run dev
```

4. **Access the portal**:
- Home: http://localhost:3000
- Trader Dashboard: http://localhost:3000/trader/[userId]
- Admin Dashboard: http://localhost:3000/admin

## 🏗️ Project Status

Currently in **Phase 1: Setup & Core Implementation**

See [`AGENT_COLLABORATION.md`](./AGENT_COLLABORATION.md) for current progress and available tasks.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.4.4 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **API**: Next.js API Routes
- **State Management**: React Query
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Tables**: TanStack Table

## 📁 Project Structure

```
crypto-vol-integration/
├── src/
│   ├── app/             # Next.js pages and API routes
│   ├── components/      # React components
│   ├── lib/            # Utilities and API client
│   └── types/          # TypeScript definitions
├── public/             # Static assets
├── volumetrica/        # API documentation
└── [documentation]     # Project docs
```

## 🔗 Key Features

### Trader Dashboard
- Real-time account balance and equity
- P&L tracking with visual indicators
- Drawdown monitoring with risk alerts
- Trading rules display
- Performance metrics and charts

### Admin Dashboard  
- Quick account creation workflow
- User management system
- Trading rules templates
- Account monitoring table
- Enable/disable accounts

## 🤝 Contributing

This project uses AI agents for development. See:
- [`AI_AGENT_INTRO.md`](./AI_AGENT_INTRO.md) for getting started
- [`AGENT_RULES.md`](./AGENT_RULES.md) for collaboration rules
- [`AGENT_COLLABORATION.md`](./AGENT_COLLABORATION.md) for current status

---

Built for [Prop Firm Name] in partnership with Volumetrica
