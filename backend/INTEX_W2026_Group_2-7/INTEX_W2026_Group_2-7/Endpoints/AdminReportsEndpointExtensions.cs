using INTEX_W2026_Group_2_7.Auth;
using INTEX_W2026_Group_2_7.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace INTEX_W2026_Group_2_7.Endpoints;

public static class AdminReportsEndpointExtensions
{
    public static IEndpointRouteBuilder MapAdminReportsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/admin/reports/donation-trends", GetDonationTrendsAsync)
            .WithName("GetAdminReportsDonationTrends")
            .RequireAuthorization(AppPolicies.AuthenticatedUser);

        endpoints.MapGet("/api/admin/reports/resident-outcomes", GetResidentOutcomesAsync)
            .WithName("GetAdminReportsResidentOutcomes")
            .RequireAuthorization(AppPolicies.AuthenticatedUser);

        endpoints.MapGet("/api/admin/reports/safehouse-performance", GetSafehousePerformanceAsync)
            .WithName("GetAdminReportsSafehousePerformance")
            .RequireAuthorization(AppPolicies.AuthenticatedUser);

        endpoints.MapGet("/api/admin/reports/service-activity", GetServiceActivityAsync)
            .WithName("GetAdminReportsServiceActivity")
            .RequireAuthorization(AppPolicies.AuthenticatedUser);

        return endpoints;
    }

    private static async Task<Ok<DonationTrendsReportDto>> GetDonationTrendsAsync(
        OperationalDbContext dbContext,
        DateTime? startDate,
        DateTime? endDate,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Donations.AsNoTracking();

        if (startDate.HasValue)
        {
            query = query.Where(d => d.DonationDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(d => d.DonationDate <= endDate.Value);
        }

        var monthlyTotals = await query
            .GroupBy(d => new { d.DonationDate.Year, d.DonationDate.Month })
            .Select(g => new DonationMonthlyTotalDto(
                g.Key.Year,
                g.Key.Month,
                g.Sum(d => d.EstimatedValue),
                g.Count()))
            .OrderBy(m => m.Year)
            .ThenBy(m => m.Month)
            .ToArrayAsync(cancellationToken);

        var byType = await query
            .GroupBy(d => d.DonationType)
            .Select(g => new DonationByTypeDto(
                g.Key,
                g.Sum(d => d.EstimatedValue),
                g.Count()))
            .OrderByDescending(t => t.TotalEstimatedValue)
            .ToArrayAsync(cancellationToken);

        var byCampaign = await query
            .Where(d => d.CampaignName != null && d.CampaignName != string.Empty)
            .GroupBy(d => d.CampaignName!)
            .Select(g => new DonationByCampaignDto(
                g.Key,
                g.Sum(d => d.EstimatedValue),
                g.Count()))
            .OrderByDescending(c => c.TotalEstimatedValue)
            .ToArrayAsync(cancellationToken);

        return TypedResults.Ok(new DonationTrendsReportDto(monthlyTotals, byType, byCampaign));
    }

    private static async Task<Ok<ResidentOutcomesReportDto>> GetResidentOutcomesAsync(
        OperationalDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var byCaseStatus = await dbContext.Residents
            .AsNoTracking()
            .GroupBy(r => r.CaseStatus)
            .Select(g => new ResidentCountByLabelDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToArrayAsync(cancellationToken);

        var byRiskLevel = await dbContext.Residents
            .AsNoTracking()
            .Where(r => r.CurrentRiskLevel != string.Empty)
            .GroupBy(r => r.CurrentRiskLevel)
            .Select(g => new ResidentCountByLabelDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToArrayAsync(cancellationToken);

        var byReintegrationStatus = await dbContext.Residents
            .AsNoTracking()
            .Where(r => r.ReintegrationStatus != null && r.ReintegrationStatus != string.Empty)
            .GroupBy(r => r.ReintegrationStatus!)
            .Select(g => new ResidentCountByLabelDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToArrayAsync(cancellationToken);

        var avgEducationProgress = await dbContext.EducationRecords
            .AsNoTracking()
            .AverageAsync(e => (double?)e.ProgressPercent, cancellationToken);

        var avgHealthScore = await dbContext.HealthWellbeingRecords
            .AsNoTracking()
            .AverageAsync(h => (double?)h.GeneralHealthScore, cancellationToken);

        return TypedResults.Ok(new ResidentOutcomesReportDto(
            byCaseStatus,
            byRiskLevel,
            byReintegrationStatus,
            avgEducationProgress.HasValue ? (decimal)avgEducationProgress.Value : null,
            avgHealthScore.HasValue ? (decimal)avgHealthScore.Value : null));
    }

    private static async Task<Ok<SafehousePerformanceRowDto[]>> GetSafehousePerformanceAsync(
        OperationalDbContext dbContext,
        DateTime? startDate,
        DateTime? endDate,
        CancellationToken cancellationToken)
    {
        var metricsQuery = dbContext.SafehouseMonthlyMetrics.AsNoTracking();

        if (startDate.HasValue)
        {
            metricsQuery = metricsQuery.Where(m => m.MonthStart >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            metricsQuery = metricsQuery.Where(m => m.MonthEnd <= endDate.Value);
        }

        var aggregated = await metricsQuery
            .GroupBy(m => m.SafehouseId)
            .Select(g => new
            {
                SafehouseId = g.Key,
                AvgEducationProgress = g.Average(m => m.AvgEducationProgress),
                AvgHealthScore = g.Average(m => m.AvgHealthScore),
                TotalProcessRecordings = g.Sum(m => m.ProcessRecordingCount),
                TotalHomeVisitations = g.Sum(m => m.HomeVisitationCount),
                TotalIncidents = g.Sum(m => m.IncidentCount)
            })
            .ToArrayAsync(cancellationToken);

        var safehouseNames = await dbContext.Safehouses
            .AsNoTracking()
            .Select(s => new { s.SafehouseId, s.Name })
            .ToDictionaryAsync(s => s.SafehouseId, s => s.Name, cancellationToken);

        var results = aggregated
            .Select(a => new SafehousePerformanceRowDto(
                a.SafehouseId,
                safehouseNames.TryGetValue(a.SafehouseId, out var name) ? name : $"Safehouse {a.SafehouseId}",
                a.AvgEducationProgress,
                a.AvgHealthScore,
                a.TotalProcessRecordings,
                a.TotalHomeVisitations,
                a.TotalIncidents))
            .OrderBy(r => r.SafehouseName)
            .ToArray();

        return TypedResults.Ok(results);
    }

    private static async Task<Ok<ServiceActivityReportDto>> GetServiceActivityAsync(
        OperationalDbContext dbContext,
        DateTime? startDate,
        DateTime? endDate,
        CancellationToken cancellationToken)
    {
        var processRecordingsQuery = dbContext.ProcessRecordings.AsNoTracking();
        var homeVisitationsQuery = dbContext.HomeVisitations.AsNoTracking();
        var incidentReportsQuery = dbContext.IncidentReports.AsNoTracking();

        if (startDate.HasValue)
        {
            processRecordingsQuery = processRecordingsQuery.Where(r => r.SessionDate >= startDate.Value);
            homeVisitationsQuery = homeVisitationsQuery.Where(v => v.VisitDate >= startDate.Value);
            incidentReportsQuery = incidentReportsQuery.Where(i => i.IncidentDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            processRecordingsQuery = processRecordingsQuery.Where(r => r.SessionDate <= endDate.Value);
            homeVisitationsQuery = homeVisitationsQuery.Where(v => v.VisitDate <= endDate.Value);
            incidentReportsQuery = incidentReportsQuery.Where(i => i.IncidentDate <= endDate.Value);
        }

        var processRecordingsByMonth = await processRecordingsQuery
            .GroupBy(r => new { r.SessionDate.Year, r.SessionDate.Month })
            .Select(g => new ActivityMonthlyCountDto(g.Key.Year, g.Key.Month, g.Count()))
            .OrderBy(m => m.Year).ThenBy(m => m.Month)
            .ToArrayAsync(cancellationToken);

        var homeVisitationsByMonth = await homeVisitationsQuery
            .GroupBy(v => new { v.VisitDate.Year, v.VisitDate.Month })
            .Select(g => new ActivityMonthlyCountDto(g.Key.Year, g.Key.Month, g.Count()))
            .OrderBy(m => m.Year).ThenBy(m => m.Month)
            .ToArrayAsync(cancellationToken);

        var incidentsByType = await incidentReportsQuery
            .GroupBy(i => i.IncidentType)
            .Select(g => new ResidentCountByLabelDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToArrayAsync(cancellationToken);

        return TypedResults.Ok(new ServiceActivityReportDto(
            processRecordingsByMonth,
            homeVisitationsByMonth,
            incidentsByType));
    }
}

public sealed record DonationTrendsReportDto(
    DonationMonthlyTotalDto[] MonthlyTotals,
    DonationByTypeDto[] ByType,
    DonationByCampaignDto[] ByCampaign);

public sealed record DonationMonthlyTotalDto(
    int Year,
    int Month,
    decimal TotalEstimatedValue,
    int Count);

public sealed record DonationByTypeDto(
    string DonationType,
    decimal TotalEstimatedValue,
    int Count);

public sealed record DonationByCampaignDto(
    string CampaignName,
    decimal TotalEstimatedValue,
    int Count);

public sealed record ResidentOutcomesReportDto(
    ResidentCountByLabelDto[] ByCaseStatus,
    ResidentCountByLabelDto[] ByRiskLevel,
    ResidentCountByLabelDto[] ByReintegrationStatus,
    decimal? AvgEducationProgress,
    decimal? AvgHealthScore);

public sealed record ResidentCountByLabelDto(string Label, int Count);

public sealed record SafehousePerformanceRowDto(
    int SafehouseId,
    string SafehouseName,
    decimal? AvgEducationProgress,
    decimal? AvgHealthScore,
    int TotalProcessRecordings,
    int TotalHomeVisitations,
    int TotalIncidents);

public sealed record ServiceActivityReportDto(
    ActivityMonthlyCountDto[] ProcessRecordingsByMonth,
    ActivityMonthlyCountDto[] HomeVisitationsByMonth,
    ResidentCountByLabelDto[] IncidentsByType);

public sealed record ActivityMonthlyCountDto(int Year, int Month, int Count);
