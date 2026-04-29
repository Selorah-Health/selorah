<div align="center">
  <img src="./frontend/public/logo.png" alt="Selorah Health Logo" width="150" />

  # Selorah Health

  **Your health story, everywhere you go.**

  [**View Live Application**](http://selorah.vercel.app/)

  [𝕏 (@selorahealth)](https://x.com/selorahealth) • [LinkedIn (Selorah Health)](https://www.linkedin.com/company/selorahealth/) • [GitHub](https://github.com/Selorah-Health)

  ---
</div>

## Overview
Selorah is a next-generation SaaS Electronic Medical Records (EMR) platform built on the Monad network. It bridges Web2 user experiences with Web3 security. Selorah empowers patients to legally own and encrypt their medical history while granting temporary, time-bound access to medical providers and researchers via secure QR codes.

## Architecture
This repository is architected as a **Turborepo** separating concerns into distinct environments:

- **/frontend** - A Next.js 14 App Router application tailored with Tailwind v4, utilizing a minimalist off-white aesthetic and the elegant Sora typography.
- **/backend** - A robust Node.js Express server configured with PostgreSQL/Supabase and Socket.io for managing real-time data flow, user schemas, Row Level Security (RLS) policies, and generating complex user identity mappings.
- **/blockchain** - Hardhat-based environment used for compiling and deploying access control smart contracts specifically tailored to the high-performance EVM-compatible Monad ecosystem.

## Features
- **Progressive Identity Verification**: Role-based progressive onboarding flows that intelligently distinguish between mild forms for patients and stricter validations for enterprise partners (providers, insurers, researchers).
- **Time-restricted QR Access**: Utilizing smart contracts to enforce verifiable expiration periods on data access logic, resolving unauthorized long-term data scraping.
- **Real-time Synchronicity**: Leveraging WebSocket architecture attached to Supabase payloads so that the moment records are updated at an administrative level, patient portals instantly reflect changes contextually.

> [!NOTE]
> Ensure you have your `PRIVATE_KEY` set within the `/blockchain/.env` file and acquired MON Testnet tokens via official faucets before running Hardhat scripts.

---
<div align="center">
  <i>Built with ❤️ by Selorah Health Limited </i>
</div>
