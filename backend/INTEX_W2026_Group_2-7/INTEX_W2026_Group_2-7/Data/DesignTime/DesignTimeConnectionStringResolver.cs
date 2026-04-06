using Microsoft.Extensions.Configuration;

namespace INTEX_W2026_Group_2_7.Data.DesignTime;

internal static class DesignTimeConnectionStringResolver
{
    public static string Resolve(string name)
    {
        var environmentName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile($"appsettings.{environmentName}.json", optional: true)
            .AddUserSecrets(typeof(Program).Assembly, optional: true)
            .AddEnvironmentVariables()
            .Build();

        return configuration.GetConnectionString(name) ??
               $"Server=localhost;Database=DesignTime_{name};User Id=sa;Password=Password123!;TrustServerCertificate=True";
    }
}
