namespace INTEX_W2026_Group_2_7.Data;

public sealed class ReintegrationReadinessPrediction
{
    public Guid RunId { get; set; }

    public int ResidentId { get; set; }

    public double ReadinessScore { get; set; }

    public string ReadinessCategory { get; set; } = string.Empty;

    public bool PredictedReady { get; set; }

    public string ModelVersion { get; set; } = string.Empty;

    public DateTimeOffset ScoredAt { get; set; }
}
