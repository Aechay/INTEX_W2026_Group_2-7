using System.Net;
using System.Net.Http.Json;
using INTEX_W2026_Group_2_7.Data;
using INTEX_W2026_Group_2_7.Models.SocialMedia;
using INTEX_W2026_Group_2_7.Services.SocialMedia;
using INTEX_W2026_Group_2_7.Tests.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace INTEX_W2026_Group_2_7.Tests;

public class SocialMediaApiTests
{
    [Fact]
    public async Task SocialMediaPosts_ReturnNewestPostsFirst_WithPagination()
    {
        await using var factory = new TestWebApplicationFactory();
        await factory.WithScopeAsync(async services =>
        {
            var dbContext = services.GetRequiredService<OperationalDbContext>();
            dbContext.SocialMediaPosts.AddRange(
                new SocialMediaPost
                {
                    PostId = 1,
                    Platform = SocialMediaPlatforms.Instagram,
                    PlatformPostId = "ig-older",
                    PostUrl = "https://instagram.com/p/older",
                    PublishStatus = SocialMediaPublishStatuses.Published,
                    CreatedAt = new DateTime(2026, 4, 1, 8, 0, 0, DateTimeKind.Utc),
                    PublishedAtUtc = new DateTime(2026, 4, 1, 8, 0, 0, DateTimeKind.Utc),
                    DayOfWeek = "Tuesday",
                    PostHour = 8,
                    PostType = "ImpactStory",
                    MediaType = "Photo",
                    Caption = "Older post",
                    ContentTopic = "Health",
                    SentimentTone = "Hopeful",
                    CaptionLength = 10
                },
                new SocialMediaPost
                {
                    PostId = 2,
                    Platform = SocialMediaPlatforms.Facebook,
                    PlatformPostId = "fb-newer",
                    PostUrl = "https://facebook.com/fb-newer",
                    PublishStatus = SocialMediaPublishStatuses.Published,
                    CreatedAt = new DateTime(2026, 4, 2, 9, 0, 0, DateTimeKind.Utc),
                    PublishedAtUtc = new DateTime(2026, 4, 2, 9, 0, 0, DateTimeKind.Utc),
                    DayOfWeek = "Wednesday",
                    PostHour = 9,
                    PostType = "Appeal",
                    MediaType = "Carousel",
                    Caption = "Newer post",
                    ContentTopic = "SafehouseLife",
                    SentimentTone = "Emotional",
                    CaptionLength = 10
                });

            await dbContext.SaveChangesAsync();
            return 0;
        });

        using var client = await factory.CreateAuthenticatedClientAsync("admin@test.local", "AdminPassword123!");
        var response = await client.GetFromJsonAsync<SocialMediaPostsPageResponse>(
            "/api/admin/social-media/posts?page=1&pageSize=5");

        Assert.NotNull(response);
        Assert.Equal(2, response!.TotalCount);
        Assert.Equal(2, response.Posts.Count);
        Assert.Equal(2, response.Posts.First().PostId);
        Assert.Equal(1, response.TotalPages);
    }

    [Fact]
    public async Task SocialMediaPost_ManualCrud_Works()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = await factory.CreateAuthenticatedClientAsync("admin@test.local", "AdminPassword123!");

        var createResponse = await client.PostAsJsonAsync("/api/admin/social-media/posts", new SocialMediaPostUpsertRequest(
            SocialMediaPlatforms.Facebook,
            new DateTime(2026, 4, 8, 14, 0, 0, DateTimeKind.Utc),
            "ImpactStory",
            "Photo",
            "A recorded social post #hope #give @hope",
            null,
            0,
            true,
            "Donate",
            "https://example.org/donate",
            "Health",
            "Emotional",
            true,
            "Spring Drive",
            false,
            null,
            5400,
            null,
            null,
            "Alt text",
            new[] { "https://cdn.example.org/story.jpg" },
            100,
            90,
            20,
            4,
            3,
            2,
            5,
            null,
            null,
            11,
            3,
            900m,
            null,
            null,
            null,
            null,
            1800m,
            "model-v1",
            new DateTimeOffset(2026, 4, 8, 14, 0, 0, TimeSpan.Zero)));

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var createdPost = await createResponse.Content.ReadFromJsonAsync<SocialMediaPostDetailDto>();

        Assert.NotNull(createdPost);
        Assert.Equal(SocialMediaPublishStatuses.Recorded, createdPost!.PublishStatus);
        Assert.Equal(2, createdPost.NumHashtags);
        Assert.Equal(1800m, createdPost.PredictedDonationValuePhp);

        var updateResponse = await client.PutAsJsonAsync(
            $"/api/admin/social-media/posts/{createdPost.PostId}",
            new SocialMediaPostUpsertRequest(
                createdPost.Platform,
                createdPost.CreatedAt,
                createdPost.PostType,
                createdPost.MediaType,
                createdPost.Caption,
                createdPost.Hashtags,
                createdPost.MentionsCount,
                createdPost.HasCallToAction,
                createdPost.CallToActionType,
                createdPost.CallToActionUrl,
                createdPost.ContentTopic,
                createdPost.SentimentTone,
                createdPost.FeaturesResidentStory,
                createdPost.CampaignName,
                createdPost.IsBoosted,
                createdPost.BoostBudgetPhp,
                createdPost.FollowerCountAtPost,
                "fb-12345",
                "https://facebook.com/fb-12345",
                createdPost.AltText,
                createdPost.MediaUrls.ToArray(),
                250,
                200,
                45,
                8,
                7,
                6,
                12,
                null,
                null,
                28,
                14,
                2200m,
                null,
                null,
                null,
                null,
                createdPost.PredictedDonationValuePhp,
                createdPost.PredictionModelVersion,
                createdPost.PredictionScoredAtUtc));

        updateResponse.EnsureSuccessStatusCode();
        var updatedPost = await updateResponse.Content.ReadFromJsonAsync<SocialMediaPostDetailDto>();

        Assert.NotNull(updatedPost);
        Assert.Equal(SocialMediaPublishStatuses.Published, updatedPost!.PublishStatus);
        Assert.Equal("fb-12345", updatedPost.PlatformPostId);
        Assert.Equal(200, updatedPost.Reach);
        Assert.Equal(2200m, updatedPost.EstimatedDonationValuePhp);

        var deleteResponse = await client.DeleteAsync($"/api/admin/social-media/posts/{createdPost.PostId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getDeletedResponse = await client.GetAsync($"/api/admin/social-media/posts/{createdPost.PostId}");
        Assert.Equal(HttpStatusCode.NotFound, getDeletedResponse.StatusCode);
    }

    [Fact]
    public async Task SocialMediaPublish_CreatesPlatformPosts_ForEachRequestedPlatform()
    {
        var stubPublisher = new StubMetaPublishingService();
        var stubAssetStorage = new StubSocialMediaAssetStorage();
        await using var factory = new TestWebApplicationFactory(services =>
        {
            services.RemoveAll<IMetaPublishingService>();
            services.AddScoped<IMetaPublishingService>(_ => stubPublisher);
            services.RemoveAll<ISocialMediaAssetStorage>();
            services.AddSingleton<ISocialMediaAssetStorage>(stubAssetStorage);
        });

        using var client = await factory.CreateAuthenticatedClientAsync("admin@test.local", "AdminPassword123!");
        var publishResponse = await client.PostAsJsonAsync("/api/admin/social-media/posts/publish", new SocialMediaPublishRequest(
            new[] { SocialMediaPlatforms.Instagram, SocialMediaPlatforms.Facebook },
            "ImpactStory",
            "Photo",
            "Publish this story",
            "#hope",
            2,
            true,
            "Donate",
            "https://example.org/donate",
            "Health",
            "Urgent",
            true,
            "April Drive",
            false,
            null,
            8700,
            "Alt text for screen readers",
            new[] { "https://cdn.example.org/story.jpg" },
            new[] { "temp-image-1", "temp-image-2" },
            2500m,
            "social-model-v2",
            new DateTimeOffset(2026, 4, 8, 16, 0, 0, TimeSpan.Zero)));

        publishResponse.EnsureSuccessStatusCode();
        var payload = await publishResponse.Content.ReadFromJsonAsync<SocialMediaPublishResponse>();

        Assert.NotNull(payload);
        Assert.Empty(payload!.Failures);
        Assert.Equal(2, payload.PublishedPosts.Count);
        Assert.Contains(payload.PublishedPosts, post => post.Platform == SocialMediaPlatforms.Instagram);
        Assert.Contains(payload.PublishedPosts, post => post.Platform == SocialMediaPlatforms.Facebook);
        Assert.Equal(2, stubPublisher.Requests.Count);
        Assert.Equal(["temp-image-1", "temp-image-2"], stubAssetStorage.DeletedAssetIds);
    }

    private sealed class StubMetaPublishingService : IMetaPublishingService
    {
        public List<MetaPublishRequest> Requests { get; } = [];

        public Task<MetaPublishedPost> PublishAsync(MetaPublishRequest request, CancellationToken cancellationToken)
        {
            Requests.Add(request);

            var prefix = request.Platform == SocialMediaPlatforms.Instagram ? "ig" : "fb";
            return Task.FromResult(new MetaPublishedPost(
                request.Platform,
                $"{prefix}-post-{Requests.Count}",
                $"https://example.org/{prefix}/post-{Requests.Count}",
                $"{{\"platform\":\"{request.Platform}\"}}"));
        }
    }

    private sealed class StubSocialMediaAssetStorage : ISocialMediaAssetStorage
    {
        public List<string> DeletedAssetIds { get; } = [];

        public Task<Models.SocialMedia.SocialMediaUploadedAssetDto> SaveImageAsync(
            IFormFile file,
            Uri publicBaseUri,
            CancellationToken cancellationToken)
        {
            throw new NotSupportedException();
        }

        public Task DeleteAssetsAsync(IEnumerable<string> assetIds, CancellationToken cancellationToken)
        {
            DeletedAssetIds.AddRange(assetIds);
            return Task.CompletedTask;
        }
    }
}
