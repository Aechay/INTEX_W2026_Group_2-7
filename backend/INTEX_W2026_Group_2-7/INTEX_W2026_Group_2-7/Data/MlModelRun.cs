namespace INTEX_W2026_Group_2_7.Data;

public sealed class MlModelRun
{
    public Guid RunId { get; set; }

    public string ModelName { get; set; } = string.Empty;

    public string ModelVersion { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTimeOffset StartedAt { get; set; }

    public DateTimeOffset? CompletedAt { get; set; }

    public string MetricsJson { get; set; } = "{}";

    public string ArtifactUri { get; set; } = string.Empty;
}
