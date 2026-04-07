namespace INTEX_W2026_Group_2_7.Models.Ml;

public sealed record ResidentRiskPredictionResponse(
    int ResidentId,
    string PredictedRisk,
    int PredictedRiskNum,
    bool FlagForReview,
    string ModelVersion,
    DateTimeOffset ScoredAt);
