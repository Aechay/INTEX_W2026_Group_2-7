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
dotnet user-secrets set "AuthBootstrap:AdminPassword" "Admin123!"
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
