# INTEX - Winter 2026 - Group 2-7

## What This Project Does

This repository contains a full-stack platform for Hope Shelter operations and donor engagement.  
It supports:

- shelter/admin workflows (caseload, process recording, home visitation, reports, and case conference support)
- donor-facing and public donation experiences
- role-based authentication/authorization for admin and donor users
- ML-assisted insights (social media inference and donor/resident risk snapshots)

Live frontend: [https://hopeshelter.alijahwhitney.dev](https://hopeshelter.alijahwhitney.dev)

## Tech Stack

- Frontend: React + TypeScript (Vite, Tailwind, TanStack Query, Vitest)
- Backend: C# / .NET (`net10.0`, ASP.NET Core, EF Core, Identity)
- Data: Azure SQL (operational + identity databases)
- ML Runtime: Python (Azure Functions + containerized training job)
- Infrastructure/Deployment: Azure + GitHub Actions

## Project Layout

- `frontend/intex-w2026-group-2-7`: React/TypeScript SPA
- `backend/INTEX_W2026_Group_2-7`: .NET solution (API + tests)
- `infra`: Azure Bicep and SQL setup scripts
- `infra/sql`: SQL view scripts used by ML pipelines
- `ml-pipelines`: notebooks, runtime, and training data files
- `docs/auth`: authentication/authorization implementation docs

## Run Locally

### Prerequisites

- Node.js 18+ and npm
- .NET SDK 10
- SQL Server or Azure SQL access for both app databases
- `dotnet-ef` tool (for migrations):

```bash
dotnet tool install --global dotnet-ef
```

### 1) Configure Backend Secrets

From `backend/INTEX_W2026_Group_2-7/INTEX_W2026_Group_2-7`:

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "YOUR_OPERATIONAL_DB_CONNECTION_STRING"
dotnet user-secrets set "ConnectionStrings:IdentityConnection" "YOUR_IDENTITY_DB_CONNECTION_STRING"
dotnet user-secrets set "Frontend:BaseUrl" "http://localhost:8080"
```

Optional bootstrap admin (creates/promotes an admin on startup):

```bash
dotnet user-secrets set "AuthBootstrap:AdminEmail" "admin@example.com"
dotnet user-secrets set "AuthBootstrap:AdminPassword" "AdminPassword123!"
```

Optional Google auth:

```bash
dotnet user-secrets set "Authentication:Google:ClientId" "YOUR_CLIENT_ID"
dotnet user-secrets set "Authentication:Google:ClientSecret" "YOUR_CLIENT_SECRET"
```

### 2) Apply Database Migrations

From `backend/INTEX_W2026_Group_2-7/INTEX_W2026_Group_2-7`:

```bash
dotnet ef database update --context OperationalDbContext
dotnet ef database update --context IdentityAppDbContext
```

### 3) Start the Backend API

From `backend/INTEX_W2026_Group_2-7/INTEX_W2026_Group_2-7`:

```bash
dotnet run
```

Default local URLs:

- `https://localhost:7229`
- `http://localhost:5112`

### 4) Start the Frontend

From `frontend/intex-w2026-group-2-7`:

```bash
npm install
npm run dev
```

Vite dev server runs on `http://localhost:8080`.

If needed, set `VITE_API_BASE_URL` in a local `.env.local` file in `frontend/intex-w2026-group-2-7`.

## Common Commands

### Frontend

From `frontend/intex-w2026-group-2-7`:

```bash
npm run dev
npm run build
npm run test
npm run lint
```

### Backend

From `backend/INTEX_W2026_Group_2-7`:

```bash
dotnet restore INTEX_W2026_Group_2-7.sln
dotnet build INTEX_W2026_Group_2-7.sln
dotnet test INTEX_W2026_Group_2-7.sln
```

## ML Runtime + SQL Views

ML runtime code is in `ml-pipelines/runtime`.  
The SQL views required for training are managed in:

- `infra/sql/create-ml-training-views.sql`
- `infra/sql/create-reintegration-readiness-training-views.sql`

View contract and expected schema:

- `ml-pipelines/runtime/SQL_VIEW_CONTRACT.md`

## Deployment Notes

GitHub Actions workflows are configured for:

- backend build/test/deploy
- static frontend deployment
- ML runtime deployment

Most production deployment settings are controlled through GitHub Secrets/Variables and Azure resources.

## Auth Documentation

- [Authorization playbook](docs/auth/authorization-playbook.md)
- [React + Vite auth integration guide](docs/auth/react-vite-auth-integration.md)
