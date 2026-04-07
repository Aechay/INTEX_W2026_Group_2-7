namespace INTEX_W2026_Group_2_7.Configuration.Ml;

public sealed class SocialMediaInferenceOptions
{
    public const string SectionName = "SocialMediaInference";

    public string? BaseUrl { get; set; }

    public string Route { get; set; } = "/api/social-media/predict";

    public string? SharedSecret { get; set; }

    public int TimeoutSeconds { get; set; } = 15;
}
