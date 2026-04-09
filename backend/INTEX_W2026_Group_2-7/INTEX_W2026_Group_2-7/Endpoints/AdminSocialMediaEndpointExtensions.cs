using System.Text.Json;
using System.Text.RegularExpressions;
using INTEX_W2026_Group_2_7.Auth;
using INTEX_W2026_Group_2_7.Data;
using INTEX_W2026_Group_2_7.Models.SocialMedia;
using INTEX_W2026_Group_2_7.Services.SocialMedia;
using Microsoft.EntityFrameworkCore;

namespace INTEX_W2026_Group_2_7.Endpoints;

public static class AdminSocialMediaEndpointExtensions
{
    private static readonly Regex HashtagRegex = new(@"#\w+", RegexOptions.Compiled);
    private static readonly Regex MentionRegex = new(@"@\w+", RegexOptions.Compiled);
    private static readonly Regex UrlRegex = new(@"https?:\/\/[^\s]+", RegexOptions.Compiled);

    private const string TemporarySocialAssetPathSegment = "/social-media-assets/temp/";

    public static IEndpointRouteBuilder MapAdminSocialMediaEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/admin/social-media")
            .RequireAuthorization(AppPolicies.AdminOnly);

        group.MapGet("/posts", GetPostsAsync)
            .WithName("GetAdminSocialMediaPosts")
            .Produces<SocialMediaPostsPageResponse>();

        group.MapGet("/posts/{postId:int}", GetPostAsync)
            .WithName("GetAdminSocialMediaPost")
            .Produces<SocialMediaPostDetailDto>()
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/posts", CreatePostAsync)
            .WithName("CreateAdminSocialMediaPost")
            .Produces<SocialMediaPostDetailDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem();

        group.MapPost("/posts/publish", PublishPostAsync)
            .WithName("PublishAdminSocialMediaPost")
            .Produces<SocialMediaPublishResponse>()
            .ProducesValidationProblem();

        group.MapPost("/assets", UploadAssetsAsync)
            .WithName("UploadAdminSocialMediaAssets")
            .Produces<SocialMediaAssetUploadResponse>()
            .ProducesValidationProblem();

        group.MapDelete("/assets/{assetId}", DeleteAssetAsync)
            .WithName("DeleteAdminSocialMediaAsset")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPut("/posts/{postId:int}", UpdatePostAsync)
            .WithName("UpdateAdminSocialMediaPost")
            .Produces<SocialMediaPostDetailDto>()
            .Produces(StatusCodes.Status404NotFound)
            .ProducesValidationProblem();

        group.MapDelete("/posts/{postId:int}", DeletePostAsync)
            .WithName("DeleteAdminSocialMediaPost")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static async Task<IResult> DeleteAssetAsync(
        string assetId,
        ISocialMediaAssetStorage assetStorage,
        CancellationToken cancellationToken)
    {
        await assetStorage.DeleteAssetsAsync(new[] { assetId }, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> GetPostsAsync(
        OperationalDbContext dbContext,
        string? search,
        string? platform,
        string? mediaType,
        string? publishStatus,
        int? page,
        int? pageSize,
        CancellationToken cancellationToken)
    {
        var currentPage = Math.Max(page.GetValueOrDefault(1), 1);
        var resolvedPageSize = Math.Clamp(pageSize.GetValueOrDefault(10), 5, 50);

        var query = dbContext.SocialMediaPosts.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(post =>
                post.Caption.ToLower().Contains(term) ||
                post.Platform.ToLower().Contains(term) ||
                post.ContentTopic.ToLower().Contains(term) ||
                post.SentimentTone.ToLower().Contains(term) ||
                (post.CampaignName != null && post.CampaignName.ToLower().Contains(term)) ||
                (post.Hashtags != null && post.Hashtags.ToLower().Contains(term)) ||
                (post.PlatformPostId != null && post.PlatformPostId.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(platform))
        {
            query = query.Where(post => post.Platform == platform);
        }

        if (!string.IsNullOrWhiteSpace(mediaType))
        {
            query = query.Where(post => post.MediaType == mediaType);
        }

        if (!string.IsNullOrWhiteSpace(publishStatus))
        {
            query = query.Where(post => post.PublishStatus == publishStatus);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = totalCount == 0 ? 1 : (int)Math.Ceiling(totalCount / (double)resolvedPageSize);

        var posts = await query
            .OrderByDescending(post => post.CreatedAt)
            .ThenByDescending(post => post.PostId)
            .Skip((currentPage - 1) * resolvedPageSize)
            .Take(resolvedPageSize)
            .Select(post => new SocialMediaPostSummaryDto(
                post.PostId,
                post.Platform,
                post.PlatformPostId,
                post.PostUrl,
                post.PublishStatus,
                post.CreatedAt,
                post.PublishedAtUtc,
                post.PostType,
                post.MediaType,
                post.Caption,
                post.CampaignName,
                post.ContentTopic,
                post.SentimentTone,
                post.FeaturesResidentStory,
                post.HasCallToAction,
                post.CallToActionType,
                post.Reach,
                post.Impressions,
                post.Likes,
                post.Comments,
                post.Shares,
                post.DonationReferrals,
                post.EstimatedDonationValuePhp,
                post.PredictedDonationValuePhp))
            .ToArrayAsync(cancellationToken);

        var filterOptions = new SocialMediaPostFilterOptionsDto(
            await dbContext.SocialMediaPosts.AsNoTracking()
                .Select(post => post.Platform)
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Distinct()
                .OrderBy(value => value)
                .ToArrayAsync(cancellationToken),
            await dbContext.SocialMediaPosts.AsNoTracking()
                .Select(post => post.MediaType)
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Distinct()
                .OrderBy(value => value)
                .ToArrayAsync(cancellationToken),
            await dbContext.SocialMediaPosts.AsNoTracking()
                .Select(post => post.ContentTopic)
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Distinct()
                .OrderBy(value => value)
                .ToArrayAsync(cancellationToken),
            await dbContext.SocialMediaPosts.AsNoTracking()
                .Select(post => post.PublishStatus)
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Distinct()
                .OrderBy(value => value)
                .ToArrayAsync(cancellationToken));

        return Results.Ok(new SocialMediaPostsPageResponse(
            posts,
            currentPage,
            resolvedPageSize,
            totalCount,
            totalPages,
            filterOptions));
    }

    private static async Task<IResult> GetPostAsync(
        OperationalDbContext dbContext,
        int postId,
        CancellationToken cancellationToken)
    {
        var post = await dbContext.SocialMediaPosts
            .AsNoTracking()
            .FirstOrDefaultAsync(candidate => candidate.PostId == postId, cancellationToken);

        return post is null
            ? Results.NotFound()
            : Results.Ok(ToDetailDto(post));
    }

    private static async Task<IResult> CreatePostAsync(
        OperationalDbContext dbContext,
        SocialMediaPostUpsertRequest request,
        CancellationToken cancellationToken)
    {
        var validationErrors = ValidateUpsertRequest(request);
        if (validationErrors.Count > 0)
        {
            return Results.ValidationProblem(validationErrors);
        }

        var createdAt = EnsureUtc(request.CreatedAt ?? DateTime.UtcNow);
        var post = new SocialMediaPost();
        ApplyUpsertRequest(post, request, createdAt);

        dbContext.SocialMediaPosts.Add(post);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/admin/social-media/posts/{post.PostId}", ToDetailDto(post));
    }

    private static async Task<IResult> PublishPostAsync(
        OperationalDbContext dbContext,
        SocialMediaPublishRequest request,
        IMetaPublishingService publishingService,
        ISocialMediaAssetStorage assetStorage,
        CancellationToken cancellationToken)
    {
        var validationErrors = ValidatePublishRequest(request);
        if (validationErrors.Count > 0)
        {
            return Results.ValidationProblem(validationErrors);
        }

        var platforms = request.Platforms!
            .Where(platform => !string.IsNullOrWhiteSpace(platform))
            .Select(NormalizePlatform)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var createdPosts = new List<SocialMediaPostDetailDto>();
        var failures = new List<SocialMediaPublishFailureDto>();

        foreach (var platform in platforms)
        {
            try
            {
                var publishResult = await publishingService.PublishAsync(
                    new MetaPublishRequest(
                        platform,
                        request.PostType,
                        request.MediaType,
                        request.Caption,
                        request.CallToActionUrl,
                        request.AltText,
                        request.MediaUrls?.Where(url => !string.IsNullOrWhiteSpace(url)).Select(url => url.Trim()).ToArray()
                        ?? Array.Empty<string>()),
                    cancellationToken);

                var createdAt = DateTime.UtcNow;
                var persistedMediaUrls = request.MediaUrls?
                    .Where(url => !string.IsNullOrWhiteSpace(url))
                    .Select(url => url.Trim())
                    .Where(url => !IsTemporarySocialAssetUrl(url))
                    .ToArray();

                var hashtags = ExtractHashtags(request.Caption);
                var mentions = ExtractMentions(request.Caption);
                var ctaUrl = ExtractFirstUrl(request.Caption) ?? NormalizeOptionalString(request.CallToActionUrl);

                var post = new SocialMediaPost
                {
                    Platform = platform,
                    PlatformPostId = publishResult.PlatformPostId,
                    PostUrl = publishResult.PostUrl,
                    PublishStatus = SocialMediaPublishStatuses.Published,
                    CreatedAt = createdAt,
                    PublishedAtUtc = createdAt,
                    DayOfWeek = createdAt.DayOfWeek.ToString(),
                    PostHour = createdAt.Hour,
                    PostType = request.PostType.Trim(),
                    MediaType = request.MediaType.Trim(),
                    Caption = request.Caption.Trim(),
                    Hashtags = hashtags,
                    NumHashtags = string.IsNullOrWhiteSpace(hashtags) ? 0 : hashtags.Split(' ').Length,
                    MentionsCount = string.IsNullOrWhiteSpace(mentions) ? 0 : mentions.Split(' ').Length,
                    HasCallToAction = !string.IsNullOrWhiteSpace(ctaUrl),
                    CallToActionType = !string.IsNullOrWhiteSpace(ctaUrl) ? NormalizeOptionalString(request.CallToActionType) ?? "Donate" : null,
                    CallToActionUrl = ctaUrl,
                    AltText = NormalizeOptionalString(request.AltText),
                    MediaAssetUrlsJson = SerializeMediaUrls(persistedMediaUrls),
                    PlatformMetadataJson = publishResult.PlatformMetadataJson,
                    ContentTopic = request.ContentTopic.Trim(),
                    SentimentTone = request.SentimentTone.Trim(),
                    CaptionLength = request.Caption.Trim().Length,
                    FeaturesResidentStory = request.FeaturesResidentStory,
                    CampaignName = NormalizeOptionalString(request.CampaignName),
                    IsBoosted = request.IsBoosted,
                    BoostBudgetPhp = request.IsBoosted ? (request.BoostBudgetPhp ?? 0) : null,
                    Impressions = 0,
                    Reach = 0,
                    Likes = 0,
                    Comments = 0,
                    Shares = 0,
                    Saves = 0,
                    ClickThroughs = 0,
                    EngagementRate = 0,
                    ProfileVisits = 0,
                    DonationReferrals = 0,
                    EstimatedDonationValuePhp = 0,
                    PredictedDonationValuePhp = request.PredictedDonationValuePhp,
                    PredictionModelVersion = NormalizeOptionalString(request.PredictionModelVersion),
                    PredictionScoredAtUtc = request.PredictionScoredAtUtc,
                    FollowerCountAtPost = Math.Max(request.FollowerCountAtPost, 0),
                    LastMetricsUpdatedAtUtc = DateTime.UtcNow
                };

                dbContext.SocialMediaPosts.Add(post);
                await dbContext.SaveChangesAsync(cancellationToken);
                createdPosts.Add(ToDetailDto(post));
            }
            catch (Exception ex)
            {
                failures.Add(new SocialMediaPublishFailureDto(platform, ex.Message));
            }
        }

        if (failures.Count == 0 && request.UploadedAssetIds is { Count: > 0 })
        {
            await assetStorage.DeleteAssetsAsync(request.UploadedAssetIds, cancellationToken);
        }

        return Results.Ok(new SocialMediaPublishResponse(createdPosts, failures));
    }

    private static async Task<IResult> UploadAssetsAsync(
        HttpRequest request,
        ISocialMediaAssetStorage assetStorage,
        CancellationToken cancellationToken)
    {
        var form = await request.ReadFormAsync(cancellationToken);
        if (form.Files.Count == 0)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["files"] = ["At least one image file is required."]
            });
        }

        var publicBaseUri = new Uri($"{request.Scheme}://{request.Host}", UriKind.Absolute);
        var uploadedAssets = new List<SocialMediaUploadedAssetDto>(form.Files.Count);

        try
        {
            foreach (var file in form.Files)
            {
                uploadedAssets.Add(await assetStorage.SaveImageAsync(file, publicBaseUri, cancellationToken));
            }
        }
        catch (InvalidOperationException ex)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["files"] = [ex.Message]
            });
        }

        return Results.Ok(new SocialMediaAssetUploadResponse(uploadedAssets));
    }

    private static async Task<IResult> UpdatePostAsync(
        OperationalDbContext dbContext,
        int postId,
        SocialMediaPostUpsertRequest request,
        CancellationToken cancellationToken)
    {
        var validationErrors = ValidateUpsertRequest(request);
        if (validationErrors.Count > 0)
        {
            return Results.ValidationProblem(validationErrors);
        }

        var post = await dbContext.SocialMediaPosts.FirstOrDefaultAsync(candidate => candidate.PostId == postId, cancellationToken);
        if (post is null)
        {
            return Results.NotFound();
        }

        var createdAt = EnsureUtc(request.CreatedAt ?? post.CreatedAt);
        ApplyUpsertRequest(post, request, createdAt);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(ToDetailDto(post));
    }

    private static async Task<IResult> DeletePostAsync(
        OperationalDbContext dbContext,
        int postId,
        CancellationToken cancellationToken)
    {
        var post = await dbContext.SocialMediaPosts.FirstOrDefaultAsync(candidate => candidate.PostId == postId, cancellationToken);
        if (post is null)
        {
            return Results.NotFound();
        }

        dbContext.SocialMediaPosts.Remove(post);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private static void ApplyUpsertRequest(SocialMediaPost post, SocialMediaPostUpsertRequest request, DateTime createdAt)
    {
        var platformPostId = NormalizeOptionalString(request.PlatformPostId);
        var postUrl = NormalizeOptionalString(request.PostUrl);

        var hashtags = ExtractHashtags(request.Caption);
        var mentions = ExtractMentions(request.Caption);
        var ctaUrl = ExtractFirstUrl(request.Caption) ?? NormalizeOptionalString(request.CallToActionUrl);

        post.Platform = NormalizePlatform(request.Platform);
        post.PlatformPostId = platformPostId;
        post.PostUrl = postUrl;
        post.PublishStatus = !string.IsNullOrWhiteSpace(platformPostId) || !string.IsNullOrWhiteSpace(postUrl)
            ? SocialMediaPublishStatuses.Published
            : SocialMediaPublishStatuses.Recorded;
        post.CreatedAt = createdAt;
        post.PublishedAtUtc = createdAt;
        post.DayOfWeek = createdAt.DayOfWeek.ToString();
        post.PostHour = createdAt.Hour;
        post.PostType = request.PostType.Trim();
        post.MediaType = request.MediaType.Trim();
        post.Caption = request.Caption.Trim();
        post.Hashtags = hashtags;
        post.NumHashtags = string.IsNullOrWhiteSpace(hashtags) ? 0 : hashtags.Split(' ').Length;
        post.MentionsCount = string.IsNullOrWhiteSpace(mentions) ? 0 : mentions.Split(' ').Length;
        post.HasCallToAction = !string.IsNullOrWhiteSpace(ctaUrl);
        post.CallToActionType = !string.IsNullOrWhiteSpace(ctaUrl) ? NormalizeOptionalString(request.CallToActionType) ?? "Donate" : null;
        post.CallToActionUrl = ctaUrl;
        post.AltText = NormalizeOptionalString(request.AltText);
        post.MediaAssetUrlsJson = SerializeMediaUrls(request.MediaUrls);
        post.ContentTopic = request.ContentTopic.Trim();
        post.SentimentTone = request.SentimentTone.Trim();
        post.CaptionLength = request.Caption.Trim().Length;
        post.FeaturesResidentStory = request.FeaturesResidentStory;
        post.CampaignName = NormalizeOptionalString(request.CampaignName);
        post.IsBoosted = request.IsBoosted;
        post.BoostBudgetPhp = request.IsBoosted ? (request.BoostBudgetPhp ?? 0) : null;
        post.Impressions = Math.Max(request.Impressions, 0);
        post.Reach = Math.Max(request.Reach, 0);
        post.Likes = Math.Max(request.Likes, 0);
        post.Comments = Math.Max(request.Comments, 0);
        post.Shares = Math.Max(request.Shares, 0);
        post.Saves = Math.Max(request.Saves, 0);
        post.ClickThroughs = Math.Max(request.ClickThroughs, 0);
        post.VideoViews = request.VideoViews < 0 ? 0 : request.VideoViews;
        post.EngagementRate = request.EngagementRate ?? CalculateEngagementRate(request.Reach, request.Impressions, request.Likes, request.Comments, request.Shares, request.Saves);
        post.ProfileVisits = Math.Max(request.ProfileVisits, 0);
        post.DonationReferrals = Math.Max(request.DonationReferrals, 0);
        post.EstimatedDonationValuePhp = Math.Max(request.EstimatedDonationValuePhp, 0);
        post.PredictedDonationValuePhp = request.PredictedDonationValuePhp;
        post.PredictionModelVersion = NormalizeOptionalString(request.PredictionModelVersion);
        post.PredictionScoredAtUtc = request.PredictionScoredAtUtc;
        post.FollowerCountAtPost = Math.Max(request.FollowerCountAtPost, 0);
        post.LastMetricsUpdatedAtUtc = DateTime.UtcNow;
        post.WatchTimeSeconds = request.WatchTimeSeconds < 0 ? 0 : request.WatchTimeSeconds;
        post.AvgViewDurationSeconds = request.AvgViewDurationSeconds < 0 ? 0 : request.AvgViewDurationSeconds;
        post.SubscriberCountAtPost = request.SubscriberCountAtPost < 0 ? 0 : request.SubscriberCountAtPost;
        post.Forwards = request.Forwards < 0 ? 0 : request.Forwards;
    }

    private static SocialMediaPostDetailDto ToDetailDto(SocialMediaPost post)
    {
        return new SocialMediaPostDetailDto(
            post.PostId,
            post.Platform,
            post.PlatformPostId,
            post.PostUrl,
            post.PublishStatus,
            post.CreatedAt,
            post.PublishedAtUtc,
            post.DayOfWeek,
            post.PostHour,
            post.PostType,
            post.MediaType,
            post.Caption,
            post.Hashtags,
            post.NumHashtags,
            post.MentionsCount,
            post.HasCallToAction,
            post.CallToActionType,
            post.CallToActionUrl,
            post.AltText,
            DeserializeMediaUrls(post.MediaAssetUrlsJson),
            post.ContentTopic,
            post.SentimentTone,
            post.CaptionLength,
            post.FeaturesResidentStory,
            post.CampaignName,
            post.IsBoosted,
            post.BoostBudgetPhp,
            post.Impressions,
            post.Reach,
            post.Likes,
            post.Comments,
            post.Shares,
            post.Saves,
            post.ClickThroughs,
            post.VideoViews,
            post.EngagementRate,
            post.ProfileVisits,
            post.DonationReferrals,
            post.EstimatedDonationValuePhp,
            post.PredictedDonationValuePhp,
            post.PredictionModelVersion,
            post.PredictionScoredAtUtc,
            post.FollowerCountAtPost,
            post.LastMetricsUpdatedAtUtc,
            post.WatchTimeSeconds,
            post.AvgViewDurationSeconds,
            post.SubscriberCountAtPost,
            post.Forwards);
    }

    private static Dictionary<string, string[]> ValidateUpsertRequest(SocialMediaPostUpsertRequest request)
    {
        var errors = new Dictionary<string, string[]>(StringComparer.Ordinal);

        ValidateRequiredString(nameof(request.Platform), request.Platform, errors);
        ValidateRequiredString(nameof(request.PostType), request.PostType, errors);
        ValidateRequiredString(nameof(request.MediaType), request.MediaType, errors);
        ValidateRequiredString(nameof(request.Caption), request.Caption, errors);
        ValidateRequiredString(nameof(request.ContentTopic), request.ContentTopic, errors);
        ValidateRequiredString(nameof(request.SentimentTone), request.SentimentTone, errors);

        ValidateNonNegative(nameof(request.MentionsCount), request.MentionsCount, errors);
        ValidateNonNegative(nameof(request.FollowerCountAtPost), request.FollowerCountAtPost, errors);
        ValidateNonNegative(nameof(request.Impressions), request.Impressions, errors);
        ValidateNonNegative(nameof(request.Reach), request.Reach, errors);
        ValidateNonNegative(nameof(request.Likes), request.Likes, errors);
        ValidateNonNegative(nameof(request.Comments), request.Comments, errors);
        ValidateNonNegative(nameof(request.Shares), request.Shares, errors);
        ValidateNonNegative(nameof(request.Saves), request.Saves, errors);
        ValidateNonNegative(nameof(request.ClickThroughs), request.ClickThroughs, errors);
        ValidateOptionalNonNegative(nameof(request.VideoViews), request.VideoViews, errors);
        ValidateOptionalNonNegative(nameof(request.WatchTimeSeconds), request.WatchTimeSeconds, errors);
        ValidateOptionalNonNegative(nameof(request.AvgViewDurationSeconds), request.AvgViewDurationSeconds, errors);
        ValidateOptionalNonNegative(nameof(request.SubscriberCountAtPost), request.SubscriberCountAtPost, errors);
        ValidateOptionalNonNegative(nameof(request.Forwards), request.Forwards, errors);

        if (request.EstimatedDonationValuePhp < 0)
        {
            errors[nameof(request.EstimatedDonationValuePhp)] = [$"{nameof(request.EstimatedDonationValuePhp)} must be non-negative."];
        }

        if (request.EngagementRate is < 0)
        {
            errors[nameof(request.EngagementRate)] = [$"{nameof(request.EngagementRate)} must be non-negative."];
        }

        if (request.MediaUrls is not null
            && request.MediaUrls.Any(url => !string.IsNullOrWhiteSpace(url) && !Uri.TryCreate(url, UriKind.Absolute, out _)))
        {
            errors[nameof(request.MediaUrls)] = [$"{nameof(request.MediaUrls)} must contain only absolute URLs."];
        }

        if (!IsSupportedPlatform(request.Platform))
        {
            errors[nameof(request.Platform)] = ["Platform must be either Instagram or Facebook."];
        }

        return errors;
    }

    private static Dictionary<string, string[]> ValidatePublishRequest(SocialMediaPublishRequest request)
    {
        var errors = new Dictionary<string, string[]>(StringComparer.Ordinal);

        ValidateRequiredString(nameof(request.PostType), request.PostType, errors);
        ValidateRequiredString(nameof(request.MediaType), request.MediaType, errors);
        ValidateRequiredString(nameof(request.Caption), request.Caption, errors);
        ValidateRequiredString(nameof(request.ContentTopic), request.ContentTopic, errors);
        ValidateRequiredString(nameof(request.SentimentTone), request.SentimentTone, errors);
        ValidateNonNegative(nameof(request.MentionsCount), request.MentionsCount, errors);
        ValidateNonNegative(nameof(request.FollowerCountAtPost), request.FollowerCountAtPost, errors);

        if (request.Platforms is null || request.Platforms.Count == 0)
        {
            errors[nameof(request.Platforms)] = ["At least one publishing platform is required."];
        }
        else if (request.Platforms.Any(platform => !IsSupportedPlatform(platform)))
        {
            errors[nameof(request.Platforms)] = ["Platforms must be Instagram and/or Facebook."];
        }

        var normalizedMediaUrls = request.MediaUrls?
            .Where(url => !string.IsNullOrWhiteSpace(url))
            .Select(url => url.Trim())
            .ToArray()
            ?? Array.Empty<string>();

        if (normalizedMediaUrls.Any(url => !Uri.TryCreate(url, UriKind.Absolute, out _)))
        {
            errors[nameof(request.MediaUrls)] = [$"{nameof(request.MediaUrls)} must contain only absolute URLs."];
        }

        return errors;
    }

    private static void ValidateRequiredString(string fieldName, string? value, IDictionary<string, string[]> errors)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            errors[fieldName] = [$"{fieldName} is required."];
        }
    }

    private static void ValidateNonNegative(string fieldName, int value, IDictionary<string, string[]> errors)
    {
        if (value < 0)
        {
            errors[fieldName] = [$"{fieldName} must be non-negative."];
        }
    }

    private static void ValidateOptionalNonNegative(string fieldName, int? value, IDictionary<string, string[]> errors)
    {
        if (value < 0)
        {
            errors[fieldName] = [$"{fieldName} must be non-negative."];
        }
    }

    private static decimal CalculateEngagementRate(
        int reach,
        int impressions,
        int likes,
        int comments,
        int shares,
        int saves)
    {
        var denominator = Math.Max(reach, impressions);
        if (denominator <= 0)
        {
            return 0m;
        }

        var totalEngagements = likes + comments + shares + saves;
        return decimal.Round(totalEngagements * 100m / denominator, 4);
    }

    private static string? ExtractHashtags(string? caption)
    {
        if (string.IsNullOrWhiteSpace(caption)) return null;
        var matches = HashtagRegex.Matches(caption);
        return matches.Count == 0 ? null : string.Join(" ", matches.Cast<Match>().Select(m => m.Value));
    }

    private static string? ExtractMentions(string? caption)
    {
        if (string.IsNullOrWhiteSpace(caption)) return null;
        var matches = MentionRegex.Matches(caption);
        return matches.Count == 0 ? null : string.Join(" ", matches.Cast<Match>().Select(m => m.Value));
    }

    private static string? ExtractFirstUrl(string? caption)
    {
        if (string.IsNullOrWhiteSpace(caption)) return null;
        var match = UrlRegex.Match(caption);
        return match.Success ? match.Value : null;
    }

    private static bool IsTemporarySocialAssetUrl(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var parsedUri))
        {
            return false;
        }

        return parsedUri.AbsolutePath.Contains(TemporarySocialAssetPathSegment, StringComparison.OrdinalIgnoreCase);
    }
    }
    private static string? SerializeMediaUrls(IReadOnlyCollection<string>? mediaUrls)
    {
        var normalizedMediaUrls = mediaUrls?
            .Where(url => !string.IsNullOrWhiteSpace(url))
            .Select(url => url.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return normalizedMediaUrls is { Length: > 0 }
            ? JsonSerializer.Serialize(normalizedMediaUrls)
            : null;
    }

    private static IReadOnlyCollection<string> DeserializeMediaUrls(string? mediaUrlsJson)
    {
        if (string.IsNullOrWhiteSpace(mediaUrlsJson))
        {
            return Array.Empty<string>();
        }

        try
        {
            return JsonSerializer.Deserialize<string[]>(mediaUrlsJson) ?? Array.Empty<string>();
        }
        catch (JsonException)
        {
            return Array.Empty<string>();
        }
    }

    private static string? NormalizeOptionalString(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string NormalizePlatform(string platform)
    {
        return platform.Trim().ToLowerInvariant() switch
        {
            "facebook" => SocialMediaPlatforms.Facebook,
            "instagram" => SocialMediaPlatforms.Instagram,
            _ => platform.Trim()
        };
    }

    private static bool IsSupportedPlatform(string? platform)
    {
        return platform?.Trim().ToLowerInvariant() is "facebook" or "instagram";
    }

    private static DateTime EnsureUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }
}
