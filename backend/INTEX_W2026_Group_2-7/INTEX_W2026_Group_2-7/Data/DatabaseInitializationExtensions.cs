using INTEX_W2026_Group_2_7.Auth;
using INTEX_W2026_Group_2_7.Configuration;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace INTEX_W2026_Group_2_7.Data;

public static class DatabaseInitializationExtensions
{
    public static async Task InitializeDatabasesAsync(this WebApplication app)
    {
        await using var scope = app.Services.CreateAsyncScope();

        var operationalDbContext = scope.ServiceProvider.GetRequiredService<OperationalDbContext>();
        var identityDbContext = scope.ServiceProvider.GetRequiredService<IdentityAppDbContext>();

        await EnsureDatabaseReadyAsync(operationalDbContext);
        await EnsureDatabaseReadyAsync(identityDbContext);
    }

    public static async Task SeedIdentityDataAsync(this WebApplication app)
    {
        await using var scope = app.Services.CreateAsyncScope();

        var logger = scope.ServiceProvider
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger("IdentityDataSeeder");
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var bootstrapOptions = scope.ServiceProvider
            .GetRequiredService<IOptions<AuthBootstrapOptions>>()
            .Value;

        foreach (var role in new[] { AppRoles.Admin, AppRoles.User })
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                var result = await roleManager.CreateAsync(new IdentityRole(role));
                if (!result.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Failed to create role '{role}': {string.Join(", ", result.Errors.Select(error => error.Description))}");
                }
            }
        }

        if (string.IsNullOrWhiteSpace(bootstrapOptions.AdminEmail) ||
            string.IsNullOrWhiteSpace(bootstrapOptions.AdminPassword))
        {
            logger.LogInformation(
                "Skipping bootstrap admin creation because {SectionName} is not fully configured.",
                AuthBootstrapOptions.SectionName);
            return;
        }

        var adminUser = await userManager.FindByEmailAsync(bootstrapOptions.AdminEmail);
        if (adminUser is null)
        {
            adminUser = new ApplicationUser
            {
                UserName = bootstrapOptions.AdminEmail,
                Email = bootstrapOptions.AdminEmail,
                EmailConfirmed = true
            };

            var createResult = await userManager.CreateAsync(adminUser, bootstrapOptions.AdminPassword);
            if (!createResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Failed to create bootstrap admin user: {string.Join(", ", createResult.Errors.Select(error => error.Description))}");
            }
        }

        if (!await userManager.IsInRoleAsync(adminUser, AppRoles.User))
        {
            var userRoleResult = await userManager.AddToRoleAsync(adminUser, AppRoles.User);
            if (!userRoleResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Failed to assign '{AppRoles.User}' role: {string.Join(", ", userRoleResult.Errors.Select(error => error.Description))}");
            }
        }

        if (!await userManager.IsInRoleAsync(adminUser, AppRoles.Admin))
        {
            var adminRoleResult = await userManager.AddToRoleAsync(adminUser, AppRoles.Admin);
            if (!adminRoleResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Failed to assign '{AppRoles.Admin}' role: {string.Join(", ", adminRoleResult.Errors.Select(error => error.Description))}");
            }
        }
    }

    private static async Task EnsureDatabaseReadyAsync(DbContext dbContext)
    {
        if (dbContext.Database.IsRelational())
        {
            await dbContext.Database.MigrateAsync();
            return;
        }

        await dbContext.Database.EnsureCreatedAsync();
    }
}
