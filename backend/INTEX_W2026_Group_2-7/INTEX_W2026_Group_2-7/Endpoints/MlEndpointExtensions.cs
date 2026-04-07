using INTEX_W2026_Group_2_7.Auth;
using INTEX_W2026_Group_2_7.Data;
using INTEX_W2026_Group_2_7.Models.Ml;
using INTEX_W2026_Group_2_7.Services.Ml;
using Microsoft.EntityFrameworkCore;

namespace INTEX_W2026_Group_2_7.Endpoints;

public static class MlEndpointExtensions
{
    public static IEndpointRouteBuilder MapMlEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/admin/ml")
            .RequireAuthorization(AppPolicies.AdminOnly);

        group.MapPost("/social-media/predict", PredictSocialMediaAsync)
            .WithName("AdminSocialMediaPredict")
            .Produces<SocialMediaPredictionResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status502BadGateway);

        group.MapGet("/donor-churn/current", GetCurrentDonorChurnPredictionsAsync)
            .WithName("GetCurrentDonorChurnPredictions")
            .Produces<IReadOnlyCollection<DonorChurnPredictionResponse>>();

        group.MapGet("/resident-risk/current", GetCurrentResidentRiskPredictionsAsync)
            .WithName("GetCurrentResidentRiskPredictions")
            .Produces<IReadOnlyCollection<ResidentRiskPredictionResponse>>();

        return endpoints;
    }

    private static async Task<IResult> PredictSocialMediaAsync(
        SocialMediaPredictionRequest request,
        ISocialMediaInferenceClient inferenceClient,
        CancellationToken cancellationToken)
    {
        var validationErrors = Validate(request);
        if (validationErrors.Count > 0)
        {
            return Results.ValidationProblem(validationErrors);
        }

        try
        {
            var response = await inferenceClient.PredictAsync(request, cancellationToken);
            return Results.Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return Results.Problem(ex.Message, statusCode: StatusCodes.Status500InternalServerError);
        }
        catch (HttpRequestException ex)
        {
            return Results.Problem(
                ex.Message,
                statusCode: StatusCodes.Status502BadGateway);
        }
    }

    private static async Task<IResult> GetCurrentDonorChurnPredictionsAsync(
        OperationalDbContext dbContext,
        int? take,
        CancellationToken cancellationToken)
    {
        var latestScoredAt = await dbContext.DonorChurnPredictions
            .MaxAsync(prediction => (DateTimeOffset?)prediction.ScoredAt, cancellationToken);

        if (latestScoredAt is null)
        {
            return Results.Ok(Array.Empty<DonorChurnPredictionResponse>());
        }

        var rows = await dbContext.DonorChurnPredictions
            .Where(prediction => prediction.ScoredAt == latestScoredAt)
            .OrderByDescending(prediction => prediction.RiskScore)
            .Take(Math.Clamp(take.GetValueOrDefault(100), 1, 500))
            .Select(prediction => new DonorChurnPredictionResponse(
                prediction.DonorId,
                prediction.RiskScore,
                prediction.RiskBand,
                prediction.ModelVersion,
                prediction.ScoredAt))
            .ToArrayAsync(cancellationToken);

        return Results.Ok(rows);
    }

    private static async Task<IResult> GetCurrentResidentRiskPredictionsAsync(
        OperationalDbContext dbContext,
        int? take,
        CancellationToken cancellationToken)
    {
        var latestScoredAt = await dbContext.ResidentRiskPredictions
            .MaxAsync(prediction => (DateTimeOffset?)prediction.ScoredAt, cancellationToken);

        if (latestScoredAt is null)
        {
            return Results.Ok(Array.Empty<ResidentRiskPredictionResponse>());
        }

        var rows = await dbContext.ResidentRiskPredictions
            .Where(prediction => prediction.ScoredAt == latestScoredAt)
            .OrderByDescending(prediction => prediction.PredictedRiskNum)
            .Take(Math.Clamp(take.GetValueOrDefault(100), 1, 500))
            .Select(prediction => new ResidentRiskPredictionResponse(
                prediction.ResidentId,
                prediction.PredictedRisk,
                prediction.PredictedRiskNum,
                prediction.FlagForReview,
                prediction.ModelVersion,
                prediction.ScoredAt))
            .ToArrayAsync(cancellationToken);

        return Results.Ok(rows);
    }

    private static Dictionary<string, string[]> Validate(SocialMediaPredictionRequest request)
    {
        var errors = new Dictionary<string, string[]>(StringComparer.Ordinal);

        ValidateRequiredString(nameof(request.Platform), request.Platform, errors);
        ValidateRequiredString(nameof(request.PostType), request.PostType, errors);
        ValidateRequiredString(nameof(request.MediaType), request.MediaType, errors);
        ValidateRequiredString(nameof(request.ContentTopic), request.ContentTopic, errors);
        ValidateRequiredString(nameof(request.SentimentTone), request.SentimentTone, errors);
        ValidateRequiredString(nameof(request.TimeBucket), request.TimeBucket, errors);
        ValidateNonNegative(nameof(request.CaptionLength), request.CaptionLength, errors);
        ValidateNonNegative(nameof(request.NumHashtags), request.NumHashtags, errors);
        ValidateNonNegative(nameof(request.MentionsCount), request.MentionsCount, errors);
        ValidateBinary(nameof(request.IsCta), request.IsCta, errors);
        ValidateBinary(nameof(request.IsStory), request.IsStory, errors);
        ValidateBinary(nameof(request.IsBoostedFlag), request.IsBoostedFlag, errors);
        ValidateNonNegative(nameof(request.FollowerCountAtPost), request.FollowerCountAtPost, errors);
        ValidateBinary(nameof(request.IsWeekend), request.IsWeekend, errors);

        if (request.PostHour is < 0 or > 23)
        {
            errors[nameof(request.PostHour)] = ["PostHour must be between 0 and 23."];
        }

        return errors;
    }

    private static void ValidateRequiredString(
        string fieldName,
        string? value,
        IDictionary<string, string[]> errors)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            errors[fieldName] = [$"{fieldName} is required."];
        }
    }

    private static void ValidateNonNegative(
        string fieldName,
        int value,
        IDictionary<string, string[]> errors)
    {
        if (value < 0)
        {
            errors[fieldName] = [$"{fieldName} must be non-negative."];
        }
    }

    private static void ValidateBinary(
        string fieldName,
        int value,
        IDictionary<string, string[]> errors)
    {
        if (value is not 0 and not 1)
        {
            errors[fieldName] = [$"{fieldName} must be either 0 or 1."];
        }
    }
}
