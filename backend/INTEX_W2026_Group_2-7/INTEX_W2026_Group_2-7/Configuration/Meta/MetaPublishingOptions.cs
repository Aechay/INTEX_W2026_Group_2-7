namespace INTEX_W2026_Group_2_7.Configuration.Meta;

public sealed class MetaPublishingOptions
{
    public const string SectionName = "MetaPublishing";

    public string GraphApiVersion { get; set; } = "v25.0";
    public string FacebookPageAccessToken { get; set; } = string.Empty;
    public string FacebookPageId { get; set; } = string.Empty;
    public string InstagramAccessToken { get; set; } = string.Empty;
    public string InstagramAccountId { get; set; } = string.Empty;
}
