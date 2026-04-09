using INTEX_W2026_Group_2_7.Auth;
using INTEX_W2026_Group_2_7.Data;
using INTEX_W2026_Group_2_7.Models.Dashboard;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace INTEX_W2026_Group_2_7.Endpoints;

public static class AdminDashboardEndpointExtensions
{
    private const int RecentDonationWindowDays = 90;
    private const int RecentIncidentWindowDays = 30;

    public static IEndpointRouteBuilder MapAdminDashboardEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/admin/dashboard/overview", GetDashboardOverviewAsync)
            .WithName("GetAdminDashboardOverview")
            .RequireAuthorization(AppPolicies.AdminOnly)
            .Produces<AdminDashboardOverviewResponse>();

        return endpoints;
    }

    private static async Task<Ok<AdminDashboardOverviewResponse>> GetDashboardOverviewAsync(
        OperationalDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;
        var recentDonationStart = today.AddDays(-(RecentDonationWindowDays - 1));
        var recentIncidentStart = today.AddDays(-(RecentIncidentWindowDays - 1));

        var safehouseRows = await dbContext.Safehouses
            .AsNoTracking()
            .Where(safehouse => safehouse.Status == "Active")
            .OrderBy(safehouse => safehouse.Name)
            .Select(safehouse => new
            {
                safehouse.SafehouseId,
                safehouse.SafehouseCode,
                safehouse.Name,
                safehouse.Region,
                safehouse.CurrentOccupancy,
                safehouse.CapacityGirls
            })
            .ToListAsync(cancellationToken);

        var safehouses = safehouseRows
            .Select(safehouse =>
            {
                var capacity = Math.Max(safehouse.CapacityGirls, 0);
                var currentOccupancy = Math.Max(safehouse.CurrentOccupancy, 0);
                var availableBeds = Math.Max(capacity - currentOccupancy, 0);
                var utilizationRate = capacity == 0
                    ? 0
                    : decimal.Round((decimal)currentOccupancy / capacity, 3);

                return new SafehouseOccupancyResponse(
                    safehouse.SafehouseId,
                    safehouse.SafehouseCode,
                    safehouse.Name,
                    safehouse.Region,
                    currentOccupancy,
                    capacity,
                    utilizationRate,
                    availableBeds);
            })
            .OrderBy(safehouse => safehouse.Name)
            .ThenBy(safehouse => safehouse.SafehouseId)
            .ToArray();

        var progressTrendRows = await dbContext.SafehouseMonthlyMetrics
            .AsNoTracking()
            .Where(metric => metric.MonthStart <= today)
            .GroupBy(metric => new { metric.MonthStart, metric.MonthEnd })
            .Select(group => new
            {
                group.Key.MonthStart,
                AvgEducationProgress = group.Average(metric => metric.AvgEducationProgress),
                AvgHealthScore = group.Average(metric => metric.AvgHealthScore),
                ProcessRecordingCount = group.Sum(metric => metric.ProcessRecordingCount),
                HomeVisitationCount = group.Sum(metric => metric.HomeVisitationCount),
                IncidentCount = group.Sum(metric => metric.IncidentCount)
            })
            .OrderByDescending(group => group.MonthStart)
            .Take(6)
            .ToListAsync(cancellationToken);

        var latestProgress = progressTrendRows.FirstOrDefault();
        var progressTrend = progressTrendRows
            .OrderBy(group => group.MonthStart)
            .Select(group => new DashboardProgressTrendPointResponse(
                group.MonthStart,
                Round(group.AvgEducationProgress, 1),
                Round(group.AvgHealthScore, 2)))
            .ToArray();

        var recentDonationRows = await dbContext.Donations
            .AsNoTracking()
            .Where(donation => donation.DonationDate >= recentDonationStart && donation.DonationDate <= today)
            .Join(
                dbContext.Supporters.AsNoTracking(),
                donation => donation.SupporterId,
                supporter => supporter.SupporterId,
                (donation, supporter) => new
                {
                    donation.DonationId,
                    SupporterName = supporter.DisplayName,
                    SupporterEmail = supporter.Email,
                    donation.DonationType,
                    donation.ChannelSource,
                    donation.DonationDate,
                    donation.EstimatedValue,
                    donation.ImpactUnit
                })
            .OrderByDescending(donation => donation.DonationDate)
            .ThenByDescending(donation => donation.EstimatedValue)
            .ToListAsync(cancellationToken);

        var recentDonations = recentDonationRows
            .Take(6)
            .Select(donation => new DashboardRecentDonationResponse(
                donation.DonationId,
                donation.SupporterName,
                donation.SupporterEmail,
                donation.DonationType,
                donation.ChannelSource,
                donation.DonationDate,
                decimal.Round(donation.EstimatedValue, 2),
                donation.ImpactUnit))
            .ToArray();

        var recentIncidentCount = await dbContext.IncidentReports
            .AsNoTracking()
            .CountAsync(
                report => report.IncidentDate >= recentIncidentStart && report.IncidentDate <= today,
                cancellationToken);

        var conferenceRows = await dbContext.InterventionPlans
            .AsNoTracking()
            .Where(plan => plan.CaseConferenceDate != null && plan.Status != "Completed")
            .Join(
                dbContext.Residents.AsNoTracking(),
                plan => plan.ResidentId,
                resident => resident.ResidentId,
                (plan, resident) => new
                {
                    plan.PlanId,
                    plan.PlanCategory,
                    plan.Status,
                    CaseConferenceDate = plan.CaseConferenceDate!.Value,
                    ResidentCode = resident.InternalCode,
                    resident.AssignedSocialWorker,
                    resident.SafehouseId
                })
            .Join(
                dbContext.Safehouses.AsNoTracking(),
                plan => plan.SafehouseId,
                safehouse => safehouse.SafehouseId,
                (plan, safehouse) => new
                {
                    plan.PlanId,
                    plan.ResidentCode,
                    plan.PlanCategory,
                    SafehouseName = safehouse.Name,
                    plan.AssignedSocialWorker,
                    plan.CaseConferenceDate,
                    plan.Status
                })
            .ToListAsync(cancellationToken);

        var upcomingConferenceRows = conferenceRows
            .Where(plan => plan.CaseConferenceDate.Date >= today)
            .OrderBy(plan => plan.CaseConferenceDate)
            .ThenBy(plan => plan.SafehouseName)
            .ToList();

        var overdueConferenceRows = conferenceRows
            .Where(plan => plan.CaseConferenceDate.Date < today)
            .OrderByDescending(plan => plan.CaseConferenceDate)
            .ThenBy(plan => plan.SafehouseName)
            .ToList();

        var highlightedConferenceRows = (upcomingConferenceRows.Count > 0 ? upcomingConferenceRows : overdueConferenceRows)
            .Take(5)
            .Select(plan => new DashboardCaseConferenceResponse(
                plan.PlanId,
                plan.ResidentCode,
                plan.PlanCategory,
                plan.SafehouseName,
                plan.AssignedSocialWorker,
                plan.CaseConferenceDate,
                plan.Status,
                (plan.CaseConferenceDate.Date - today).Days))
            .ToArray();

        var response = new AdminDashboardOverviewResponse(
            DateTime.UtcNow,
            new DashboardSummaryResponse(
                safehouses.Sum(safehouse => safehouse.CurrentOccupancy),
                safehouses.Sum(safehouse => safehouse.Capacity),
                safehouses.Sum(safehouse => safehouse.AvailableBeds),
                safehouses.Length,
                decimal.Round(recentDonationRows.Sum(donation => donation.EstimatedValue), 2),
                recentDonationRows.Count,
                recentIncidentCount,
                upcomingConferenceRows.Count,
                overdueConferenceRows.Count),
            new DashboardProgressSnapshotResponse(
                latestProgress?.MonthStart,
                Round(latestProgress?.AvgEducationProgress, 1),
                Round(latestProgress?.AvgHealthScore, 2),
                latestProgress?.ProcessRecordingCount ?? 0,
                latestProgress?.HomeVisitationCount ?? 0,
                latestProgress?.IncidentCount ?? 0),
            safehouses,
            progressTrend,
            recentDonations,
            new DashboardConferenceQueueResponse(
                upcomingConferenceRows.Count,
                overdueConferenceRows.Count,
                highlightedConferenceRows));

        return TypedResults.Ok(response);
    }

    private static decimal? Round(decimal? value, int digits) =>
        value.HasValue ? decimal.Round(value.Value, digits) : null;
}
