namespace INTEX_W2026_Group_2_7.Models.SocialMedia;

public static class SocialMediaPlatforms
{
    public const string Facebook = "Facebook";
    public const string Instagram = "Instagram";
}

public static class SocialMediaPublishStatuses
{
    public const string Published = "Published";
    public const string Recorded = "Recorded";
}

public sealed record SocialMediaPostsPageResponse(
    IReadOnlyCollection<SocialMediaPostSummaryDto> Posts,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages,
    SocialMediaPostFilterOptionsDto FilterOptions);

public sealed record SocialMediaPostFilterOptionsDto(
    IReadOnlyCollection<string> Platforms,
    IReadOnlyCollection<string> MediaTypes,
    IReadOnlyCollection<string> ContentTopics,
    IReadOnlyCollection<string> PublishStatuses);

public sealed record SocialMediaPostSummaryDto(
    int PostId,
    string Platform,
    string? PlatformPostId,
    string? PostUrl,
    string PublishStatus,
    DateTime CreatedAt,
    DateTime? PublishedAtUtc,
    string PostType,
    string MediaType,
    string Caption,
    string? CampaignName,
    string ContentTopic,
    string SentimentTone,
    bool FeaturesResidentStory,
    bool HasCallToAction,
    string? CallToActionType,
    int Reach,
    int Impressions,
    int Likes,
    int Comments,
    int Shares,
    int DonationReferrals,
    decimal EstimatedDonationValuePhp,
    decimal? PredictedDonationValuePhp);

public sealed record SocialMediaPostDetailDto(
    int PostId,
    string Platform,
    string? PlatformPostId,
    string? PostUrl,
    string PublishStatus,
    DateTime CreatedAt,
    DateTime? PublishedAtUtc,
    string DayOfWeek,
    int PostHour,
    string PostType,
    string MediaType,
    string Caption,
    string? Hashtags,
    int NumHashtags,
    int MentionsCount,
    bool HasCallToAction,
    string? CallToActionType,
    string? CallToActionUrl,
    string? AltText,
    IReadOnlyCollection<string> MediaUrls,
    string ContentTopic,
    string SentimentTone,
    int CaptionLength,
    bool FeaturesResidentStory,
    string? CampaignName,
    bool IsBoosted,
    decimal? BoostBudgetPhp,
    int Impressions,
    int Reach,
    int Likes,
    int Comments,
    int Shares,
    int Saves,
    int ClickThroughs,
    int? VideoViews,
    decimal EngagementRate,
    int ProfileVisits,
    int DonationReferrals,
    decimal EstimatedDonationValuePhp,
    decimal? PredictedDonationValuePhp,
    string? PredictionModelVersion,
    DateTimeOffset? PredictionScoredAtUtc,
    int FollowerCountAtPost,
    DateTime? LastMetricsUpdatedAtUtc,
    int? WatchTimeSeconds,
    int? AvgViewDurationSeconds,
    int? SubscriberCountAtPost,
    int? Forwards);

public sealed record SocialMediaPostUpsertRequest(
    string Platform,
    DateTime? CreatedAt,
    string PostType,
    string MediaType,
    string Caption,
    string? Hashtags,
    int MentionsCount,
    bool HasCallToAction,
    string? CallToActionType,
    string? CallToActionUrl,
    string ContentTopic,
    string SentimentTone,
    bool FeaturesResidentStory,
    string? CampaignName,
    bool IsBoosted,
    decimal? BoostBudgetPhp,
    int FollowerCountAtPost,
    string? PlatformPostId,
    string? PostUrl,
    string? AltText,
    IReadOnlyCollection<string>? MediaUrls,
    int Impressions,
    int Reach,
    int Likes,
    int Comments,
    int Shares,
    int Saves,
    int ClickThroughs,
    int? VideoViews,
    decimal? EngagementRate,
    int ProfileVisits,
    int DonationReferrals,
    decimal EstimatedDonationValuePhp,
    int? WatchTimeSeconds,
    int? AvgViewDurationSeconds,
    int? SubscriberCountAtPost,
    int? Forwards,
    decimal? PredictedDonationValuePhp,
    string? PredictionModelVersion,
    DateTimeOffset? PredictionScoredAtUtc);

public sealed record SocialMediaPublishRequest(
    IReadOnlyCollection<string>? Platforms,
    string PostType,
    string MediaType,
    string Caption,
    string? Hashtags,
    int MentionsCount,
    bool HasCallToAction,
    string? CallToActionType,
    string? CallToActionUrl,
    string ContentTopic,
    string SentimentTone,
    bool FeaturesResidentStory,
    string? CampaignName,
    bool IsBoosted,
    decimal? BoostBudgetPhp,
    int FollowerCountAtPost,
    string? AltText,
    IReadOnlyCollection<string>? MediaUrls,
    IReadOnlyCollection<string>? UploadedAssetIds,
    decimal? PredictedDonationValuePhp,
    string? PredictionModelVersion,
    DateTimeOffset? PredictionScoredAtUtc);

public sealed record SocialMediaPublishResponse(
    IReadOnlyCollection<SocialMediaPostDetailDto> PublishedPosts,
    IReadOnlyCollection<SocialMediaPublishFailureDto> Failures);

public sealed record SocialMediaPublishFailureDto(
    string Platform,
    string Message);

public sealed record SocialMediaAssetUploadResponse(
    IReadOnlyCollection<SocialMediaUploadedAssetDto> Assets);

public sealed record SocialMediaUploadedAssetDto(
    string AssetId,
    string FileName,
    string ContentType,
    long SizeBytes,
    string LiveUrl);
