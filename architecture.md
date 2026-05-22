# Selorah Health - System Architecture

**Document Version**: 1.0.0  
**Last Updated**: May 2026  
**Audience**: Senior Engineers, Architects, DevOps Engineers

---

## Table of Contents

1. [High-Level System Design](#high-level-system-design)
2. [Site Map](#site-map)
3. [Primary Concerns to Address Now](#primary-concerns-to-address-now)
4. [Detailed Component Architecture](#detailed-component-architecture)
5. [Data Architecture](#data-architecture)
6. [Security Architecture](#security-architecture)
7. [Deployment Architecture](#deployment-architecture)
8. [Scaling & Performance](#scaling--performance)
9. [Disaster Recovery & Backup](#disaster-recovery--backup)
10. [Monitoring & Observability](#monitoring--observability)

---

## High-Level System Design

### System Context Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        SELORAH HEALTH ECOSYSTEM                │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐        ┌──────────────────┐              │
│  │   Patient       │        │   Provider/      │              │
│  │   Mobile Web    │        │   Insurer/       │              │
│  │   Browser       │        │   Researcher     │              │
│  │   (React SPA)   │        │   Portal         │              │
│  │                │        │                  │              │
│  └────────┬────────┘        └────────┬─────────┘              │
│           │                         │                         │
│           └─────────────┬───────────┘                         │
│                         │                                      │
│                    INTERNET / CDN                             │
│                         │                                      │
│                         ▼                                      │
│            ┌────────────────────────────┐                     │
│            │  API GATEWAY / LOAD       │                     │
│            │  BALANCER                 │                     │
│            └────────────┬───────────────┘                     │
│                         │                                      │
│                         ▼                                      │
│      ┌──────────────────────────────────────────┐             │
│      │    EXPRESS BACKEND (Node.js / TypeScript)│             │
│      │  ┌──────────────────────────────────┐   │             │
│      │  │ • Authentication & Onboarding   │   │             │
│      │  │ • Medical Records Management    │   │             │
│      │  │ • Access Control & Audit Logs  │   │             │
│      │  │ • Real-time WebSocket (Socket.io)   │             │
│      │  └──────────────────────────────────┘   │             │
│      └──────────────┬──────────────────────────┘             │
│                     │                                         │
│          ┌──────────┼──────────┐                            │
│          │          │          │                            │
│          ▼          ▼          ▼                            │
│  ┌──────────────┐┌──────────────┐┌──────────────────┐       │
│  │  Supabase   ││ Supabase     ││  Monad Smart    │       │
│  │  PostgreSQL ││ Real-time    ││  Contracts      │       │
│  │  Database   ││ Listeners    ││  (Blockchain)   │       │
│  │             ││              ││                 │       │
│  │ • Profiles  ││ • Change     ││ • Access       │       │
│  │ • Records   ││   Listeners  ││   Control       │       │
│  │ • Access    ││ • Sync with  ││ • Token        │       │
│  │   Logs      ││   Frontend   ││   Verification │       │
│  └──────────────┘└──────────────┘└──────────────────┘       │
│                                                               │
└────────────────────────────────────────────────────────────────┘
```

### Core Architecture Principles

1. **Separation of Concerns**: Frontend, Backend, and Blockchain are independently deployable
2. **Real-time Synchronization**: WebSocket-based updates via Supabase Realtime
3. **Blockchain Verification**: Smart contracts enforce time-bound access control
4. **Row-Level Security**: Database policies prevent unauthorized data access
5. **Role-Based Access Control (RBAC)**: Six distinct user roles with tailored permissions

## Site Map

### Product Sitemap

```mermaid
flowchart TD
   A[Selorah Health] --> B[Public Experience]
   A --> C[Authenticated Patient Portal]
   A --> D[Provider Portal]
   A --> E[Researcher Portal]
   A --> F[Insurer Portal]
   A --> G[System / Legal Pages]

   B --> B1[Landing Page]
   B --> B2[Pricing]
   B --> B3[About]
   B --> B4[Careers]
   B --> B5[Login]
   B --> B6[Signup]
   B --> B7[Onboarding]
   B --> B8[Shared Record View]

   C --> C1[Dashboard Home]
   C --> C2[Medical Records]
   C --> C3[Record Details]
   C --> C4[Research]
   C --> C5[Earnings]
   C --> C6[Profile]
   C --> C7[Notifications]
   C --> C8[Access Log]
   C --> C9[Access Log Details]
   C --> C10[QR Codes]
   C --> C11[Security]
   C --> C12[Billing]
   C --> C13[Family]

   D --> D1[Hospital Dashboard]
   D --> D2[Admissions]
   D --> D3[Reports]
   D --> D4[Settings]

   E --> E1[Researcher Dashboard]
   E --> E2[Studies / Cohorts]
   E --> E3[Participant Access]
   E --> E4[Checkout / Funding]
   E --> E5[Settings]

   F --> F1[Insurer Dashboard]
   F --> F2[Policyholders]
   F --> F3[Claims]
   F --> F4[Analytics]
   F --> F5[Settings]

   G --> G1[Terms]
   G --> G2[Privacy]
   G --> G3[Cookie Policy]
   G --> G4[Data Processing Agreement]
   G --> G5[Not Found]
```

### Primary Concerns to Address Now

If the goal is responsiveness and fewer user-facing failures, the first problems to fix are:

1. **Mobile layout debt**: the current experience leans hard on full-height desktop shells, sidebars, and wide content blocks. That will break down fast on smaller screens unless every major route gets a mobile-first review.
2. **Hero and media weight**: the landing page uses background video, large imagery, and multiple visual layers. Without aggressive fallbacks and size controls, the first paint will be slow on low-bandwidth devices.
3. **Dashboard routing complexity**: the patient portal and provider portals both rely on nested routes and dense navigation. That needs a cleaner responsive navigation pattern before the UI becomes unmanageable.
4. **Inconsistent loading states**: lazy routes exist, but the app still needs more explicit skeletons and transition states so users do not feel jank when changing pages or fetching records.
5. **Data-heavy screens**: records, access logs, QR flows, and portal views will degrade on mobile if tables, cards, and filters are not collapsed intentionally.
6. **Performance budget**: too many icons, videos, large assets, and client-side renders can hurt responsiveness before the backend is even the bottleneck.

The short version: ship a mobile-first navigation model, reduce initial asset cost, and standardize loading/fallback behavior before adding more features.

---

## Detailed Component Architecture

### Frontend Architecture (React + Vite + Tailwind)

```
┌─────────────────────────────────────────────┐
│         FRONTEND APPLICATION                │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │        React SPA (Vite)             │   │
│  │  ├─ App.tsx (Main Component)        │   │
│  │  ├─ main.tsx (Vite Entry)           │   │
│  │  └─ index.css (Global Styles)       │   │
│  └──────────────┬──────────────────────┘   │
│                 │                          │
│  ┌──────────────▼──────────────────────┐   │
│  │      React Router DOM                │   │
│  │  ├─ Client-side Routing              │   │
│  │  ├─ Lazy Code Splitting              │   │
│  │  └─ Protected Routes                 │   │
│  └──────────────┬──────────────────────┘   │
│                 │                          │
│  ┌──────────────▼──────────────────────┐   │
│  │      Page Components                 │   │
│  │  ├─ LandingPage.tsx                  │   │
│  │  ├─ Signup.tsx / Login.tsx           │   │
│  │  ├─ Dashboard.tsx                    │   │
│  │  ├─ Medical Records Portal           │   │
│  │  ├─ hospital/HospitalDashboard       │   │
│  │  ├─ insurer/InsurerDashboard         │   │
│  │  └─ researcher/ResearcherDashboard   │   │
│  └──────────────┬──────────────────────┘   │
│                 │                          │
│  ┌──────────────▼──────────────────────┐   │
│  │    Reusable Components               │   │
│  │  ├─ Header.tsx                       │   │
│  │  ├─ Footer.tsx                       │   │
│  │  ├─ Sidebar.tsx                      │   │
│  │  ├─ Dashboard Components             │   │
│  │  │  ├─ Home.tsx                      │   │
│  │  │  ├─ Records.tsx                   │   │
│  │  │  ├─ Profile.tsx                   │   │
│  │  │  └─ ProFeaturesModal.tsx          │   │
│  │  ├─ Modal Components                 │   │
│  │  │  ├─ NewPatientModal.tsx           │   │
│  │  │  ├─ NewStudyModal.tsx             │   │
│  │  │  └─ WaitlistModal.tsx             │   │
│  │  └─ Utility Components               │   │
│  │     ├─ ErrorBoundary.tsx             │   │
│  │     ├─ SEOTitle.tsx                  │   │
│  │     └─ LanguageSelector.tsx          │   │
│  └──────────────┬──────────────────────┘   │
│                 │                          │
│  ┌──────────────▼──────────────────────┐   │
│  │      React Context                   │   │
│  │  └─ LanguageContext.tsx              │   │
│  │     (Global Language State)          │   │
│  └──────────────┬──────────────────────┘   │
│                 │                          │
│  ┌──────────────▼──────────────────────┐   │
│  │     Library & Utilities              │   │
│  │  ├─ Supabase Clients                 │   │
│  │  │  ├─ client.ts (Anon)              │   │
│  │  │  └─ server.ts (Service Role)      │   │
│  │  ├─ Utils                            │   │
│  │  │  └─ currency.ts                   │   │
│  │  ├─ Recharts (Data Viz)              │   │
│  │  ├─ QRCode.react (QR Gen)            │   │
│  │  └─ Heroicons (Icon Library)         │   │
│  └──────────────┬──────────────────────┘   │
│                 │                          │
│  ┌──────────────▼──────────────────────┐   │
│  │      Styling Stack                   │   │
│  │  ├─ Tailwind CSS v4                  │   │
│  │  ├─ PostCSS                          │   │
│  │  └─ Off-white + Sora Typography      │   │
│  └──────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Key Technologies**:
- **React 19.2.4**: UI framework with concurrent features
- **Vite 8.0.10**: Fast build tool with native ES modules
- **TypeScript 5**: Type-safe component development
- **Tailwind CSS 4**: Utility-first CSS framework
- **React Router DOM 6.24.0**: Client-side routing
- **Supabase SSR 0.7.0**: Server-side session management
- **Recharts 3.8.1**: React chart library
- **QRCode.react 4.2.0**: Client-side QR code generation

**Component Organization**:
- **Pages**: Full-page routes for different roles
- **Components/Dashboard**: Reusable dashboard widgets
- **Contexts**: Global state management (language, auth)
- **Lib**: Supabase initialization and utilities

---

### Backend Architecture (Node.js + Express)

```
┌─────────────────────────────────────────────────────────────────┐
│         BACKEND APPLICATION (Node.js + Express)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │        HTTP Server (Express)                           │     │
│  │  ├─ Port: 5000 (configurable via env)                 │     │
│  │  ├─ Middleware Stack                                   │     │
│  │  │  ├─ express.json() - JSON parsing                  │     │
│  │  │  ├─ CORS - Cross-origin requests                   │     │
│  │  │  └─ Error handlers                                 │     │
│  │  └─ Health check endpoint (/health)                   │     │
│  └────────────────┬─────────────────────────────────────┘     │
│                   │                                             │
│  ┌────────────────▼─────────────────────────────────────┐     │
│  │        API Routes (/routes)                          │     │
│  │  └─ auth.ts                                          │     │
│  │     ├─ POST /api/auth/onboarding                     │     │
│  │     │   └─ Handles role-specific user setup          │     │
│  │     ├─ POST /api/auth/signup                         │     │
│  │     │   └─ Creates new user account                  │     │
│  │     ├─ POST /api/auth/signin                         │     │
│  │     │   └─ Authenticates user                        │     │
│  │     ├─ GET /api/auth/profile                         │     │
│  │     │   └─ Retrieves user profile data               │     │
│  │     ├─ PUT /api/auth/profile                         │     │
│  │     │   └─ Updates user profile                      │     │
│  │     └─ POST /api/auth/generate-qr                    │     │
│  │         └─ Generates time-bound QR codes             │     │
│  └────────────────┬─────────────────────────────────────┘     │
│                   │                                             │
│  ┌────────────────▼─────────────────────────────────────┐     │
│  │        WebSocket Layer (Socket.io)                   │     │
│  │  ├─ Real-time bidirectional communication            │     │
│  │  ├─ Supabase Realtime listeners                      │     │
│  │  │  ├─ Listen for DB changes                         │     │
│  │  │  ├─ Emit to connected clients                     │     │
│  │  │  └─ Ensure instant sync                           │     │
│  │  └─ Events                                            │     │
│  │     ├─ 'connection' / 'disconnect'                   │     │
│  │     ├─ 'profile:update'                              │     │
│  │     ├─ 'record:created'                              │     │
│  │     ├─ 'record:shared'                               │     │
│  │     └─ 'access:revoked'                              │     │
│  └────────────────┬─────────────────────────────────────┘     │
│                   │                                             │
│  ┌────────────────▼─────────────────────────────────────┐     │
│  │        Services Layer (/services)                    │     │
│  │  ├─ authService.ts                                   │     │
│  │  │  ├─ generateUID()                                 │     │
│  │  │  │  └─ Creates unique identifiers from PII        │     │
│  │  │  ├─ signUp()                                      │     │
│  │  │  │  └─ Supabase auth.signUp() wrapper             │     │
│  │  │  ├─ signIn()                                      │     │
│  │  │  │  └─ Supabase auth.signInWithPassword()         │     │
│  │  │  └─ validateRole()                                │     │
│  │  │     └─ Enforces role-specific rules               │     │
│  │  │                                                    │     │
│  │  └─ supabaseClient.ts                                │     │
│  │     ├─ Exports singleton Supabase client             │     │
│  │     ├─ Service role key (backend admin access)       │     │
│  │     └─ Handles auth/DB operations                    │     │
│  └────────────────┬─────────────────────────────────────┘     │
│                   │                                             │
│  ┌────────────────▼─────────────────────────────────────┐     │
│  │        Environment & Config                          │     │
│  │  ├─ .env file                                        │     │
│  │  │  ├─ PORT                                          │     │
│  │  │  ├─ NODE_ENV                                      │     │
│  │  │  ├─ SUPABASE_URL                                  │     │
│  │  │  ├─ SUPABASE_SERVICE_ROLE_KEY                     │     │
│  │  │  └─ SUPABASE_ANON_KEY                             │     │
│  │  └─ dotenv configuration                             │     │
│  │     └─ Loaded on server startup                      │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Key Technologies**:
- **Express 4.22.1**: Minimal web framework
- **TypeScript 5.4.5**: Typed JavaScript
- **Node.js 20+**: JavaScript runtime
- **Socket.io 4.7.5**: Real-time communication
- **Supabase JS 2.42.0**: Database & auth client
- **CORS 2.8.5**: Cross-origin headers
- **ts-node 10.9.2**: TypeScript execution
- **Nodemon 3.1.14**: Development auto-reload

**Request Flow**:
1. Client sends request to Express endpoint
2. Middleware processes (CORS, JSON)
3. Route handler delegates to service
4. Service performs business logic
5. Supabase client interacts with database
6. Response returned to client
7. If data changes, Socket.io broadcasts updates

---

### Blockchain Architecture (Hardhat + Solidity)

```
┌─────────────────────────────────────────────────────────────────┐
│      BLOCKCHAIN LAYER (Hardhat + Solidity)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │        Monad Testnet Network                           │     │
│  │  ├─ Chain ID: 10143                                    │     │
│  │  ├─ RPC: https://testnet-rpc.monad.xyz                │     │
│  │  ├─ EVM-compatible                                     │     │
│  │  └─ High throughput, low latency                       │     │
│  └────────────────┬─────────────────────────────────────┘     │
│                   │                                             │
│  ┌────────────────▼─────────────────────────────────────┐     │
│  │        Smart Contracts                               │     │
│  │  ├─ SelorahAccessControl.sol                          │     │
│  │  │  ├─ Manages access permissions                     │     │
│  │  │  ├─ Enforces time-bound token expiration           │     │
│  │  │  ├─ Tracks revoked accesses                        │     │
│  │  │  ├─ Functions:                                      │     │
│  │  │  │  ├─ grantAccess(address, tokenId, expiry)       │     │
│  │  │  │  ├─ revokeAccess(address, tokenId)              │     │
│  │  │  │  ├─ verifyAccess(address, tokenId) → bool       │     │
│  │  │  │  └─ isTokenExpired(tokenId) → bool              │     │
│  │  │  └─ Events:                                         │     │
│  │  │     ├─ AccessGranted                               │     │
│  │  │     ├─ AccessRevoked                               │     │
│  │  │     └─ AccessExpired                               │     │
│  │  │                                                    │     │
│  │  └─ SelorahIdentity.sol                               │     │
│  │     ├─ Identity verification                          │     │
│  │     ├─ Role-based access control                      │     │
│  │     ├─ Stores onchain proof of identity               │     │
│  │     ├─ Functions:                                      │     │
│  │     │  ├─ registerIdentity(role, uid)                 │     │
│  │     │  ├─ verifyIdentity(address) → (role, uid)       │     │
│  │     │  └─ updateRole(address, newRole)                │     │
│  │     └─ Events:                                         │     │
│  │        └─ IdentityRegistered / IdentityUpdated        │     │
│  └────────────────┬─────────────────────────────────────┘     │
│                   │                                             │
│  ┌────────────────▼─────────────────────────────────────┐     │
│  │        Hardhat Configuration                         │     │
│  │  ├─ hardhat.config.ts                                 │     │
│  │  │  ├─ Solidity version: 0.8.24                       │     │
│  │  │  ├─ Network config (Monad Testnet)                 │     │
│  │  │  ├─ Private key from .env                          │     │
│  │  │  └─ Chain ID: 10143                                │     │
│  │  ├─ Scripts                                            │     │
│  │  │  └─ deploy.ts                                      │     │
│  │  │     ├─ Deploys contracts sequentially              │     │
│  │  │     ├─ Stores deployment addresses                 │     │
│  │  │     └─ Output: addresses.json                      │     │
│  │  └─ Tests (Jest/Hardhat)                              │     │
│  │     └─ Unit tests for contract functionality          │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Key Technologies**:
- **Hardhat**: Development framework for Solidity
- **Solidity 0.8.24**: Smart contract language
- **Monad Testnet**: EVM-compatible blockchain network
- **OpenZeppelin Contracts**: Audited contract libraries

**Smart Contract Features**:
1. **Time-locked Access**: QR codes encode expiration times
2. **Role Verification**: Ensures only authorized users can access data
3. **Audit Trail**: Events logged on-chain for immutable proof
4. **Revocation Support**: Instant access revocation via contract function

---

## Data Architecture

### Database Schema (Supabase PostgreSQL)

```
┌──────────────────────────────────────────────────────────────┐
│           SUPABASE / POSTGRESQL DATABASE                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  auth.users (Supabase Built-in)                             │
│  ├─ id (UUID) - Primary key                                 │
│  ├─ email (VARCHAR) - Contact email                         │
│  ├─ encrypted_password (TEXT)                               │
│  ├─ phone (VARCHAR) - WhatsApp login                         │
│  ├─ last_sign_in_at (TIMESTAMP)                             │
│  └─ created_at (TIMESTAMP)                                  │
│                                                               │
│  profiles (Custom Table)                                     │
│  ├─ id (UUID) - FK to auth.users                            │
│  ├─ role (TEXT) - patient|provider|researcher|insurer|...   │
│  ├─ first_name (VARCHAR)                                     │
│  ├─ last_name (VARCHAR)                                      │
│  ├─ phone_number (VARCHAR UNIQUE)                            │
│  ├─ date_of_birth (DATE)                                     │
│  ├─ gender (VARCHAR)                                         │
│  ├─ is_pro (BOOLEAN) - Premium status                        │
│  ├─ uid (VARCHAR UNIQUE) - Generated unique identifier       │
│  │                                                            │
│  │  Patient-Specific Fields:                                 │
│  │  ├─ vitals (JSONB)                                        │
│  │  │  └─ {height, weight, blood_type, ...}                 │
│  │  ├─ allergies (JSONB)                                     │
│  │  │  └─ [{name, severity, reaction}, ...]                 │
│  │  ├─ emergency_medical_info (TEXT)                         │
│  │  └─ emergency_contacts (JSONB)                            │
│  │     └─ [{name, phone, relation}, ...] (max 3-5)          │
│  │                                                            │
│  │  Enterprise-Specific Fields:                              │
│  │  ├─ organization_name (VARCHAR)                           │
│  │  ├─ license_number (VARCHAR)                              │
│  │  ├─ tax_id (VARCHAR)                                      │
│  │  ├─ official_email (VARCHAR)                              │
│  │  └─ kyc_status (TEXT) - pending|verified|rejected         │
│  │                                                            │
│  ├─ onboarding_completed (BOOLEAN)                           │
│  ├─ created_at (TIMESTAMP)                                   │
│  └─ updated_at (TIMESTAMP)                                   │
│                                                               │
│  medical_records                                             │
│  ├─ id (UUID) - Primary key                                 │
│  ├─ user_id (UUID) - FK to profiles                          │
│  ├─ name (VARCHAR) - Record title                            │
│  ├─ record_type (VARCHAR) - Lab Result|Vaccination|Rx|...    │
│  ├─ date (DATE) - Record date                                │
│  ├─ status (VARCHAR) - Private|Shared Once|Shared            │
│  ├─ document_url (TEXT) - Cloud storage URL                  │
│  ├─ metadata (JSONB)                                         │
│  │  └─ {provider, facility, notes, ...}                      │
│  ├─ created_at (TIMESTAMP)                                   │
│  └─ updated_at (TIMESTAMP)                                   │
│                                                               │
│  access_logs                                                 │
│  ├─ id (UUID) - Primary key                                 │
│  ├─ record_id (UUID) - FK to medical_records                 │
│  ├─ accessed_by (UUID) - FK to profiles                      │
│  ├─ access_type (VARCHAR) - view|download|share              │
│  ├─ ip_address (INET)                                        │
│  ├─ user_agent (TEXT)                                        │
│  ├─ timestamp (TIMESTAMP)                                    │
│  └─ metadata (JSONB)                                         │
│     └─ {device, location, duration, ...}                     │
│                                                               │
│  qr_codes                                                    │
│  ├─ id (UUID) - Primary key                                 │
│  ├─ record_id (UUID) - FK to medical_records                 │
│  ├─ generated_by (UUID) - FK to profiles                     │
│  ├─ token (VARCHAR UNIQUE) - Encoded access token            │
│  ├─ expires_at (TIMESTAMP) - Expiration time                 │
│  ├─ max_accesses (INTEGER) - Limit on uses                   │
│  ├─ current_accesses (INTEGER) - Current use count           │
│  ├─ revoked (BOOLEAN)                                        │
│  ├─ created_at (TIMESTAMP)                                   │
│  └─ accessed_by (JSONB ARRAY) - List of accessors           │
│                                                               │
│  research_studies (Optional)                                 │
│  ├─ id (UUID)                                               │
│  ├─ researcher_id (UUID) - FK to profiles                    │
│  ├─ title (VARCHAR)                                          │
│  ├─ description (TEXT)                                       │
│  ├─ required_record_types (TEXT ARRAY)                       │
│  ├─ participant_count (INTEGER)                              │
│  ├─ start_date (DATE) / end_date (DATE)                      │
│  └─ status (VARCHAR) - active|completed|archived             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Row-Level Security (RLS) Policies

```sql
-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Medical Records: Users can only see their own records
CREATE POLICY "Patients can view own records" ON medical_records
    FOR SELECT USING (auth.uid() = user_id);

-- Access Logs: Audit trail (read-only, system appends)
CREATE POLICY "Users can view logs of their own records" ON access_logs
    FOR SELECT USING (
        record_id IN (
            SELECT id FROM medical_records 
            WHERE user_id = auth.uid()
        )
    );

-- QR Codes: Only creator can revoke/modify
CREATE POLICY "Only creator can modify QR codes" ON qr_codes
    FOR UPDATE USING (auth.uid() = generated_by);
```

---

## Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────────┐
│    CLIENT                                    │
│  (React App)                                │
└────────────────┬────────────────────────────┘
                 │
                 ├─ Signup with Email/Phone
                 │
                 ▼
┌─────────────────────────────────────────────┐
│    SUPABASE AUTH                            │
│  (Handles token issuance)                   │
│  - Session tokens (JWT)                     │
│  - Refresh tokens (long-lived)              │
│  - Device tracking                          │
└────────────────┬────────────────────────────┘
                 │
                 ├─ Token stored in browser
                 │  (HttpOnly cookie or LocalStorage)
                 │
                 ▼
┌─────────────────────────────────────────────┐
│    API REQUESTS                             │
│  - Bearer token in Authorization header     │
│  - Token verified on backend                │
└────────────────┬────────────────────────────┘
                 │
                 ├─ Backend validates token
                 │  via Supabase client
                 │
                 ▼
┌─────────────────────────────────────────────┐
│    DATABASE QUERIES                         │
│  - RLS policies applied                     │
│  - Query scoped to authenticated user       │
│  - Row-level access control enforced        │
└─────────────────────────────────────────────┘
```

### Role-Based Access Control (RBAC)

| Role | Capabilities | Data Access | Can Share |
|------|---|---|---|
| **Patient** | Manage own records, view providers | Own records only | Yes, via QR codes |
| **Provider** | View patient records (if shared), add notes | Patient records (if access granted) | No direct access |
| **Researcher** | Access aggregated data, conduct studies | Study participant records (with consent) | Cannot share |
| **Insurer** | Link policies, review claims | Associated patient records | Limited |
| **Developer** | API access, integration testing | Sandbox data | N/A |
| **Partner** | Custom role per agreement | Configurable | Configurable |

### Encryption Strategy

1. **Data in Transit**:
   - HTTPS/TLS 1.3 for all API calls
   - WSS (WebSocket Secure) for real-time updates
   - Certificate pinning for high-security clients

2. **Data at Rest**:
   - Supabase encrypts columns via pgcrypto extension
   - Sensitive fields encrypted at application level
   - PII encrypted using AES-256-GCM

3. **Smart Contract Layer**:
   - Private keys stored in environment (.env not in git)
   - Wallet recovery phrases never transmitted
   - Access tokens verified cryptographically

### QR Code Security

```
QR Code Generation Flow:

1. User requests access grant for patient record
2. Backend generates:
   - unique_token = SHA256(record_id + timestamp + secret)
   - expiration = now() + TTL (e.g., 72 hours)
3. QR encodes: "https://app.selorah.io/share/{token}"
4. Token stored in DB with expiration
5. Recipient scans QR:
   - Token validated against DB
   - Check: not expired? not revoked? max uses reached?
   - If valid: return record data
   - Log access in access_logs table
6. Blockchain verification:
   - Smart contract confirms token legitimacy
   - Record timestamp prevents replay attacks
```

---

## Deployment Architecture

### Frontend Deployment (Vercel)

```
GitHub Repository
       │
       ├─ Push to main/production branch
       │
       ▼
Vercel CI/CD Pipeline
       │
       ├─ Run: npm run build
       ├─ TypeScript compilation check
       ├─ ESLint validation
       ├─ Build Vite bundle
       │
       ▼
Edge Network (Vercel CDN)
       │
       ├─ Distribute to 100+ global edge locations
       ├─ Automatic HTTPS/SSL
       ├─ DDoS protection
       ├─ Cache static assets (images, fonts, CSS)
       │
       ▼
End User Browser (< 100ms latency from edge)
```

**Environment Variables** (Frontend):
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### Backend Deployment (Node.js Server)

Deployment options (choose one):

**Option 1: Heroku (Simple)**
```bash
git push heroku main
# Auto-builds and deploys
```

**Option 2: Railway / Render (Modern)**
```
GitHub ─> Webhook ─> Auto Deploy
                     ├─ Detect package.json
                     ├─ npm install
                     ├─ npm run build
                     └─ npm start
```

**Option 3: AWS EC2 (Manual)**
```bash
# On server:
git clone repo
npm install
npm run build
NODE_ENV=production npm start
# Use PM2 or systemd for process management
```

**Environment Variables** (Backend):
```env
PORT=5000
NODE_ENV=production
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
SUPABASE_ANON_KEY=eyJhbGciOi...
LOG_LEVEL=info
```

### Blockchain Deployment (Smart Contracts)

```bash
# 1. Compile contracts
npx hardhat compile

# 2. Deploy to Monad Testnet
npx hardhat run scripts/deploy.ts --network monadTestnet

# 3. Verify on block explorer
# https://testnet.monadexplorer.com/

# 4. Store deployment addresses
# Save to: blockchain/deployments/addresses.json
```

---

## Scaling & Performance

### Frontend Performance Optimization

1. **Code Splitting**: React Router lazy loading pages
   ```typescript
   const Dashboard = lazy(() => import('./pages/Dashboard'));
   ```

2. **Asset Optimization**:
   - Images: WebP format with fallbacks
   - Fonts: Sora (system font preferred)
   - Icons: SVG via Heroicons
   - Chunking: Vite automatic chunk splitting

3. **Caching Strategy**:
   - Vercel Edge Caching (static assets)
   - Browser cache headers (SWR - Stale While Revalidate)
   - Service Worker for offline fallback

4. **Metrics**:
   - Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
   - Monitor via Vercel Analytics

### Backend Performance Optimization

1. **Connection Pooling**:
   ```typescript
   // Supabase handles pooling internally
   // But we can increase pool size in prod
   ```

2. **Caching Layers**:
   - In-memory cache for frequently accessed profiles
   - Redis optional for session management
   - Supabase query caching

3. **Rate Limiting**:
   ```typescript
   // Middleware to limit requests per IP
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   app.use('/api/', limiter);
   ```

4. **Load Balancing**:
   - Horizontal scaling: Spawn multiple Node processes
   - Use PM2 cluster mode
   - Nginx reverse proxy for load distribution

### Database Optimization

1. **Indexes on Frequently Queried Columns**:
   ```sql
   CREATE INDEX idx_profiles_user_id ON profiles(user_id);
   CREATE INDEX idx_medical_records_user_id ON medical_records(user_id);
   CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp);
   ```

2. **Query Optimization**:
   - Use pagination for large result sets
   - Denormalize where appropriate (e.g., user role in records)
   - Avoid N+1 queries

3. **Vacuum & Analyze**:
   ```sql
   VACUUM ANALYZE profiles;
   VACUUM ANALYZE medical_records;
   ```

### Blockchain Scaling

1. **Monad Optimizations**:
   - Parallel execution for non-dependent transactions
   - Minimal on-chain calls (batch operations)

2. **Storage Optimization**:
   - Store only essential data on-chain (hash of record)
   - Detailed data remains in centralized DB

---

## Disaster Recovery & Backup

### Backup Strategy

1. **Database Backups**:
   - **Supabase Automatic**: Daily backups retained 7-30 days
   - **Manual**: Export via `pg_dump` to AWS S3 weekly
   - **Replication**: Read replica in secondary region

   ```bash
   # Manual backup:
   pg_dump "postgresql://user:pass@db.supabase.co/postgres" > backup.sql
   
   # Restore:
   psql "postgresql://user:pass@db.supabase.co/postgres" < backup.sql
   ```

2. **Code Backups**:
   - GitHub as primary source of truth
   - Automated deployments from GitHub

3. **Smart Contract Backups**:
   - Source code in GitHub
   - Deployment addresses stored in `deployments/addresses.json`

### Recovery Procedures

**Database Recovery**:
```bash
1. Supabase admin downloads latest backup
2. Spin up new database instance
3. Restore from backup
4. Update connection strings in .env
5. Restart backend services
6. Verify data integrity
```

**Smart Contract Recovery**:
```bash
1. Code immutable on-chain; re-deploy new contract
2. Update contract address in backend config
3. Migrate data using migration contracts
4. Test on testnet first
```

---

## Monitoring & Observability

### Logging Strategy

1. **Frontend Logging**:
   - Browser console for development
   - Error tracking via Sentry optional
   - User session tracking

2. **Backend Logging**:
   ```typescript
   import { Logger } from 'winston'; // Optional
   
   app.use((req, res, next) => {
     console.log(`${req.method} ${req.path} - ${res.statusCode}`);
     next();
   });
   ```

   **Log Levels**:
   - `error`: Critical failures
   - `warn`: Unexpected but recoverable
   - `info`: Normal operations
   - `debug`: Development debugging

3. **Database Logging**:
   - Supabase logs all queries (enable in dashboard)
   - Slow query logs (queries > 1s)

### Metrics & Monitoring

1. **Frontend Metrics**:
   - Page load time
   - Time to interactive (TTI)
   - JavaScript error rate
   - API latency distribution

2. **Backend Metrics**:
   - Request latency (p50, p95, p99)
   - Error rate by endpoint
   - Database query time
   - WebSocket connection count
   - Memory usage
   - CPU usage

   **Tools**: Datadog, New Relic, or Prometheus + Grafana

3. **Blockchain Metrics**:
   - Transaction confirmation time
   - Gas usage per contract call
   - Contract state consistency

### Alerting

**Critical Alerts**:
- Backend service down (health check failed)
- Database connection lost
- Error rate > 5%
- API latency p95 > 2s
- Low disk space on server

---

## API Reference (High-Level)

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|---|
| POST | `/api/auth/signup` | Create new user account |
| POST | `/api/auth/signin` | Authenticate user |
| GET | `/api/auth/profile` | Get current user profile |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/onboarding` | Complete role-specific onboarding |
| POST | `/api/auth/generate-qr` | Generate time-bound QR code |
| POST | `/api/auth/logout` | Sign out user |

### Medical Records Endpoints

| Method | Endpoint | Description |
|--------|----------|---|
| GET | `/api/records` | List user's records |
| GET | `/api/records/{id}` | Get specific record |
| POST | `/api/records` | Upload new record |
| PUT | `/api/records/{id}` | Update record |
| DELETE | `/api/records/{id}` | Delete record |
| POST | `/api/records/{id}/share` | Generate share token |
| GET | `/api/records/{id}/access-logs` | View access history |

### Real-time Events (Socket.io)

| Event | Direction | Payload |
|-------|-----------|---|
| `record:created` | Server → Client | `{recordId, type, date}` |
| `record:updated` | Server → Client | `{recordId, updates}` |
| `access:granted` | Server → Client | `{recordId, accessorEmail}` |
| `access:revoked` | Server → Client | `{recordId, accessorEmail}` |

---

## Conclusion

This architecture supports:
- ✅ Horizontal scaling (multiple backend instances)
- ✅ Global distribution (Vercel edge network)
- ✅ Real-time synchronization (WebSocket)
- ✅ Enterprise security (Blockchain verification)
- ✅ Disaster recovery (Automated backups)
- ✅ High availability (Redundancy, monitoring)

For questions or clarifications, refer to the main [README.md](README.md) or contact the development team.
