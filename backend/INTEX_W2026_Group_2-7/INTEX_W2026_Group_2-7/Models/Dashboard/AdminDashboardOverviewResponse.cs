namespace INTEX_W2026_Group_2_7.Models.Dashboard;

public sealed record AdminDashboardOverviewResponse(
    DateTime GeneratedAt,
    DashboardSummaryResponse Summary,
    DashboardProgressSnapshotResponse ProgressSnapshot,
    IReadOnlyCollection<SafehouseOccupancyResponse> Safehouses,
    IReadOnlyCollection<DashboardProgressTrendPointResponse> ProgressTrend,
    IReadOnlyCollection<DashboardRecentDonationResponse> RecentDonations,
    DashboardConferenceQueueResponse ConferenceQueue);

public sealed record DashboardSummaryResponse(
    int ActiveResidents,
    int TotalCapacity,
    int AvailableBeds,
    int ActiveSafehouses,
    decimal RecentDonationTotal,
    int RecentDonationCount,
    int RecentIncidentCount,
    int UpcomingCaseConferenceCount,
    int OverdueCaseConferenceCount);

public sealed record DashboardProgressSnapshotResponse(
    DateTime? MonthStart,
    decimal? AvgEducationProgress,
    decimal? AvgHealthScore,
    int ProcessRecordingCount,
    int HomeVisitationCount,
    int IncidentCount);

public sealed record SafehouseOccupancyResponse(
    int SafehouseId,
    string SafehouseCode,
    string Name,
    string Region,
    int CurrentOccupancy,
    int Capacity,
    decimal UtilizationRate,
    int AvailableBeds);

public sealed record DashboardProgressTrendPointResponse(
    DateTime MonthStart,
    decimal? AvgEducationProgress,
    decimal? AvgHealthScore);

public sealed record DashboardRecentDonationResponse(
    int DonationId,
    string SupporterName,
    string? SupporterEmail,
    string DonationType,
    string ChannelSource,
    DateTime DonationDate,
    decimal EstimatedValue,
    string ImpactUnit);

public sealed record DashboardConferenceQueueResponse(
    int UpcomingCount,
    int OverdueCount,
    IReadOnlyCollection<DashboardCaseConferenceResponse> Highlights);

public sealed record DashboardCaseConferenceResponse(
    int PlanId,
    string ResidentCode,
    string PlanCategory,
    string SafehouseName,
    string AssignedSocialWorker,
    DateTime CaseConferenceDate,
    string Status,
    int DaysFromToday);
