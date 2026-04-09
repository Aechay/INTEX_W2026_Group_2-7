using System.Net;
using System.Net.Http.Json;
using INTEX_W2026_Group_2_7.Data;
using INTEX_W2026_Group_2_7.Models.Dashboard;
using INTEX_W2026_Group_2_7.Tests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

namespace INTEX_W2026_Group_2_7.Tests;

public class DashboardApiTests
{
    [Fact]
    public async Task AdminDashboardOverview_IsForbiddenForNonAdmin()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateHttpsClient();

        await client.PostAsJsonAsync("/auth/register", new
        {
            email = "dashboard-user@test.local",
            password = "StudentPassword123!"
        });

        using var authenticatedClient = await factory.CreateAuthenticatedClientAsync(
            "dashboard-user@test.local",
            "StudentPassword123!");

        var response = await authenticatedClient.GetAsync("/api/admin/dashboard/overview");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AdminDashboardOverview_ReturnsAggregatedOperationalSummary()
    {
        var today = DateTime.UtcNow.Date;
        var currentMonthStart = new DateTime(today.Year, today.Month, 1);

        await using var factory = new TestWebApplicationFactory();
        await factory.WithScopeAsync(async services =>
        {
            var dbContext = services.GetRequiredService<OperationalDbContext>();

            dbContext.Safehouses.AddRange(
                new Safehouse
                {
                    SafehouseId = 1,
                    SafehouseCode = "SH01",
                    Name = "Harbor House",
                    Region = "North",
                    City = "Santo Domingo",
                    Province = "Distrito Nacional",
                    Country = "Dominican Republic",
                    OpenDate = today.AddYears(-2),
                    Status = "Active",
                    CapacityGirls = 10,
                    CapacityStaff = 5,
                    CurrentOccupancy = 8
                },
                new Safehouse
                {
                    SafehouseId = 2,
                    SafehouseCode = "SH02",
                    Name = "Sunrise House",
                    Region = "East",
                    City = "San Pedro",
                    Province = "San Pedro de Macoris",
                    Country = "Dominican Republic",
                    OpenDate = today.AddYears(-1),
                    Status = "Active",
                    CapacityGirls = 12,
                    CapacityStaff = 4,
                    CurrentOccupancy = 9
                });

            dbContext.Supporters.Add(new Supporter
            {
                SupporterId = 1,
                SupporterType = "Individual",
                DisplayName = "Ana Rivera",
                RelationshipType = "Donor",
                Region = "North",
                Country = "Dominican Republic",
                Email = "ana@test.local",
                Phone = "555-0100",
                Status = "Active",
                CreatedAt = today.AddMonths(-6),
                AcquisitionChannel = "Community"
            });

            dbContext.Residents.Add(new Resident
            {
                ResidentId = 1,
                CaseControlNo = "C-1001",
                InternalCode = "HS-0001",
                SafehouseId = 1,
                CaseStatus = "Active",
                Sex = "F",
                DateOfBirth = today.AddYears(-16),
                BirthStatus = "Registered",
                PlaceOfBirth = "Santo Domingo",
                Religion = "None",
                CaseCategory = "Protection",
                DateOfAdmission = today.AddMonths(-4),
                AgeUponAdmission = "15",
                PresentAge = "16",
                LengthOfStay = "4 months",
                ReferralSource = "Agency",
                AssignedSocialWorker = "SW-01",
                InitialCaseAssessment = "Stabilization",
                InitialRiskLevel = "High",
                CurrentRiskLevel = "Medium",
                DateEnrolled = today.AddMonths(-4),
                CreatedAt = today.AddMonths(-4)
            });

            dbContext.Donations.AddRange(
                new Donation
                {
                    DonationId = 1,
                    SupporterId = 1,
                    DonationType = "Monetary",
                    DonationDate = today.AddDays(-10),
                    IsRecurring = false,
                    ChannelSource = "Campaign",
                    CurrencyCode = "USD",
                    Amount = 1200m,
                    EstimatedValue = 1200m,
                    ImpactUnit = "dollars"
                },
                new Donation
                {
                    DonationId = 2,
                    SupporterId = 1,
                    DonationType = "InKind",
                    DonationDate = today.AddDays(-120),
                    IsRecurring = false,
                    ChannelSource = "PartnerReferral",
                    EstimatedValue = 450m,
                    ImpactUnit = "items"
                });

            dbContext.SafehouseMonthlyMetrics.AddRange(
                new SafehouseMonthlyMetric
                {
                    MetricId = 1,
                    SafehouseId = 1,
                    MonthStart = currentMonthStart.AddMonths(-1),
                    MonthEnd = currentMonthStart.AddDays(-1),
                    ActiveResidents = 8,
                    AvgEducationProgress = 74.2m,
                    AvgHealthScore = 4.10m,
                    ProcessRecordingCount = 12,
                    HomeVisitationCount = 4,
                    IncidentCount = 1
                },
                new SafehouseMonthlyMetric
                {
                    MetricId = 2,
                    SafehouseId = 2,
                    MonthStart = currentMonthStart.AddMonths(-1),
                    MonthEnd = currentMonthStart.AddDays(-1),
                    ActiveResidents = 9,
                    AvgEducationProgress = 69.8m,
                    AvgHealthScore = 3.90m,
                    ProcessRecordingCount = 10,
                    HomeVisitationCount = 3,
                    IncidentCount = 2
                },
                new SafehouseMonthlyMetric
                {
                    MetricId = 3,
                    SafehouseId = 1,
                    MonthStart = currentMonthStart.AddMonths(-2),
                    MonthEnd = currentMonthStart.AddMonths(-1).AddDays(-1),
                    ActiveResidents = 7,
                    AvgEducationProgress = 66.4m,
                    AvgHealthScore = 3.70m,
                    ProcessRecordingCount = 8,
                    HomeVisitationCount = 2,
                    IncidentCount = 0
                });

            dbContext.IncidentReports.AddRange(
                new IncidentReport
                {
                    IncidentId = 1,
                    ResidentId = 1,
                    SafehouseId = 1,
                    IncidentDate = today.AddDays(-4),
                    IncidentType = "Behavioral",
                    Severity = "Moderate",
                    Description = "Incident report in active 30-day window.",
                    ResponseTaken = "Counseling",
                    Resolved = true,
                    ResolutionDate = today.AddDays(-3),
                    ReportedBy = "SW-01",
                    FollowUpRequired = false
                },
                new IncidentReport
                {
                    IncidentId = 2,
                    ResidentId = 1,
                    SafehouseId = 1,
                    IncidentDate = today.AddDays(-35),
                    IncidentType = "Safety",
                    Severity = "Low",
                    Description = "Incident report outside 30-day window.",
                    ResponseTaken = "Documented",
                    Resolved = true,
                    ResolutionDate = today.AddDays(-34),
                    ReportedBy = "SW-01",
                    FollowUpRequired = false
                });

            dbContext.InterventionPlans.AddRange(
                new InterventionPlan
                {
                    PlanId = 1,
                    ResidentId = 1,
                    PlanCategory = "Education",
                    PlanDescription = "Support class participation",
                    ServicesProvided = "Tutoring",
                    TargetValue = 0.8m,
                    TargetDate = today.AddMonths(1),
                    Status = "In Progress",
                    CaseConferenceDate = today.AddDays(7),
                    CreatedAt = today.AddMonths(-2),
                    UpdatedAt = today.AddDays(-2)
                },
                new InterventionPlan
                {
                    PlanId = 2,
                    ResidentId = 1,
                    PlanCategory = "Family Reintegration",
                    PlanDescription = "Coordinate guardian readiness",
                    ServicesProvided = "Counseling",
                    TargetValue = 1.0m,
                    TargetDate = today.AddMonths(2),
                    Status = "Open",
                    CaseConferenceDate = today.AddDays(-5),
                    CreatedAt = today.AddMonths(-3),
                    UpdatedAt = today.AddDays(-5)
                });

            await dbContext.SaveChangesAsync();
            return 0;
        });

        using var client = await factory.CreateAuthenticatedClientAsync("admin@test.local", "AdminPassword123!");

        var payload = await client.GetFromJsonAsync<AdminDashboardOverviewResponse>("/api/admin/dashboard/overview");

        Assert.NotNull(payload);
        Assert.Equal(17, payload!.Summary.ActiveResidents);
        Assert.Equal(22, payload.Summary.TotalCapacity);
        Assert.Equal(5, payload.Summary.AvailableBeds);
        Assert.Equal(2, payload.Summary.ActiveSafehouses);
        Assert.Equal(1200m, payload.Summary.RecentDonationTotal);
        Assert.Equal(1, payload.Summary.RecentDonationCount);
        Assert.Equal(1, payload.Summary.RecentIncidentCount);
        Assert.Equal(1, payload.Summary.UpcomingCaseConferenceCount);
        Assert.Equal(1, payload.Summary.OverdueCaseConferenceCount);

        Assert.Equal(currentMonthStart.AddMonths(-1), payload.ProgressSnapshot.MonthStart);
        Assert.Equal(72.0m, payload.ProgressSnapshot.AvgEducationProgress);
        Assert.Equal(4.00m, payload.ProgressSnapshot.AvgHealthScore);
        Assert.Equal(22, payload.ProgressSnapshot.ProcessRecordingCount);
        Assert.Equal(7, payload.ProgressSnapshot.HomeVisitationCount);
        Assert.Equal(3, payload.ProgressSnapshot.IncidentCount);

        Assert.Equal(2, payload.Safehouses.Count);
        var donation = Assert.Single(payload.RecentDonations);
        Assert.Equal("Ana Rivera", donation.SupporterName);
        Assert.Equal("ana@test.local", donation.SupporterEmail);
        Assert.Equal(1, payload.ConferenceQueue.UpcomingCount);
        Assert.Equal(1, payload.ConferenceQueue.OverdueCount);
        Assert.Single(payload.ConferenceQueue.Highlights);
        Assert.Equal(7, payload.ConferenceQueue.Highlights.Single().DaysFromToday);
    }
}
