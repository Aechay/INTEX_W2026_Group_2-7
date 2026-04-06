namespace INTEX_W2026_Group_2_7.Configuration;

public sealed class AuthBootstrapOptions
{
    public const string SectionName = "AuthBootstrap";

    public string? AdminEmail { get; set; }

    public string? AdminPassword { get; set; }
}
