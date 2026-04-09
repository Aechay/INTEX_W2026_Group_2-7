using System.Net.Http.Headers;
using System.Text.Json;
using INTEX_W2026_Group_2_7.Configuration.Meta;
using INTEX_W2026_Group_2_7.Models.SocialMedia;
using Microsoft.Extensions.Options;

namespace INTEX_W2026_Group_2_7.Services.SocialMedia;

public sealed class MetaPublishingService : IMetaPublishingService
{
    public const string HttpClientName = "MetaPublishingClient";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<MetaPublishingService> _logger;
    private readonly MetaPublishingOptions _options;

    public MetaPublishingService(
        IHttpClientFactory httpClientFactory,
        IOptions<MetaPublishingOptions> options,
        ILogger<MetaPublishingService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _options = options.Value;
    }

    public Task<MetaPublishedPost> PublishAsync(MetaPublishRequest request, CancellationToken cancellationToken)
    {
        var platform = NormalizePlatform(request.Platform);

        return platform switch
        {
            SocialMediaPlatforms.Facebook => PublishFacebookAsync(request, cancellationToken),
            SocialMediaPlatforms.Instagram => PublishInstagramAsync(request, cancellationToken),
            _ => throw new InvalidOperationException($"Unsupported platform '{request.Platform}'.")
        };
    }

    private async Task<MetaPublishedPost> PublishFacebookAsync(
        MetaPublishRequest request,
        CancellationToken cancellationToken)
    {
        var providedToken = RequireValue(
            _options.FacebookPageAccessToken,
            $"{MetaPublishingOptions.SectionName}:FacebookPageAccessToken must be configured.");

        // Resolve the specific Page Context (ID and appropriate Token)
        var context = await ResolveFacebookPageContextAsync(providedToken, cancellationToken);
        var pageId = context.PageId;
        var accessToken = context.AccessToken;

        var mediaUrls = NormalizeMediaUrls(request.MediaUrls);
        var caption = BuildCaptionWithCallToAction(request.Caption, request.CallToActionUrl);
        var normalizedMediaType = request.MediaType.Trim().ToLowerInvariant();

        // Support up-to-date Video and Reel posting for Facebook Pages using the pages_manage_posts scope.
        // v25.0 routes for Page video content utilize the /{page-id}/videos edge.
        if (normalizedMediaType is "video" or "reel")
        {
            if (mediaUrls.Count == 0)
            {
                throw new InvalidOperationException("Facebook video/reel publishing requires a media URL.");
            }

            var videoPayload = new List<KeyValuePair<string, string>>
            {
                new("file_url", mediaUrls[0]),
                new("description", caption),
                new("published", "true")
            };

            using var videoDocument = await SendGraphFormAsync(
                FacebookGraphApiBaseUrl(),
                $"{pageId}/videos",
                accessToken,
                videoPayload,
                cancellationToken);

            var videoId = RequireJsonString(videoDocument.RootElement, "id", "Facebook video publish response did not include an id.");
            return new MetaPublishedPost(
                SocialMediaPlatforms.Facebook,
                videoId,
                BuildFacebookPostUrl(videoId),
                JsonSerializer.Serialize(new { pageId, mode = normalizedMediaType, videoId }));
        }

        // Standard Feed posts (Text, Link, Photos, Carousels)
        if (mediaUrls.Count == 0)
        {
            var feedPayload = new List<KeyValuePair<string, string>>
            {
                new("message", request.Caption.Trim())
            };

            if (!string.IsNullOrWhiteSpace(request.CallToActionUrl))
            {
                feedPayload.Add(new("link", request.CallToActionUrl.Trim()));
            }

            using var feedDocument = await SendGraphFormAsync(
                FacebookGraphApiBaseUrl(),
                $"{pageId}/feed",
                accessToken,
                feedPayload,
                cancellationToken);

            var postId = RequireJsonString(feedDocument.RootElement, "id", "Facebook feed publish response did not include an id.");
            return new MetaPublishedPost(
                SocialMediaPlatforms.Facebook,
                postId,
                BuildFacebookPostUrl(postId),
                JsonSerializer.Serialize(new { pageId, mode = "feed" }));
        }

        if (mediaUrls.Count == 1)
        {
            var photoPayload = new List<KeyValuePair<string, string>>
            {
                new("url", mediaUrls[0]),
                new("published", "true"),
                new("caption", caption)
            };

            if (!string.IsNullOrWhiteSpace(request.AltText))
            {
                photoPayload.Add(new("alt_text_custom", request.AltText.Trim()));
            }

            using var photoDocument = await SendGraphFormAsync(
                FacebookGraphApiBaseUrl(),
                $"{pageId}/photos",
                accessToken,
                photoPayload,
                cancellationToken);

            var photoId = RequireJsonString(photoDocument.RootElement, "id", "Facebook photo publish response did not include an id.");
            var postId = TryGetString(photoDocument.RootElement, "post_id") ?? photoId;

            return new MetaPublishedPost(
                SocialMediaPlatforms.Facebook,
                postId,
                BuildFacebookPostUrl(postId),
                JsonSerializer.Serialize(new { pageId, mode = "photo", photoId }));
        }

        var photoIds = new List<string>(mediaUrls.Count);
        foreach (var mediaUrl in mediaUrls)
        {
            var uploadPayload = new List<KeyValuePair<string, string>>
            {
                new("url", mediaUrl),
                new("published", "false"),
                new("temporary", "true")
            };

            if (!string.IsNullOrWhiteSpace(request.AltText))
            {
                uploadPayload.Add(new("alt_text_custom", request.AltText.Trim()));
            }

            using var childPhotoDocument = await SendGraphFormAsync(
                FacebookGraphApiBaseUrl(),
                $"{pageId}/photos",
                accessToken,
                uploadPayload,
                cancellationToken);

            photoIds.Add(RequireJsonString(
                childPhotoDocument.RootElement,
                "id",
                "Facebook carousel upload response did not include a photo id."));
        }

        var carouselPayload = new List<KeyValuePair<string, string>>
        {
            new("message", caption)
        };

        for (var index = 0; index < photoIds.Count; index++)
        {
            carouselPayload.Add(new(
                $"attached_media[{index}]",
                JsonSerializer.Serialize(new { media_fbid = photoIds[index] })));
        }

        using var carouselDocument = await SendGraphFormAsync(
            FacebookGraphApiBaseUrl(),
            $"{pageId}/feed",
            accessToken,
            carouselPayload,
            cancellationToken);

        var carouselPostId = RequireJsonString(
            carouselDocument.RootElement,
            "id",
            "Facebook carousel publish response did not include an id.");

        return new MetaPublishedPost(
            SocialMediaPlatforms.Facebook,
            carouselPostId,
            BuildFacebookPostUrl(carouselPostId),
            JsonSerializer.Serialize(new { pageId, mode = "carousel", photoIds }));
    }

    private async Task<MetaPublishedPost> PublishInstagramAsync(
        MetaPublishRequest request,
        CancellationToken cancellationToken)
    {
        var accessToken = !string.IsNullOrWhiteSpace(_options.InstagramAccessToken)
            ? _options.InstagramAccessToken.Trim()
            : RequireValue(
                _options.FacebookPageAccessToken,
                $"{MetaPublishingOptions.SectionName}:InstagramAccessToken or FacebookPageAccessToken must be configured.");

        var accountId = await ResolveInstagramAccountIdAsync(cancellationToken);
        var mediaUrls = NormalizeMediaUrls(request.MediaUrls);
        var caption = BuildCaptionWithCallToAction(request.Caption, request.CallToActionUrl);
        var normalizedMediaType = request.MediaType.Trim().ToLowerInvariant();

        if (mediaUrls.Count == 0)
        {
            throw new InvalidOperationException("Instagram publishing requires at least one publicly accessible media URL.");
        }

        if (mediaUrls.Count > 10)
        {
            throw new InvalidOperationException("Instagram carousel publishing supports a maximum of 10 media assets.");
        }

        await EnsureInstagramQuotaAsync(accountId, accessToken, cancellationToken);

        string creationId;
        string? metadataJson;

        if (mediaUrls.Count > 1)
        {
            if (normalizedMediaType is "video" or "reel")
            {
                throw new InvalidOperationException(
                    "Instagram carousel publishing in this release expects image assets. Publish reels as a single video URL.");
            }

            var childContainerIds = new List<string>(mediaUrls.Count);
            foreach (var mediaUrl in mediaUrls)
            {
                using var childDocument = await SendGraphFormAsync(
                    InstagramGraphApiBaseUrl(),
                    $"{accountId}/media",
                    accessToken,
                    new[]
                    {
                        new KeyValuePair<string, string>("image_url", mediaUrl),
                        new KeyValuePair<string, string>("is_carousel_item", "true")
                    },
                    cancellationToken);

                childContainerIds.Add(RequireJsonString(
                    childDocument.RootElement,
                    "id",
                    "Instagram carousel child creation did not return an id."));
            }

            using var carouselDocument = await SendGraphFormAsync(
                InstagramGraphApiBaseUrl(),
                $"{accountId}/media",
                accessToken,
                new[]
                {
                    new KeyValuePair<string, string>("media_type", "CAROUSEL"),
                    new KeyValuePair<string, string>("children", string.Join(",", childContainerIds)),
                    new KeyValuePair<string, string>("caption", caption)
                },
                cancellationToken);

            creationId = RequireJsonString(
                carouselDocument.RootElement,
                "id",
                "Instagram carousel container creation did not return an id.");
            metadataJson = JsonSerializer.Serialize(new { accountId, mode = "carousel", childContainerIds, creationId });
        }
        else if (normalizedMediaType is "video" or "reel")
        {
            var mediaType = normalizedMediaType == "reel" ? "REELS" : "VIDEO";

            using var videoDocument = await SendGraphFormAsync(
                InstagramGraphApiBaseUrl(),
                $"{accountId}/media",
                accessToken,
                new[]
                {
                    new KeyValuePair<string, string>("video_url", mediaUrls[0]),
                    new KeyValuePair<string, string>("media_type", mediaType),
                    new KeyValuePair<string, string>("caption", caption)
                },
                cancellationToken);

            creationId = RequireJsonString(
                videoDocument.RootElement,
                "id",
                "Instagram video container creation did not return an id.");
            metadataJson = JsonSerializer.Serialize(new { accountId, mode = mediaType, creationId });
        }
        else
        {
            var imagePayload = new List<KeyValuePair<string, string>>
            {
                new("image_url", mediaUrls[0]),
                new("caption", caption)
            };

            if (!string.IsNullOrWhiteSpace(request.AltText))
            {
                imagePayload.Add(new("alt_text", request.AltText.Trim()));
            }

            using var imageDocument = await SendGraphFormAsync(
                InstagramGraphApiBaseUrl(),
                $"{accountId}/media",
                accessToken,
                imagePayload,
                cancellationToken);

            creationId = RequireJsonString(
                imageDocument.RootElement,
                "id",
                "Instagram image container creation did not return an id.");
            metadataJson = JsonSerializer.Serialize(new { accountId, mode = "IMAGE", creationId });
        }

        await WaitForInstagramContainerReadyAsync(accountId, creationId, accessToken, cancellationToken);

        using var publishDocument = await SendGraphFormAsync(
            InstagramGraphApiBaseUrl(),
            $"{accountId}/media_publish",
            accessToken,
            new[]
            {
                new KeyValuePair<string, string>("creation_id", creationId)
            },
            cancellationToken);

        var publishedMediaId = RequireJsonString(
            publishDocument.RootElement,
            "id",
            "Instagram publish response did not return an id.");
        var postUrl = await TryGetInstagramPermalinkAsync(publishedMediaId, accessToken, cancellationToken);

        return new MetaPublishedPost(
            SocialMediaPlatforms.Instagram,
            publishedMediaId,
            postUrl,
            metadataJson);
    }

    private sealed record FacebookPageContext(string PageId, string AccessToken);

    private async Task<FacebookPageContext> ResolveFacebookPageContextAsync(
        string providedToken,
        CancellationToken cancellationToken)
    {
        var configuredPageId = _options.FacebookPageId?.Trim();

        // 1. Identify the entity represented by this token
        string? currentEntityId;
        try
        {
            using var meDocument = await SendGraphGetAsync(
                FacebookGraphApiBaseUrl(),
                "me",
                providedToken,
                new[] { new KeyValuePair<string, string>("fields", "id") },
                cancellationToken);
            currentEntityId = TryGetString(meDocument.RootElement, "id");
        }
        catch (HttpRequestException)
        {
            // If /me fails, it might be a restricted token or a specialized Page token.
            // We'll proceed to the management check.
            currentEntityId = null;
        }

        // 2. If the token is already for the configured Page, use it directly
        if (!string.IsNullOrWhiteSpace(configuredPageId) && currentEntityId == configuredPageId)
        {
            return new FacebookPageContext(configuredPageId, providedToken);
        }

        // 3. Try to fetch managed pages (User Token flow)
        JsonDocument accountsDocument;
        try
        {
            accountsDocument = await SendGraphGetAsync(
                FacebookGraphApiBaseUrl(),
                "me/accounts",
                providedToken,
                Array.Empty<KeyValuePair<string, string>>(),
                cancellationToken);
        }
        catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.BadRequest)
        {
            // Error 100 or 400 on /me/accounts usually means this IS a Page token but for a different ID than configured,
            // or it's a Page token and the 'accounts' edge is invalid. 
            if (!string.IsNullOrWhiteSpace(configuredPageId))
            {
                return new FacebookPageContext(configuredPageId, providedToken);
            }
            throw;
        }

        using (accountsDocument)
        {
            var pages = accountsDocument.RootElement.GetProperty("data");
            var availablePageIds = new List<string>();

            if (!string.IsNullOrWhiteSpace(configuredPageId))
            {
                foreach (var page in pages.EnumerateArray())
                {
                    var id = page.GetProperty("id").GetString();
                    if (id != null) availablePageIds.Add(id);

                    if (id == configuredPageId)
                    {
                        var pageToken = TryGetString(page, "access_token");
                        if (!string.IsNullOrWhiteSpace(pageToken))
                        {
                            return new FacebookPageContext(id!, pageToken);
                        }
                    }
                }

                // If we found the Page ID but it was represented by the token itself (handled in step 2),
                // or if we have a configured ID but can't find a specialized token, fallback to provided.
                return new FacebookPageContext(configuredPageId, providedToken);
            }

            if (pages.GetArrayLength() > 0)
            {
                var firstPage = pages[0];
                return new FacebookPageContext(
                    firstPage.GetProperty("id").GetString()!,
                    firstPage.GetProperty("access_token").GetString()!);
            }
        }

        // 4. Final Fallback: If we have an ID, try the token. If not, we're stuck.
        if (!string.IsNullOrWhiteSpace(configuredPageId))
        {
            return new FacebookPageContext(configuredPageId, providedToken);
        }

        throw new InvalidOperationException(
            "Could not resolve a Facebook Page context. Ensure you provided a valid Page Access Token or a User Access Token with pages_manage_posts permissions.");
    }

    private async Task<string> ResolveInstagramAccountIdAsync(CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(_options.InstagramAccountId))
        {
            return _options.InstagramAccountId.Trim();
        }

        if (!string.IsNullOrWhiteSpace(_options.FacebookPageId) && !string.IsNullOrWhiteSpace(_options.FacebookPageAccessToken))
        {
            using var pageDocument = await SendGraphGetAsync(
                FacebookGraphApiBaseUrl(),
                _options.FacebookPageId.Trim(),
                _options.FacebookPageAccessToken.Trim(),
                new[]
                {
                    new KeyValuePair<string, string>("fields", "instagram_business_account{id}")
                },
                cancellationToken);

            if (pageDocument.RootElement.TryGetProperty("instagram_business_account", out var businessAccountElement)
                && TryGetString(businessAccountElement, "id") is { Length: > 0 } accountId)
            {
                return accountId;
            }
        }

        if (!string.IsNullOrWhiteSpace(_options.FacebookPageAccessToken))
        {
            using var accountsDocument = await SendGraphGetAsync(
                FacebookGraphApiBaseUrl(),
                "me/accounts",
                _options.FacebookPageAccessToken.Trim(),
                new[]
                {
                    new KeyValuePair<string, string>("fields", "instagram_business_account{id}")
                },
                cancellationToken);

            if (accountsDocument.RootElement.TryGetProperty("data", out var accountsElement)
                && accountsElement.ValueKind == JsonValueKind.Array)
            {
                foreach (var accountElement in accountsElement.EnumerateArray())
                {
                    if (accountElement.TryGetProperty("instagram_business_account", out var businessAccountElement)
                        && TryGetString(businessAccountElement, "id") is { Length: > 0 } accountId)
                    {
                        return accountId;
                    }
                }
            }
        }

        if (!string.IsNullOrWhiteSpace(_options.InstagramAccessToken))
        {
            using var document = await SendGraphGetAsync(
                InstagramGraphApiBaseUrl(),
                "me",
                _options.InstagramAccessToken.Trim(),
                new[]
                {
                    new KeyValuePair<string, string>("fields", "id")
                },
                cancellationToken);

            if (TryGetString(document.RootElement, "id") is { Length: > 0 } accountId)
            {
                return accountId;
            }
        }

        throw new InvalidOperationException(
            $"{MetaPublishingOptions.SectionName}:InstagramAccountId must be configured, or the configured Facebook/Instagram token must be able to resolve an Instagram business account id.");
    }

    private async Task EnsureInstagramQuotaAsync(string accountId, string accessToken, CancellationToken cancellationToken)
    {
        try
        {
            using var quotaDocument = await SendGraphGetAsync(
                InstagramGraphApiBaseUrl(),
                $"{accountId}/content_publishing_limit",
                accessToken,
                new[]
                {
                    new KeyValuePair<string, string>("fields", "quota_usage")
                },
                cancellationToken);

            var quotaUsage = ReadQuotaUsage(quotaDocument.RootElement);
            if (quotaUsage >= 100)
            {
                throw new InvalidOperationException(
                    "Instagram content publishing has reached Meta's documented 100-post rolling 24-hour limit for this account.");
            }
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Instagram publishing limit preflight check failed; continuing without quota enforcement.");
        }
    }

    private static int ReadQuotaUsage(JsonElement rootElement)
    {
        if (TryGetInt(rootElement, "quota_usage") is { } directQuotaUsage)
        {
            return directQuotaUsage;
        }

        if (rootElement.TryGetProperty("data", out var dataElement)
            && dataElement.ValueKind == JsonValueKind.Array
            && dataElement.GetArrayLength() > 0
            && TryGetInt(dataElement[0], "quota_usage") is { } nestedQuotaUsage)
        {
            return nestedQuotaUsage;
        }

        return 0;
    }

    private async Task WaitForInstagramContainerReadyAsync(
        string accountId,
        string creationId,
        string accessToken,
        CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            using var statusDocument = await SendGraphGetAsync(
                InstagramGraphApiBaseUrl(),
                creationId,
                accessToken,
                new[]
                {
                    new KeyValuePair<string, string>("fields", "status_code,status")
                },
                cancellationToken);

            var statusCode = TryGetString(statusDocument.RootElement, "status_code")
                ?? TryGetString(statusDocument.RootElement, "status");

            if (string.IsNullOrWhiteSpace(statusCode)
                || statusCode.Equals("FINISHED", StringComparison.OrdinalIgnoreCase)
                || statusCode.Equals("PUBLISHED", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            if (statusCode.Equals("IN_PROGRESS", StringComparison.OrdinalIgnoreCase)
                || statusCode.Equals("PENDING", StringComparison.OrdinalIgnoreCase))
            {
                await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);
                continue;
            }

            throw new InvalidOperationException(
                $"Instagram media container {creationId} could not be published. Meta returned status '{statusCode}'.");
        }

        throw new InvalidOperationException(
            $"Instagram media container {creationId} did not become ready within the expected polling window.");
    }

    private async Task<string?> TryGetInstagramPermalinkAsync(
        string mediaId,
        string accessToken,
        CancellationToken cancellationToken)
    {
        try
        {
            using var document = await SendGraphGetAsync(
                InstagramGraphApiBaseUrl(),
                mediaId,
                accessToken,
                new[]
                {
                    new KeyValuePair<string, string>("fields", "permalink")
                },
                cancellationToken);

            return TryGetString(document.RootElement, "permalink");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Instagram permalink lookup failed for media {MediaId}.", mediaId);
            return null;
        }
    }

    private async Task<JsonDocument> SendGraphGetAsync(
        string baseUrl,
        string path,
        string accessToken,
        IEnumerable<KeyValuePair<string, string>> queryParameters,
        CancellationToken cancellationToken)
    {
        return await SendGraphAsync(
            baseUrl,
            HttpMethod.Get,
            path,
            accessToken,
            queryParameters,
            null,
            cancellationToken);
    }

    private async Task<JsonDocument> SendGraphFormAsync(
        string baseUrl,
        string path,
        string accessToken,
        IEnumerable<KeyValuePair<string, string>> formParameters,
        CancellationToken cancellationToken)
    {
        // For POST requests, including the access_token in the body is often more compatible
        var bodyParams = new List<KeyValuePair<string, string>>(formParameters);
        if (!bodyParams.Any(p => p.Key == "access_token"))
        {
            bodyParams.Add(new KeyValuePair<string, string>("access_token", accessToken));
        }

        return await SendGraphAsync(
            baseUrl,
            HttpMethod.Post,
            path,
            accessToken,
            null,
            bodyParams,
            cancellationToken);
    }

    private async Task<JsonDocument> SendGraphAsync(
        string baseUrl,
        HttpMethod method,
        string path,
        string accessToken,
        IEnumerable<KeyValuePair<string, string>>? queryParameters,
        IEnumerable<KeyValuePair<string, string>>? formParameters,
        CancellationToken cancellationToken)
    {
        using var client = _httpClientFactory.CreateClient(HttpClientName);
        
        // Build the URI with the access_token as a query parameter (more reliable for some Graph edges)
        var uri = BuildRequestUri(baseUrl, path, queryParameters, accessToken);
        using var request = new HttpRequestMessage(method, uri);

        if (formParameters is not null)
        {
            request.Content = new FormUrlEncodedContent(
                formParameters.Where(parameter => !string.IsNullOrWhiteSpace(parameter.Value)));
        }

        using var response = await client.SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var message = TryReadGraphError(responseBody)
                ?? $"Meta Graph API request to '{path}' failed with {(int)response.StatusCode}.";
            throw new HttpRequestException(message, null, response.StatusCode);
        }

        return JsonDocument.Parse(string.IsNullOrWhiteSpace(responseBody) ? "{}" : responseBody);
    }

    private static string BuildRequestUri(
        string baseUrl,
        string path,
        IEnumerable<KeyValuePair<string, string>>? queryParameters,
        string? accessToken = null)
    {
        var builder = new UriBuilder($"{baseUrl.TrimEnd('/')}/{path.TrimStart('/')}");
        
        var allParameters = new List<KeyValuePair<string, string>>();
        if (queryParameters is not null)
        {
            allParameters.AddRange(queryParameters);
        }
        
        if (!string.IsNullOrWhiteSpace(accessToken))
        {
            allParameters.Add(new KeyValuePair<string, string>("access_token", accessToken));
        }

        if (allParameters.Count == 0)
        {
            return builder.Uri.ToString();
        }

        var query = string.Join(
            "&",
            allParameters
                .Where(parameter => !string.IsNullOrWhiteSpace(parameter.Value))
                .Select(parameter =>
                    $"{Uri.EscapeDataString(parameter.Key)}={Uri.EscapeDataString(parameter.Value)}"));

        builder.Query = query;
        return builder.Uri.ToString();
    }

    private static string? TryReadGraphError(string responseBody)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(responseBody);
            if (document.RootElement.TryGetProperty("error", out var errorElement))
            {
                var message = TryGetString(errorElement, "message");
                var code = TryGetInt(errorElement, "code");
                return code is null
                    ? message
                    : $"{message} (Meta error {code.Value}).";
            }
        }
        catch (JsonException)
        {
            return responseBody;
        }

        return responseBody;
    }

    private static IReadOnlyList<string> NormalizeMediaUrls(IReadOnlyCollection<string> mediaUrls)
    {
        var normalized = mediaUrls
            .Where(url => !string.IsNullOrWhiteSpace(url))
            .Select(url => url.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        foreach (var mediaUrl in normalized)
        {
            if (!Uri.TryCreate(mediaUrl, UriKind.Absolute, out var uri)
                || (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp))
            {
                throw new InvalidOperationException(
                    $"Media URL '{mediaUrl}' must be an absolute http(s) URL that Meta can retrieve publicly.");
            }
        }

        return normalized;
    }

    private static string BuildCaptionWithCallToAction(string caption, string? callToActionUrl)
    {
        var trimmedCaption = caption.Trim();
        if (string.IsNullOrWhiteSpace(callToActionUrl))
        {
            return trimmedCaption;
        }

        return $"{trimmedCaption}\n\n{callToActionUrl.Trim()}";
    }

    private static string BuildFacebookPostUrl(string postId)
    {
        return $"https://www.facebook.com/{postId}";
    }

    private string FacebookGraphApiBaseUrl()
    {
        return $"https://graph.facebook.com/{_options.GraphApiVersion.Trim('/')}";
    }

    private string InstagramGraphApiBaseUrl()
    {
        return $"https://graph.instagram.com/{_options.GraphApiVersion.Trim('/')}";
    }

    private static string RequireValue(string? value, string message)
    {
        return !string.IsNullOrWhiteSpace(value) ? value.Trim() : throw new InvalidOperationException(message);
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

    private static string RequireJsonString(JsonElement element, string propertyName, string errorMessage)
    {
        return TryGetString(element, propertyName) ?? throw new InvalidOperationException(errorMessage);
    }

    private static string? TryGetString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var propertyElement))
        {
            return null;
        }

        return propertyElement.ValueKind == JsonValueKind.String
            ? propertyElement.GetString()
            : propertyElement.ToString();
    }

    private static int? TryGetInt(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var propertyElement))
        {
            return null;
        }

        if (propertyElement.ValueKind == JsonValueKind.Number && propertyElement.TryGetInt32(out var intValue))
        {
            return intValue;
        }

        if (propertyElement.ValueKind == JsonValueKind.String
            && int.TryParse(propertyElement.GetString(), out intValue))
        {
            return intValue;
        }

        return null;
    }
}
