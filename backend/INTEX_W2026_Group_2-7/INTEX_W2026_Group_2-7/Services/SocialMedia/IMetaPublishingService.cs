namespace INTEX_W2026_Group_2_7.Services.SocialMedia;

public interface IMetaPublishingService
{
    Task<MetaPublishedPost> PublishAsync(MetaPublishRequest request, CancellationToken cancellationToken);
}

public sealed record MetaPublishRequest(
    string Platform,
    string PostType,
    string MediaType,
    string Caption,
    string? CallToActionUrl,
    string? AltText,
    IReadOnlyCollection<string> MediaUrls);

public sealed record MetaPublishedPost(
    string Platform,
    string PlatformPostId,
    string? PostUrl,
    string? PlatformMetadataJson);
