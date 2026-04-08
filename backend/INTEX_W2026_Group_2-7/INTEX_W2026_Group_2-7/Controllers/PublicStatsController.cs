using INTEX_W2026_Group_2_7.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEX_W2026_Group_2_7.Controllers;

[ApiController]
[Route("api/public")]
public sealed class PublicStatsController : ControllerBase
{
    private readonly OperationalDbContext _dbContext;

    public PublicStatsController(OperationalDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken cancellationToken)
    {
        var girlsHelped = await _dbContext.Residents
            .AsNoTracking()
            .CountAsync(cancellationToken);

        var activeDonors = await _dbContext.Supporters
            .AsNoTracking()
            .CountAsync(supporter => supporter.Status == "Active", cancellationToken);

        var operatingSafeHouses = await _dbContext.Safehouses
            .AsNoTracking()
            .CountAsync(safehouse => safehouse.Status == "Active"
                                     || safehouse.Status == "Operating", cancellationToken);

        var oldestOpenDate = await _dbContext.Safehouses
            .AsNoTracking()
            .MinAsync(safehouse => (DateTime?)safehouse.OpenDate, cancellationToken);

        var yearsOfService = oldestOpenDate.HasValue
            ? Math.Max(0, DateTime.UtcNow.Year - oldestOpenDate.Value.Year)
            : 0;

        var girlsReintegrated = await _dbContext.Residents
            .AsNoTracking()
            .CountAsync(
                resident => resident.ReintegrationStatus == "Completed"
                            || resident.ReintegrationStatus == "Reintegrated",
                cancellationToken);

        var activeResidents = await _dbContext.Residents
            .AsNoTracking()
            .CountAsync(resident => resident.DateClosed == null || resident.CaseStatus == "Active", cancellationToken);

        var openCases = await _dbContext.Residents
            .AsNoTracking()
            .CountAsync(resident => resident.CaseStatus != "Closed", cancellationToken);

        var interventionPlanCount = await _dbContext.InterventionPlans
            .AsNoTracking()
            .CountAsync(cancellationToken);
        var completedInterventionPlanCount = await _dbContext.InterventionPlans
            .AsNoTracking()
            .CountAsync(plan => plan.Status == "Completed", cancellationToken);

        var avgAttendanceRaw = await _dbContext.EducationRecords
            .AsNoTracking()
            .Select(record => (double?)record.AttendanceRate)
            .AverageAsync(cancellationToken) ?? 0d;
        var schoolAttendance = avgAttendanceRaw <= 1 ? avgAttendanceRaw * 100 : avgAttendanceRaw;

        var educationGrowthRaw = await _dbContext.EducationRecords
            .AsNoTracking()
            .Select(record => (double?)record.ProgressPercent)
            .AverageAsync(cancellationToken) ?? 0d;

        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var processSessionsThisMonth = await _dbContext.ProcessRecordings
            .AsNoTracking()
            .CountAsync(recording => recording.SessionDate >= monthStart, cancellationToken);
        if (processSessionsThisMonth == 0)
        {
            processSessionsThisMonth = await _dbContext.ProcessRecordings
                .AsNoTracking()
                .CountAsync(cancellationToken);
        }

        if (activeResidents == 0)
        {
            activeResidents = girlsHelped;
        }

        if (openCases == 0)
        {
            openCases = girlsHelped;
        }

        var caseGoalsCompleted = ToPercent(completedInterventionPlanCount, interventionPlanCount);

        var totalDonations = await _dbContext.Donations
            .AsNoTracking()
            .Select(donation => (double?)donation.EstimatedValue)
            .SumAsync(cancellationToken) ?? 0d;

        var totalAllocated = await _dbContext.DonationAllocations
            .AsNoTracking()
            .Select(allocation => (double?)allocation.AmountAllocated)
            .SumAsync(cancellationToken) ?? 0d;
        var programAllocation = totalDonations > 0 ? (totalAllocated / totalDonations) * 100 : 0d;

        var costPerGirl = girlsHelped > 0 ? totalDonations / girlsHelped : 0d;

        var totalDonorsWithDonations = await _dbContext.Donations
            .AsNoTracking()
            .Select(donation => donation.SupporterId)
            .Distinct()
            .CountAsync(cancellationToken);
        var recurringDonors = await _dbContext.Donations
            .AsNoTracking()
            .Where(donation => donation.IsRecurring)
            .Select(donation => donation.SupporterId)
            .Distinct()
            .CountAsync(cancellationToken);
        var recurringDonorShare = ToPercent(recurringDonors, totalDonorsWithDonations);

        return Ok(new
        {
            girlsHelped,
            yearsOfService,
            activeDonors,
            operatingSafeHouses,
            preview = new
            {
                outcomes = new
                {
                    girlsReintegrated,
                    activeResidents,
                    openCases
                },
                progress = new
                {
                    schoolAttendance = Math.Round(schoolAttendance, 1),
                    educationGrowth = Math.Round(educationGrowthRaw, 1),
                    processSessionsThisMonth
                },
                resourceUse = new
                {
                    programAllocation = Math.Round(programAllocation, 1),
                    costPerGirl = Math.Round(costPerGirl, 0),
                    recurringDonorShare = Math.Round(recurringDonorShare, 1)
                }
            }
        });
    }

    private static double ToPercent(int numerator, int denominator) =>
        denominator > 0 ? (double)numerator / denominator * 100 : 0d;
}
