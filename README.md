# INTEX - Winter 2026 - Group 2-7

For now, this is a very basic scaffold of a Full Stack web app with a React frontend and a .NET 10 Backend w/ a postgres database.

Changes on the main branch in the corresponding folder for each of the components will automatically deploy the changes to the azure resources. The frontend is hosted at [https://wintex.alijahwhitney.dev](https://wintex.alijahwhitney.dev).

You'll need to create a `.env` file inside of the `backend/INTEX_W2026_Group_2-7/INTEX_W2026_Group_2-7` folder with a connection string for the database. The .env file will end up looking like this.

```dockerfile
ConnectionStrings__DefaultConnection="YOUR_DB_CONNECTION_STRING"
```

That way we don't push a connection string up to github.

# CI/CD

I set up 2 different github actions workflows. One to deploy the backend, and one to deploy the frontend. Each workflow is triggered when there is a commit to the main branch with changes in the corresponding folder.

The backend deploy workflow will also apply any migrations in the `backend/.../Migrations` folder to the production database. So try to use the `dotnet ef migrations` commands as you make any database changes in your branches so that the automatic deployment can easily mirror those schema changes to prod.

# Important links and things

The frontend is deployed on azure and has a custom domain on it. The azure domain for it is: [https://wonderful-ocean-0a5af5610.2.azurestaticapps.net](https://wonderful-ocean-0a5af5610.2.azurestaticapps.net) and the custom domain for it is: [https://wintex.alijahwhitney.dev](https://wintex.alijahwhitney.dev). The way it's set up, it will redirect any requests to the azure domain to the custom domain, so just plan around the domain being the `alijahwhitney.dev` one.

The backend is also deployed on azure and has the domain: [https://intex-w2026-group-2-7-h0fwdqczb3hvb2f9.centralus-01.azurewebsites.net](https://intex-w2026-group-2-7-h0fwdqczb3hvb2f9.centralus-01.azurewebsites.net)
