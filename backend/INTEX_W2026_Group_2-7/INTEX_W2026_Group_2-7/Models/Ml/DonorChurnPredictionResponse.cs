namespace INTEX_W2026_Group_2_7.Models.Ml;

public sealed record DonorChurnPredictionResponse(
    int DonorId,
    double RiskScore,
    string RiskBand,
    string ModelVersion,
    DateTimeOffset ScoredAt);
