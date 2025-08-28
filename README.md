# X Bon - Luxury Commodities Exchange

A secure, transparent platform for managing broker chains across gold mines and refineries worldwide.

## Features

🔐 **Invite-Only Authentication** - Secure token-based registration system
🏗️ **Agent Management** - Create hierarchical broker chains with parent-child relationships
💎 **Multi-Commodity Trading** - Support for gold, silver, oil, and diamond transactions
🔒 **Deal Encryption** - Sensitive deal details encrypted with AES-256-GCM
📊 **Real-time Dashboard** - Live statistics and deal tracking
🔄 **Status Management** - Complete deal lifecycle from initiation to closure

## Architecture

This is a monorepo containing:
- **Web App** (Next.js 15 + React 19 + Tailwind CSS)
- **API Server** (NestJS + TypeScript)
- **Mobile App** (React Native - in development)

## Quick Start

### Prerequisites
- Node.js 20.11.0+
- npm 10.2.4+

### Installation

```bash
# Install dependencies
npm install

# Start development servers
npm run dev
```

This will start:
- Web app: http://localhost:3000
- API server: http://localhost:3001

### Project Structure

```
apps/
├── web/          # Next.js frontend
├── api/          # NestJS backend
└── mobile/       # React Native app
packages/         # Shared packages
```

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register-by-invite` - Register with invite token
- `POST /auth/update-profile` - Update user profile type

### Invites
- `POST /invites` - Create invitation link

### Agents
- `GET /agents` - List all agents
- `POST /agents` - Create new agent
- `GET /agents/:id` - Get agent details

### Deals
- `GET /deals` - List all deals
- `POST /deals` - Create new deal
- `GET /deals/:id` - Get deal details
- `PATCH /deals/:id/status` - Update deal status

## User Roles

- **Broker** - Facilitates transactions between parties
- **Principal** - Direct participant in deals
- **Seller** - Commodity provider
- **Introducer** - Connects parties for deals
- **Buyer** - Commodity purchaser

## Deal Lifecycle

1. **Initiated** - Deal created
2. **KYC** - Know Your Customer verification
3. **Contracted** - Legal agreements signed
4. **Inspection** - Commodity quality verification
5. **Payment** - Financial transaction
6. **Shipped** - Commodity delivery
7. **Closed** - Deal completed
8. **Cancelled** - Deal terminated

## Security Features

- Token-based authentication
- Invite-only registration
- AES-256-GCM encryption for sensitive data
- Input validation and sanitization
- CORS protection

## Development

### Scripts

```bash
npm run dev      # Start all development servers
npm run build    # Build all applications
npm run lint     # Run linting
npm run clean    # Clean build artifacts
```

### Environment Variables

Create `.env` files in respective app directories:

**apps/web/.env.local:**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WEB_URL=http://localhost:3000
```

**apps/api/.env:**
```
ENCRYPTION_KEY=your-32-byte-encryption-key-here
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

Private - All rights reserved

---

Built for secure, transparent broker chains across gold mines and refineries worldwide.