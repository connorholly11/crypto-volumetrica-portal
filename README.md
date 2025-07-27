# Crypto-Volumetrica Integration Portal

A comprehensive trading platform integration with Volumetrica, providing account management, risk monitoring, and trading rule enforcement for proprietary trading firms.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/crypto-volumetrica.git
cd crypto-volumetrica

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Set up database
npx prisma generate
npx prisma migrate dev

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📚 Documentation

Comprehensive documentation is available in the `/docs/` directory:

### Core Documentation
- **[Documentation Index](./docs/README.md)** - Start here for all documentation
- **[Architecture Overview](./docs/architecture/overview.md)** - System design and tech stack
- **[API Reference](./docs/architecture/api-reference.md)** - Endpoint documentation
- **[Development Setup](./docs/guides/development-setup.md)** - Get started quickly

### Quick Links
- [Business Logic](./docs/business/business-logic.md)
- [Testing Guide](./docs/guides/testing.md)
- [Deployment Guide](./docs/guides/deployment.md)
- [Troubleshooting](./docs/guides/troubleshooting.md)

## 🏗️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Query
- **External API**: Volumetrica Trading Platform
- **Monitoring**: Sentry
- **Rate Limiting**: Upstash Redis

## 🔑 Key Features

### For Traders
- Real-time account dashboard
- Performance metrics and charts
- Risk monitoring (drawdown, P&L)
- Trading rule visibility
- Automatic position management

### For Administrators
- User management system
- Account creation wizard
- Trading rule configuration
- Platform-wide analytics
- Audit logging

## 📁 Project Structure

```
crypto-vol-integration/
├── src/
│   ├── app/                      # Next.js App Router pages and API routes
│   │   ├── admin/               # Admin dashboard pages
│   │   ├── api/                 # API route handlers
│   │   ├── trader/              # Trader dashboard pages
│   │   └── (auth)/              # Authentication pages
│   ├── components/              # React components
│   │   ├── admin/              # Admin-specific components
│   │   ├── trader/             # Trader-specific components
│   │   └── ui/                 # Shared UI components (shadcn/ui)
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utilities and services
│   │   └── volumetrica/        # Volumetrica API client
│   └── types/                   # TypeScript type definitions
├── prisma/                      # Database schema and migrations
├── public/                      # Static assets
├── tests/                       # Test suites
├── volumetrica/                 # API documentation
└── rules-docs-agents/           # Comprehensive documentation
```

## 🛠️ Development

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn
- Clerk account
- Volumetrica API access

### Common Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed test data

# Testing
npm test            # Run all tests
npm run test:unit   # Unit tests only
npm run test:e2e    # E2E tests only

# Code Quality
npm run lint        # Run ESLint
npm run type-check  # TypeScript checking
npm run format      # Format with Prettier
```

## 🚀 Deployment

The application can be deployed to:

- **Vercel** (Recommended): One-click deployment with automatic CI/CD
- **AWS**: Using Docker containers with ECS/EKS
- **Self-hosted**: Using Docker Compose

See the [deployment guide](./rules-docs-agents/codebase-documentation/06-DEPLOYMENT-PRODUCTION.md) for detailed instructions.

## 🔒 Security

- All API routes are protected with authentication
- Rate limiting prevents abuse (10 requests/10 seconds)
- Input validation on all endpoints
- Encrypted data transmission
- Regular security audits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### For AI Agents
This project supports AI-assisted development. See:
- [AI Agent Introduction](./AI_AGENT_INTRO.md) for getting started
- [Agent Rules](./AGENT_RULES.md) for collaboration guidelines

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

- Documentation: `/rules-docs-agents/codebase-documentation`
- Issues: GitHub Issues
- Security: security@your-org.com

---

Built for proprietary trading firms in partnership with Volumetrica