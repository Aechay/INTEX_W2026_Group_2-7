namespace INTEX_W2026_Group_2_7.Configuration;

public static class ConfigurationExtensions
{
    public static string GetRequiredConnectionString(this IConfiguration configuration, string name)
    {
        return configuration.GetConnectionString(name) ?? throw new InvalidOperationException(
            $"Missing connection string '{name}'. Configure ConnectionStrings__{name} with user-secrets or environment variables.");
    }
}
