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
            .RequireAuthorization(AppPolicies.AdminOnly);

        endpoints.MapGet("/api/admin/reports/resident-outcomes", GetResidentOutcomesAsync)
            .WithName("GetAdminReportsResidentOutcomes")
            .RequireAuthorization(AppPolicies.AdminOnly);

        endpoints.MapGet("/api/admin/reports/safehouse-performance", GetSafehousePerformanceAsync)
            .WithName("GetAdminReportsSafehousePerformance")
            .RequireAuthorization(AppPolicies.AdminOnly);

        endpoints.MapGet("/api/admin/reports/service-activity", GetServiceActivityAsync)
            .WithName("GetAdminReportsServiceActivity")
            .RequireAuthorization(AppPolicies.AdminOnly);

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

        var rawDonations = await query
            .Select(d => new { d.DonationDate, d.EstimatedValue, d.DonationType, d.CampaignName })
            .ToArrayAsync(cancellationToken);

        var monthlyTotals = rawDonations
            .GroupBy(d => new { d.DonationDate.Year, d.DonationDate.Month })
            .Select(g => new DonationMonthlyTotalDto(g.Key.Year, g.Key.Month, g.Sum(d => d.EstimatedValue), g.Count()))
            .OrderBy(m => m.Year)
            .ThenBy(m => m.Month)
            .ToArray();

        var byType = rawDonations
            .GroupBy(d => d.DonationType)
            .Select(g => new DonationByTypeDto(g.Key, g.Sum(d => d.EstimatedValue), g.Count()))
            .OrderByDescending(t => t.TotalEstimatedValue)
            .ToArray();

        var byCampaign = rawDonations
            .Where(d => !string.IsNullOrEmpty(d.CampaignName))
            .GroupBy(d => d.CampaignName!)
            .Select(g => new DonationByCampaignDto(g.Key, g.Sum(d => d.EstimatedValue), g.Count()))
            .OrderByDescending(c => c.TotalEstimatedValue)
            .ToArray();

        return TypedResults.Ok(new DonationTrendsReportDto(monthlyTotals, byType, byCampaign));
    }

    private static async Task<Ok<ResidentOutcomesReportDto>> GetResidentOutcomesAsync(
        OperationalDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var rawResidents = await dbContext.Residents
            .AsNoTracking()
            .Select(r => new { r.CaseStatus, r.CurrentRiskLevel, r.ReintegrationStatus })
            .ToArrayAsync(cancellationToken);

        var byCaseStatus = rawResidents
            .GroupBy(r => r.CaseStatus)
            .Select(g => new ResidentCountByLabelDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToArray();

        var byRiskLevel = rawResidents
            .Where(r => !string.IsNullOrEmpty(r.CurrentRiskLevel))
            .GroupBy(r => r.CurrentRiskLevel)
            .Select(g => new ResidentCountByLabelDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToArray();

        var byReintegrationStatus = rawResidents
            .Where(r => !string.IsNullOrEmpty(r.ReintegrationStatus))
            .GroupBy(r => r.ReintegrationStatus!)
            .Select(g => new ResidentCountByLabelDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToArray();

        var educationValues = await dbContext.EducationRecords
            .AsNoTracking()
            .Select(e => (decimal?)e.ProgressPercent)
            .ToArrayAsync(cancellationToken);
        var avgEducationProgress = educationValues.Length > 0
            ? educationValues.Where(v => v.HasValue).Average(v => v!.Value)
            : (decimal?)null;

        var healthValues = await dbContext.HealthWellbeingRecords
            .AsNoTracking()
            .Select(h => (decimal?)h.GeneralHealthScore)
            .ToArrayAsync(cancellationToken);
        var avgHealthScore = healthValues.Length > 0
            ? healthValues.Where(v => v.HasValue).Average(v => v!.Value)
            : (decimal?)null;

        return TypedResults.Ok(new ResidentOutcomesReportDto(
            byCaseStatus,
            byRiskLevel,
            byReintegrationStatus,
            avgEducationProgress,
            avgHealthScore));
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

        var rawMetrics = await metricsQuery
            .Select(m => new
            {
                m.SafehouseId,
                m.AvgEducationProgress,
                m.AvgHealthScore,
                m.ProcessRecordingCount,
                m.HomeVisitationCount,
                m.IncidentCount
            })
            .ToArrayAsync(cancellationToken);

        var aggregated = rawMetrics
            .GroupBy(m => m.SafehouseId)
            .Select(g => new
            {
                SafehouseId = g.Key,
                AvgEducationProgress = g.Any(m => m.AvgEducationProgress.HasValue)
                    ? (decimal?)g.Where(m => m.AvgEducationProgress.HasValue).Average(m => m.AvgEducationProgress!.Value)
                    : null,
                AvgHealthScore = g.Any(m => m.AvgHealthScore.HasValue)
                    ? (decimal?)g.Where(m => m.AvgHealthScore.HasValue).Average(m => m.AvgHealthScore!.Value)
                    : null,
                TotalProcessRecordings = g.Sum(m => m.ProcessRecordingCount),
                TotalHomeVisitations = g.Sum(m => m.HomeVisitationCount),
                TotalIncidents = g.Sum(m => m.IncidentCount)
            })
            .ToArray();

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

        var rawProcessRecordings = await processRecordingsQuery
            .Select(r => r.SessionDate)
            .ToArrayAsync(cancellationToken);

        var processRecordingsByMonth = rawProcessRecordings
            .GroupBy(d => new { d.Year, d.Month })
            .Select(g => new ActivityMonthlyCountDto(g.Key.Year, g.Key.Month, g.Count()))
            .OrderBy(m => m.Year).ThenBy(m => m.Month)
            .ToArray();

        var rawHomeVisitations = await homeVisitationsQuery
            .Select(v => v.VisitDate)
            .ToArrayAsync(cancellationToken);

        var homeVisitationsByMonth = rawHomeVisitations
            .GroupBy(d => new { d.Year, d.Month })
            .Select(g => new ActivityMonthlyCountDto(g.Key.Year, g.Key.Month, g.Count()))
            .OrderBy(m => m.Year).ThenBy(m => m.Month)
            .ToArray();

        var rawIncidents = await incidentReportsQuery
            .Select(i => i.IncidentType)
            .ToArrayAsync(cancellationToken);

        var incidentsByType = rawIncidents
            .GroupBy(t => t)
            .Select(g => new ResidentCountByLabelDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToArray();

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
