namespace INTEX_W2026_Group_2_7.Configuration;

public sealed class FrontendOptions
{
    public const string SectionName = "Frontend";

    public string? BaseUrl { get; set; }

    public string ExternalAuthCallbackPath { get; set; } = "/external-auth/callback";
}
