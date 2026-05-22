<div align="center">
  <img src="./frontend/public/assets/logo/selora-logo-icon-blue-bg-white-stroke.png" alt="Selorah Health Logo" width="150" />

  # Selorah Health

  **Your health story, everywhere you go.**

  [**View Live Application**](http://selorah.vercel.app/)

  [𝕏 (@selorahealth)](https://x.com/selorahealth) • [LinkedIn (Selorah Health)](https://www.linkedin.com/company/selorahealth/) • [GitHub](https://github.com/Selorah-Health)

  ---
</div>

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Documentation](#documentation)

## Overview

**Selorah Health** is a next-generation SaaS Electronic Medical Records (EMR) platform built on Web3 principles and deployed on the Monad blockchain network. It bridges seamless Web2 user experiences with Web3 security infrastructure.

### Core Value Proposition
Selorah empowers patients to:
- **Legally own** their complete medical history
- **Encrypt** sensitive health data with blockchain-grade security
- **Grant temporary, time-bound access** to healthcare providers and researchers via secure QR codes
- **Maintain full auditability** of who accessed their data and when
- **Share records** across multiple healthcare systems without data loss or fragmentation

### Key Problem Solved
Traditional EMR systems fragment patient data across multiple providers, creating silos and security vulnerabilities. Selorah creates a **single source of truth** for patient medical history with cryptographic verification.

## Architecture

This repository is architected as a **monorepo** with distinct, independently deployable environments:

### Project Environments

| Environment | Technology | Purpose |
|---|---|---|
| **/frontend** | React 19, Vite, Tailwind CSS v4, TypeScript | Web portal for patient/provider dashboards, record management, QR code generation |
| **/backend** | Node.js, Express, TypeScript, Supabase/PostgreSQL, Socket.io | REST API, real-time data synchronization, authentication, onboarding workflows |
| **/blockchain** | Hardhat, Solidity 0.8.24, Monad Testnet | Smart contracts for access control, time-restricted token verification |

### Data Flow Architecture
```
Patient Portal (React) 
    ↓ (REST/WebSocket)
Express Backend (Node.js/TS)
    ↓ (Auth via Supabase)
Supabase PostgreSQL Database
    ↓ (RLS Policies)
Medical Records Storage
    ↓ (Access Control)
Smart Contracts (Monad Blockchain)
```

## Features

### 1. Progressive Identity Verification
- **Role-based Onboarding**: Intelligently distinguishes between mild forms for patients and stricter KYC validations for enterprise partners
- **Supported Roles**: Patient, Provider, Researcher, Insurer, Developer, Partner
- **Multi-factor Verification**: Phone-based WhatsApp authentication, email verification, document upload
- **Emergency Contact Management**: Up to 3 contacts for standard users, 5 for Pro users

### 2. Time-restricted QR Code Access
- **Smart Contract Enforcement**: QR codes encode access tokens with cryptographic expiration
- **Prevents Data Scraping**: Time-bound verification prevents unauthorized long-term data access
- **Recipient Tracking**: Full audit log of who accessed which records and when
- **One-time or Multi-access**: Configurable access patterns per data share

### 3. Real-time Synchronicity
- **WebSocket Architecture**: Instant updates via Socket.io when records are modified
- **Supabase RLS Integration**: Row-level security policies enforce data privacy at the database level
- **Eventual Consistency**: Distributed updates across patient and provider portals without lag

### 4. Enterprise Role Support
- **Providers**: Hospital affiliations, specialty tracking, license verification
- **Researchers**: Study management, batch access requests, HIPAA compliance
- **Insurers**: Claims integration, policy linking, coverage verification
- **Pro Features**: Advanced analytics, priority support, extended contact lists

## Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 19.2.4 | UI framework |
| Vite | 8.0.10 | Build tool & dev server |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Styling |
| React Router DOM | 6.24.0 | Client-side routing |
| Supabase SSR | 0.7.0 | Server-side authentication |
| Recharts | 3.8.1 | Data visualization |
| QRCode.react | 4.2.0 | QR code generation |
| Heroicons React | 2.2.0 | Icon library |

### Backend
| Package | Version | Purpose |
|---|---|---|
| Express | 4.22.1 | Web framework |
| TypeScript | 5.4.5 | Type safety |
| Node.js | 20+ | Runtime |
| Supabase JS | 2.42.0 | Database & auth client |
| Socket.io | 4.7.5 | Real-time communication |
| CORS | 2.8.5 | Cross-origin requests |
| dotenv | 16.4.5 | Environment configuration |
| ts-node | 10.9.2 | TypeScript execution |
| Nodemon | 3.1.14 | Dev auto-reload |

### Blockchain
| Package | Version | Purpose |
|---|---|---|
| Hardhat | Latest | Smart contract development framework |
| Solidity | 0.8.24 | Smart contract language |
| Monad Testnet | - | EVM-compatible blockchain |

### Database Schema
**Core Tables**:
- `auth.users` - Supabase authentication users
- `profiles` - User roles, KYC data, personal information
- `medical_records` - Patient records with metadata
- `access_logs` - Audit trail of data access
- `emergency_contacts` - Emergency contact information

## Project Structure

```
selorah/
├── frontend/                      # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── dashboard/        # Dashboard-specific components
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── Header.tsx
│   │   │   └── ...
│   │   ├── pages/                # Page-level routes
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   ├── hospital/         # Hospital role pages
│   │   │   ├── insurer/          # Insurer role pages
│   │   │   └── researcher/       # Researcher role pages
│   │   ├── contexts/             # React Context (LanguageContext)
│   │   ├── lib/                  # Utilities & helpers
│   │   │   ├── supabase/         # Supabase client setup
│   │   │   └── utils/            # Currency, formatting utilities
│   │   └── App.tsx, main.tsx
│   ├── public/                   # Static assets
│   │   └── assets/               # Images, logos, videos, fonts
│   └── package.json, vite.config.ts, tsconfig.json
│
├── backend/                       # Node.js Express server
│   ├── src/
│   │   ├── index.ts              # Express app setup
│   │   ├── socket.ts             # Socket.io initialization
│   │   ├── routes/               # API routes
│   │   │   └── auth.ts           # Authentication & onboarding endpoints
│   │   └── services/             # Business logic
│   │       ├── authService.ts    # Auth logic, UID generation
│   │       └── supabaseClient.ts # Supabase instance
│   ├── package.json, tsconfig.json
│   └── dist/                     # Compiled JavaScript
│
├── blockchain/                    # Hardhat smart contracts
│   ├── contracts/                # Solidity contracts
│   │   ├── SelorahAccessControl.sol  # Access control logic
│   │   └── SelorahIdentity.sol       # Identity verification
│   ├── scripts/
│   │   └── deploy.ts             # Deployment scripts
│   ├── hardhat.config.ts         # Network configuration
│   └── package.json
│
├── schema.sql                     # Database schema
├── README.md                      # This file
├── architecture.md               # System design documentation
├── BUGS.md                        # Known issues & fixes
├── ARCHITECTURE_DIAGRAM.md       # Visual system diagrams
├── .env.example                  # Environment variables template
└── package.json                  # Root monorepo configuration
```

## Getting Started

### Prerequisites
- **Node.js**: v18+ (v20 recommended)
- **npm**: v9+
- **Supabase Account**: Create at https://supabase.com
- **Git**: For version control

### Installation Steps

#### 1. Clone the Repository
```bash
git clone https://github.com/Selorah-Health/selorah.git
cd selorah
```

#### 2. Install Root Dependencies
```bash
npm install
```

#### 3. Setup Environment Variables
Create `.env`, `.env.example` files in root directory (see [Environment Setup](#environment-setup) section):
```bash
cp .env.example .env
# Edit .env with your credentials
```

#### 4. Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

#### 5. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

#### 6. Install Blockchain Dependencies (Optional)
```bash
cd blockchain
npm install
cd ..
```

## Environment Setup

All environment configurations are managed via `.env` files. See [.env.example](.env.example) for a complete template.

### Root Level (.env)
Required for monorepo coordination:
```
NODE_ENV=development
```

### Backend (.env)
Located in `/backend/.env`:
```
PORT=5000
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key
```

### Frontend (.env)
Located in `/frontend/.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Blockchain (.env)
Located in `/blockchain/.env`:
```
PRIVATE_KEY=your_wallet_private_key
MONAD_TESTNET_RPC=https://testnet-rpc.monad.xyz
```

**⚠️ Security Note**: Never commit `.env` files to version control. Always use `.env.example` templates.

## Development

### Running All Services

#### Option 1: Run Each Service Separately
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - (Optional) Blockchain
cd blockchain
npm run dev
```

#### Option 2: Run Frontend Only (with deployed backend)
```bash
npm run dev
# Runs frontend via Vite on http://localhost:5173
```

### Development Workflow

**Backend Development**:
```bash
cd backend
npm run dev      # Start with auto-reload (uses nodemon + ts-node)
npm run build    # Compile TypeScript to dist/
npm run start    # Run compiled version
```

**Frontend Development**:
```bash
cd frontend
npm run dev      # Start Vite dev server (hot reload)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

**Blockchain Development**:
```bash
cd blockchain
npm run compile  # Compile smart contracts
npm run test     # Run tests
npm run deploy   # Deploy to Monad Testnet
```

### Debugging
- **Frontend**: Browser DevTools (Inspect Elements, Network, Console tabs)
- **Backend**: Check logs in terminal or use `DEBUG=*` environment variable
- **Database**: Use Supabase dashboard at https://app.supabase.com

## Deployment

### Frontend Deployment
The frontend is configured for **Vercel** deployment (see `frontend/vercel.json`):
```bash
npm run build
# Deploy to Vercel CLI or via GitHub integration
```

### Backend Deployment
Deploy to any Node.js hosting (Heroku, Railway, Render, etc.):
```bash
npm run build
npm run start
```

### Blockchain Deployment
Deploy smart contracts to Monad Testnet:
```bash
cd blockchain
npm run deploy --network monadTestnet
```

## Contributing

### Code Standards
- Use **TypeScript** for type safety
- Follow **ESLint** configurations
- Write **meaningful commit messages**
- Create feature branches: `feature/feature-name`
- Ensure tests pass before PR submission

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting: `npm run lint`
5. Submit PR with detailed description

## Documentation

- **[architecture.md](architecture.md)** - Detailed system architecture and design patterns
- **[BUGS.md](BUGS.md)** - Known issues, troubleshooting, and required fixes
- **[ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)** - Visual system diagrams and flowcharts

## Support & Community

For issues, feature requests, or technical questions:
- 📧 **Email**: contact@selorahhealth.com
- 🐦 **Twitter**: [@selorahealth](https://x.com/selorahealth)
- 💼 **LinkedIn**: [Selorah Health](https://www.linkedin.com/company/selorahealth/)
- 📱 **WhatsApp**: +1-XXX-XXX-XXXX

## License

This project is licensed under the MIT License. See LICENSE file for details.

---
<div align="center">
  <i>Built with ❤️ by Selorah Health Limited</i><br/>
  <i>Empowering patients to own their health story</i>
</div>
