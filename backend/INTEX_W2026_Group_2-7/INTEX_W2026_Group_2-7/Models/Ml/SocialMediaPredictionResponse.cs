namespace INTEX_W2026_Group_2_7.Models.Ml;

public sealed record SocialMediaPredictionResponse(
    decimal PredictedDonationPhp,
    string ModelVersion,
    DateTimeOffset ScoredAt);
