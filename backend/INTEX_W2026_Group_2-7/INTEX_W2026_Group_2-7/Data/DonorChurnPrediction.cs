namespace INTEX_W2026_Group_2_7.Data;

public sealed class DonorChurnPrediction
{
    public Guid RunId { get; set; }

    public int DonorId { get; set; }

    public double RiskScore { get; set; }

    public string RiskBand { get; set; } = string.Empty;

    public string ModelVersion { get; set; } = string.Empty;

    public DateTimeOffset ScoredAt { get; set; }
}
