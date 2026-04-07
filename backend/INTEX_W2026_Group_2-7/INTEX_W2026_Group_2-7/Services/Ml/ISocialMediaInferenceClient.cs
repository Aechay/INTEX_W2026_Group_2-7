using INTEX_W2026_Group_2_7.Models.Ml;

namespace INTEX_W2026_Group_2_7.Services.Ml;

public interface ISocialMediaInferenceClient
{
    Task<SocialMediaPredictionResponse> PredictAsync(
        SocialMediaPredictionRequest request,
        CancellationToken cancellationToken);
}
