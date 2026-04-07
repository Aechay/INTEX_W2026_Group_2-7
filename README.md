# INTEX - Winter 2026 - Group 2-7

For now, this is a very basic scaffold of a full stack web app with a React frontend and a .NET 10 backend.

Changes on the main branch in the corresponding folder for each of the components will automatically deploy the changes to the azure resources. The frontend is hosted at [https://wintex.alijahwhitney.dev](https://wintex.alijahwhitney.dev).

## Local backend configuration

The backend now uses two SQL Server connection strings:

- `ConnectionStrings__DefaultConnection` for operational data
- `ConnectionStrings__IdentityConnection` for ASP.NET Core Identity data

Use `dotnet user-secrets` or environment variables instead of a tracked `.env` file. From the backend project directory:

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "YOUR_OPERATIONAL_DB_CONNECTION_STRING"
dotnet user-secrets set "ConnectionStrings:IdentityConnection" "YOUR_IDENTITY_DB_CONNECTION_STRING"
dotnet user-secrets set "AuthBootstrap:AdminEmail" "admin@example.com"
dotnet user-secrets set "AuthBootstrap:AdminPassword" "AdminPassword123!"
dotnet user-secrets set "Frontend:BaseUrl" "https://wintex.alijahwhitney.dev"
```

The bootstrap admin settings are optional, but if you provide them the app will create or promote that account into the `Admin` role on startup.

## Local migrations

The backend keeps EF Core migrations separate by context:

- Operational database migrations: `OperationalDbContext`
- Identity database migrations: `IdentityAppDbContext`

Apply them independently:

```bash
dotnet ef database update --context OperationalDbContext
dotnet ef database update --context IdentityAppDbContext
```

If you add schema changes later, generate migrations against the correct context:

```bash
dotnet ef migrations add YourOperationalMigration --context OperationalDbContext --output-dir Migrations/Operational
dotnet ef migrations add YourIdentityMigration --context IdentityAppDbContext --output-dir Migrations/Identity
```

# CI/CD

I set up 2 different github actions workflows. One to deploy the backend, and one to deploy the frontend. Each workflow is triggered when there is a commit to the main branch with changes in the corresponding folder.

The backend deploy workflow now applies migrations to both production databases before deployment:

- `PROD_DB_MIGRATION_CONNECTION_STRING` for the operational database
- `PROD_IDENTITY_DB_MIGRATION_CONNECTION_STRING` for the Identity database

Use the context-specific `dotnet ef migrations` commands as you make database changes so the GitHub Actions migration bundles stay aligned with production.

# Important links and things

The frontend is deployed on azure and has a custom domain on it. The azure domain for it is: [https://wonderful-ocean-0a5af5610.2.azurestaticapps.net](https://wonderful-ocean-0a5af5610.2.azurestaticapps.net) and the custom domain for it is: [https://wintex.alijahwhitney.dev](https://wintex.alijahwhitney.dev). The way it's set up, it will redirect any requests to the azure domain to the custom domain, so just plan around the domain being the `alijahwhitney.dev` one.

The backend is also deployed on azure and has the domain: [https://intex-w2026-group-2-7-h0fwdqczb3hvb2f9.centralus-01.azurewebsites.net](https://intex-w2026-group-2-7-h0fwdqczb3hvb2f9.centralus-01.azurewebsites.net)

# ML runtime

The ML deployment scaffold now lives under [`ml-pipelines/runtime`](/Users/alijahwhitney/Documents/Github/School/INTEX_W2026_Group_2-7/ml-pipelines/runtime). It contains:

- a reusable Python runtime for training and batch scoring
- a Python Azure Function entrypoint for live social-media inference
- a Dockerfile for the nightly Container Apps training job

The Azure infrastructure for these resources is defined in [`infra/ml-runtime.bicep`](/Users/alijahwhitney/Documents/Github/School/INTEX_W2026_Group_2-7/infra/ml-runtime.bicep), and the manual GitHub trigger for retraining is in [`.github/workflows/ml-retrain-manual.yml`](/Users/alijahwhitney/Documents/Github/School/INTEX_W2026_Group_2-7/.github/workflows/ml-retrain-manual.yml).

The ML runtime deployment workflow is in [`.github/workflows/ml-runtime-deploy.yml`](/Users/alijahwhitney/Documents/Github/School/INTEX_W2026_Group_2-7/.github/workflows/ml-runtime-deploy.yml). It deploys the Python Function App package, builds and pushes the nightly training image to ACR, and updates the Container Apps Job image to the latest commit SHA.

The backend exposes these admin ML routes:

- `POST /api/admin/ml/social-media/predict`
- `GET /api/admin/ml/donor-churn/current`
- `GET /api/admin/ml/resident-risk/current`

The React frontend now has a real bearer-token login flow and an admin dashboard that:

- calls `/auth/login?useCookies=false`
- calls `/auth/me` to determine the user and roles
- loads current donor/resident batch predictions
- runs live social-media predictions through the backend proxy

For local frontend development, copy [`frontend/intex-w2026-group-2-7/.env.example`](/Users/alijahwhitney/Documents/Github/School/INTEX_W2026_Group_2-7/frontend/intex-w2026-group-2-7/.env.example) into a local `.env.local` and set `VITE_API_BASE_URL` if you are not using the default local backend URL.

The operational schema now includes EF migrations for model runs and prediction snapshots/views. Those migrations are checked in only; they are **not** applied by anything in this branch unless you later run them yourself or merge to `main` and let the existing backend deployment workflow execute.

The SQL view contract that feeds nightly training lives in [`ml-pipelines/runtime/SQL_VIEW_CONTRACT.md`](/Users/alijahwhitney/Documents/Github/School/INTEX_W2026_Group_2-7/ml-pipelines/runtime/SQL_VIEW_CONTRACT.md). You still need to create those views in the operational database once you decide how the live tables map to the notebook feature sets.

## Operational dataset seed

The operational EF Core migration [`20260407211640_CreateOperationalDataset.cs`](/Users/alijahwhitney/Documents/Github/School/INTEX_W2026_Group_2-7/backend/INTEX_W2026_Group_2-7/INTEX_W2026_Group_2-7/Migrations/Operational/20260407211640_CreateOperationalDataset.cs) creates the case-management, fundraising, social media, and ML snapshot tables and then seeds them from the CSV files in [`ml-pipelines/lighthouse_csv_v7`](/Users/alijahwhitney/Documents/Github/School/INTEX_W2026_Group_2-7/ml-pipelines/lighthouse_csv_v7).

That means the migration bundle expects the CSV directory to exist in the repository checkout when migrations run in GitHub Actions. If those files are removed or renamed, the operational migration will fail.

# Auth docs

- [Authorization playbook](docs/auth/authorization-playbook.md)
- [React + Vite auth integration guide](docs/auth/react-vite-auth-integration.md)
