# Project Overview: INTEX - Winter 2026 - Group 2-7

This is a comprehensive full-stack web application developed for the Winter 2026 INTEX session. The project, named **wintex**, provides a dashboard for managing residents, tracking social media performance, and predicting donation trends using machine learning.

The architecture is a monorepo consisting of:
- **Backend**: An ASP.NET Core (.NET 10) REST API.
- **Frontend**: A React (Vite, TypeScript, Tailwind CSS, Shadcn UI) single-page application.
- **ML Runtime**: A Python-based runtime for training machine learning models and providing inference via Azure Functions.
- **Infrastructure**: Azure Bicep templates for cloud resource management.

---

## 🛠 Building and Running

### Backend (.NET 10)
Located in `backend/INTEX_W2026_Group_2-7`.

1.  **Dependencies**: Install the [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0).
2.  **Local Secrets**: Use `dotnet user-secrets` to configure your connection strings and admin bootstrap settings:
    ```bash
    dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=(localdb)\mssqllocaldb;Database=OperationalDb;Trusted_Connection=True;"
    dotnet user-secrets set "ConnectionStrings:IdentityConnection" "Server=(localdb)\mssqllocaldb;Database=IdentityDb;Trusted_Connection=True;"
    dotnet user-secrets set "AuthBootstrap:AdminEmail" "admin@example.com"
    dotnet user-secrets set "AuthBootstrap:AdminPassword" "AdminPassword123!"
    ```
3.  **Database Migrations**: Apply migrations for both operational and identity contexts:
    ```bash
    dotnet ef database update --context OperationalDbContext
    dotnet ef database update --context IdentityAppDbContext
    ```
4.  **Run**:
    ```bash
    dotnet run
    ```

### Frontend (React + Vite)
Located in `frontend/intex-w2026-group-2-7`.

1.  **Dependencies**: Install [Bun](https://bun.sh/) (or Node.js/npm).
2.  **Installation**:
    ```bash
    bun install
    ```
3.  **Environment**: Copy `.env.example` to `.env.local` and configure `VITE_API_BASE_URL`.
4.  **Run**:
    ```bash
    bun dev
    ```

### ML Runtime (Python 3.12)
Located in `ml-pipelines/runtime`.

1.  **Dependencies**: Python 3.12 and `msodbcsql18` (for SQL Server connectivity).
2.  **Installation**:
    ```bash
    pip install -r requirements.txt
    ```
3.  **Live Inference (Local)**: Use Azure Functions Core Tools:
    ```bash
    func start
    ```
4.  **Training Job (Docker)**:
    ```bash
    docker build -t wintex-ml-runtime .
    docker run wintex-ml-runtime
    ```

---

## 🏛 Architecture & Conventions

### Directory Structure
- `backend/`: .NET 10 API, EF Core models, and business logic.
- `frontend/`: React source code, components (Shadcn UI), and state management.
- `ml-pipelines/`: Jupyter notebooks for research and the Python runtime for production.
- `infra/`: Azure Bicep templates for provisioning SQL, App Services, ACR, and Container Apps.
- `docs/`: Technical documentation, including auth and integration guides.

### Key Technologies
- **Backend**: .NET 10, Entity Framework Core, SQL Server, ASP.NET Core Identity.
- **Frontend**: Vite, React 18, Tailwind CSS, Lucide Icons, Radix UI, TanStack Query.
- **ML**: Scikit-learn, Pandas, Azure Functions (live inference), Azure Container Apps (nightly training).
- **Deployment**: GitHub Actions (CI/CD), Azure Static Web Apps, Azure Web Apps.

### Development Conventions
- **Secrets Management**: Never commit secrets. Use `dotnet user-secrets` for backend and `.env.local` for frontend.
- **Database Migrations**: EF Core migrations are kept separate. Always specify the context (`--context`) when adding or applying migrations.
- **Auth**: The system uses Bearer tokens and role-based access control (RBAC). Admin routes are protected with the `AdminOnly` policy.
- **ML Views**: Nightly training relies on a stable view contract defined in `ml-pipelines/runtime/SQL_VIEW_CONTRACT.md`.

---

## 🚀 CI/CD Pipelines
The project uses GitHub Actions for automated deployment:
- `main_intex-w2026-group-2-7.yml`: Deploys the .NET backend to Azure Web Apps.
- `azure-static-web-apps-wonderful-ocean-0a5af5610.yml`: Deploys the frontend to Azure Static Web Apps.
- `ml-runtime-deploy.yml`: Deploys the Python ML runtime and training container.
