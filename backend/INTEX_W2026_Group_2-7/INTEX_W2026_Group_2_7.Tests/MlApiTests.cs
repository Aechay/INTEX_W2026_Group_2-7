using System.Net;
using System.Net.Http.Json;
using INTEX_W2026_Group_2_7.Data;
using INTEX_W2026_Group_2_7.Models.Ml;
using INTEX_W2026_Group_2_7.Services.Ml;
using INTEX_W2026_Group_2_7.Tests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace INTEX_W2026_Group_2_7.Tests;

public class MlApiTests
{
    [Fact]
    public async Task SocialMediaPredict_ReturnsProxyPayload_ForAdminUser()
    {
        var stubClient = new StubSocialMediaInferenceClient();
        await using var factory = new TestWebApplicationFactory(services =>
        {
            services.RemoveAll<ISocialMediaInferenceClient>();
            services.AddScoped<ISocialMediaInferenceClient>(_ => stubClient);
        });

        using var client = await factory.CreateAuthenticatedClientAsync("admin@test.local", "AdminPassword123!");
        var response = await client.PostAsJsonAsync("/api/admin/ml/social-media/predict", new
        {
            platform = "Facebook",
            postType = "ImpactStory",
            mediaType = "Photo",
            contentTopic = "DonorImpact",
            sentimentTone = "Hopeful",
            timeBucket = "Morning",
            captionLength = 120,
            numHashtags = 3,
            mentionsCount = 1,
            isCta = 1,
            isStory = 1,
            isBoostedFlag = 0,
            followerCountAtPost = 5000,
            isWeekend = 0,
            postHour = 10
        });

        response.EnsureSuccessStatusCode();
        var payload = await response.Content.ReadFromJsonAsync<SocialMediaPredictionResponse>();

        Assert.NotNull(payload);
        Assert.Equal(8450.50m, payload!.PredictedDonationPhp);
        Assert.Equal("social-media-20260407T000000Z", payload.ModelVersion);
        Assert.NotNull(stubClient.LastRequest);
        Assert.Equal("Facebook", stubClient.LastRequest!.Platform);
    }

    [Fact]
    public async Task SocialMediaPredict_ReturnsValidationProblem_ForInvalidPayload()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = await factory.CreateAuthenticatedClientAsync("admin@test.local", "AdminPassword123!");

        var response = await client.PostAsJsonAsync("/api/admin/ml/social-media/predict", new
        {
            platform = "",
            postType = "ImpactStory",
            mediaType = "Photo",
            contentTopic = "DonorImpact",
            sentimentTone = "Hopeful",
            timeBucket = "Morning",
            captionLength = -1,
            numHashtags = 3,
            mentionsCount = 1,
            isCta = 2,
            isStory = 1,
            isBoostedFlag = 0,
            followerCountAtPost = 5000,
            isWeekend = 0,
            postHour = 29
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CurrentPredictionEndpoints_ReturnLatestSnapshots()
    {
        await using var factory = new TestWebApplicationFactory();
        await factory.WithScopeAsync(async services =>
        {
            var dbContext = services.GetRequiredService<OperationalDbContext>();
            var olderRun = Guid.NewGuid();
            var latestRun = Guid.NewGuid();

            dbContext.DonorChurnPredictions.AddRange(
                new DonorChurnPrediction
                {
                    RunId = olderRun,
                    DonorId = 1,
                    RiskScore = 0.10,
                    RiskBand = "Low",
                    ModelVersion = "older",
                    ScoredAt = new DateTimeOffset(2026, 4, 6, 1, 0, 0, TimeSpan.Zero)
                },
                new DonorChurnPrediction
                {
                    RunId = latestRun,
                    DonorId = 1,
                    RiskScore = 0.85,
                    RiskBand = "High",
                    ModelVersion = "latest",
                    ScoredAt = new DateTimeOffset(2026, 4, 7, 1, 0, 0, TimeSpan.Zero)
                });

            dbContext.ResidentRiskPredictions.AddRange(
                new ResidentRiskPrediction
                {
                    RunId = olderRun,
                    ResidentId = 10,
                    PredictedRisk = "Medium",
                    PredictedRiskNum = 1,
                    FlagForReview = false,
                    ModelVersion = "older",
                    ScoredAt = new DateTimeOffset(2026, 4, 6, 1, 0, 0, TimeSpan.Zero)
                },
                new ResidentRiskPrediction
                {
                    RunId = latestRun,
                    ResidentId = 10,
                    PredictedRisk = "Critical",
                    PredictedRiskNum = 3,
                    FlagForReview = true,
                    ModelVersion = "latest",
                    ScoredAt = new DateTimeOffset(2026, 4, 7, 1, 0, 0, TimeSpan.Zero)
                });

            await dbContext.SaveChangesAsync();
            return 0;
        });

        using var client = await factory.CreateAuthenticatedClientAsync("admin@test.local", "AdminPassword123!");

        var donorResponse = await client.GetFromJsonAsync<DonorChurnPredictionResponse[]>(
            "/api/admin/ml/donor-churn/current");
        var residentResponse = await client.GetFromJsonAsync<ResidentRiskPredictionResponse[]>(
            "/api/admin/ml/resident-risk/current");

        Assert.NotNull(donorResponse);
        Assert.Single(donorResponse!);
        Assert.Equal("latest", donorResponse[0].ModelVersion);
        Assert.Equal(0.85, donorResponse[0].RiskScore, 6);

        Assert.NotNull(residentResponse);
        Assert.Single(residentResponse!);
        Assert.Equal("Critical", residentResponse[0].PredictedRisk);
        Assert.True(residentResponse[0].FlagForReview);
    }

    private sealed class StubSocialMediaInferenceClient : ISocialMediaInferenceClient
    {
        public SocialMediaPredictionRequest? LastRequest { get; private set; }

        public Task<SocialMediaPredictionResponse> PredictAsync(
            SocialMediaPredictionRequest request,
            CancellationToken cancellationToken)
        {
            LastRequest = request;

            return Task.FromResult(
                new SocialMediaPredictionResponse(
                    8450.50m,
                    "social-media-20260407T000000Z",
                    new DateTimeOffset(2026, 4, 7, 12, 0, 0, TimeSpan.Zero)));
        }
    }
}
