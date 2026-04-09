using INTEX_W2026_Group_2_7.Auth;
using INTEX_W2026_Group_2_7.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace INTEX_W2026_Group_2_7.Endpoints;

public static class AdminDonationsEndpointExtensions
{
    private const int RecentDonationLimit = 25;
    private const int DefaultPageSize = 10;

    private static string[] MapSupporterTypeFilter(string? filter)
    {
        if (string.IsNullOrWhiteSpace(filter) || filter == "all")
        {
            return [];
        }

        return filter switch
        {
            "Monetary" => ["MonetaryDonor", "Monetary"],
            "In-kind" => ["InKindDonor", "InKind", "In-kind"],
            "Social Media" => ["SocialMediaAdvocate", "SocialMedia", "Social media", "Social Media"],
            "Skills" => ["SkillsContributor", "Skills"],
            "Volunteer" => ["Volunteer"],
            _ => [filter]
        };
    }

    private static string[] MapContributionTypeFilter(string? filter)
    {
        if (string.IsNullOrWhiteSpace(filter) || filter == "all")
        {
            return [];
        }

        return filter switch
        {
            "Monetary" => ["Monetary", "MonetaryDonor"],
            "In-kind" => ["InKind", "InKindDonor", "In-kind"],
            "Social Media" => ["SocialMedia", "SocialMediaAdvocate", "Social media", "Social Media"],
            "Skills" => ["Skills", "SkillsContributor"],
            "Time" => ["Time", "Volunteer"],
            _ => [filter]
        };
    }

    public static IEndpointRouteBuilder MapAdminDonationsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/admin/donations/overview", GetDonationsOverviewAsync)
            .WithName("GetAdminDonationsOverview")
            .RequireAuthorization(AppPolicies.AdminOnly)
            .Produces<AdminDonationsOverviewResponse>();

        endpoints.MapPost("/api/admin/donations/donors", CreateDonorAsync)
            .WithName("CreateAdminDonor")
            .RequireAuthorization(AppPolicies.AdminOnly)
            .Produces<AdminDonorCreatedResponse>();

        endpoints.MapGet("/api/admin/donations/supporters", GetSupportersAsync)
            .WithName("GetAdminDonationSupporters")
            .RequireAuthorization(AppPolicies.AdminOnly)
            .Produces<IReadOnlyList<SupporterLookupResponse>>();

        endpoints.MapPost("/api/admin/donations/contributions", CreateContributionAsync)
            .WithName("CreateAdminContribution")
            .RequireAuthorization(AppPolicies.AdminOnly)
            .Produces<AdminContributionCreatedResponse>();

        return endpoints;
    }

    private static async Task<Ok<AdminDonationsOverviewResponse>> GetDonationsOverviewAsync(
        OperationalDbContext dbContext,
        string? search,
        string? donorType,
        string? status,
        string? contributionType,
        int? page,
        int? pageSize,
        int? contributionsPage,
        int? contributionsPageSize,
        CancellationToken cancellationToken)
    {
        var baseQuery = dbContext.Donations
            .AsNoTracking()
            .Join(
                dbContext.Supporters.AsNoTracking(),
                donation => donation.SupporterId,
                supporter => supporter.SupporterId,
                (donation, supporter) => new { donation, supporter });

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            baseQuery = baseQuery.Where(row =>
                row.supporter.DisplayName.ToLower().Contains(term) ||
                row.supporter.Email.ToLower().Contains(term) ||
                row.supporter.SupporterType.ToLower().Contains(term) ||
                row.donation.DonationType.ToLower().Contains(term));
        }

        var supporterTypeFilters = MapSupporterTypeFilter(donorType)
            .Select(value => value.ToLower())
            .ToArray();
        if (supporterTypeFilters.Length > 0)
        {
            baseQuery = baseQuery.Where(row =>
                supporterTypeFilters.Contains(row.supporter.SupporterType.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(status) && status != "all")
        {
            baseQuery = baseQuery.Where(row => row.supporter.Status == status);
        }

        var donationTypeFilters = MapContributionTypeFilter(contributionType)
            .Select(value => value.ToLower())
            .ToArray();
        if (donationTypeFilters.Length > 0)
        {
            baseQuery = baseQuery.Where(row =>
                donationTypeFilters.Contains(row.donation.DonationType.ToLower()));
        }

        var donorAggregates = await baseQuery
            .GroupBy(row => new
            {
                row.supporter.SupporterId,
                row.supporter.DisplayName,
                row.supporter.SupporterType,
                row.supporter.Status
            })
            .Select(group => new
            {
                group.Key.SupporterId,
                group.Key.DisplayName,
                group.Key.SupporterType,
                group.Key.Status,
                LastDonationDate = group.Max(row => row.donation.DonationDate),
                TotalEstimatedValue = group.Sum(row => row.donation.EstimatedValue)
            })
            .ToListAsync(cancellationToken);

        var donorRows = donorAggregates
            .Select(group => new AdminDonorSummaryResponse(
                group.SupporterId,
                group.DisplayName,
                group.SupporterType,
                group.Status,
                group.LastDonationDate,
                decimal.Round(group.TotalEstimatedValue, 2)))
            .OrderByDescending(row => row.LastDonationDate)
            .ThenBy(row => row.DisplayName)
            .ToList();

        var totalDonors = donorRows.Count;
        var resolvedPageSize = pageSize.HasValue && pageSize.Value > 0 ? pageSize.Value : DefaultPageSize;
        var resolvedPage = page.HasValue && page.Value > 0 ? page.Value : 1;

        var pagedDonors = donorRows
            .Skip((resolvedPage - 1) * resolvedPageSize)
            .Take(resolvedPageSize)
            .ToList();

        var recentDonationsQuery = dbContext.Donations.AsNoTracking();

        if (donationTypeFilters.Length > 0)
        {
            recentDonationsQuery = recentDonationsQuery.Where(donation =>
                donationTypeFilters.Contains(donation.DonationType.ToLower()));
        }

        var contributionSearchTerm = search?.Trim().ToLower();

        var contributionsBaseQuery = recentDonationsQuery
            .Join(
                dbContext.Supporters.AsNoTracking(),
                donation => donation.SupporterId,
                supporter => supporter.SupporterId,
                (donation, supporter) => new
                {
                    donation.DonationId,
                    donation.DonationDate,
                    donation.DonationType,
                    donation.EstimatedValue,
                    donation.CurrencyCode,
                    SupporterName = supporter.DisplayName,
                    SupporterEmail = supporter.Email
                })
            .Where(row =>
                string.IsNullOrWhiteSpace(contributionSearchTerm) ||
                row.SupporterName.ToLower().Contains(contributionSearchTerm) ||
                row.SupporterEmail.ToLower().Contains(contributionSearchTerm) ||
                row.DonationType.ToLower().Contains(contributionSearchTerm))
            .OrderByDescending(donation => donation.DonationDate)
            .ThenByDescending(donation => donation.EstimatedValue);

        var totalContributions = await contributionsBaseQuery.CountAsync(cancellationToken);
        var resolvedContributionsPageSize = contributionsPageSize.HasValue && contributionsPageSize.Value > 0
            ? contributionsPageSize.Value
            : DefaultPageSize;
        var resolvedContributionsPage = contributionsPage.HasValue && contributionsPage.Value > 0
            ? contributionsPage.Value
            : 1;

        var recentDonationRows = await contributionsBaseQuery
            .Skip((resolvedContributionsPage - 1) * resolvedContributionsPageSize)
            .Take(resolvedContributionsPageSize)
            .ToListAsync(cancellationToken);

        var recentDonationIds = recentDonationRows
            .Select(donation => donation.DonationId)
            .ToArray();

        var allocationLabels = await dbContext.DonationAllocations
            .AsNoTracking()
            .Where(allocation => recentDonationIds.Contains(allocation.DonationId))
            .GroupBy(allocation => allocation.DonationId)
            .Select(group => new
            {
                group.Key,
                ProgramArea = group
                    .OrderByDescending(row => row.AllocationDate)
                    .ThenByDescending(row => row.AllocationId)
                    .Select(row => row.ProgramArea)
                    .FirstOrDefault()
            })
            .ToDictionaryAsync(
                row => row.Key,
                row => string.IsNullOrWhiteSpace(row.ProgramArea) ? "Unallocated" : row.ProgramArea,
                cancellationToken);

        var contributions = recentDonationRows
            .Select(donation => new AdminDonationActivityResponse(
                donation.DonationId,
                donation.DonationDate,
                donation.SupporterName,
                donation.DonationType,
                allocationLabels.GetValueOrDefault(donation.DonationId, "Unallocated"),
                decimal.Round(donation.EstimatedValue, 2),
                donation.CurrencyCode))
            .ToList();

        var allocationTotals = await dbContext.DonationAllocations
            .AsNoTracking()
            .GroupBy(allocation => allocation.ProgramArea)
            .Select(group => new
            {
                ProgramArea = group.Key,
                TotalAllocated = group.Sum(row => row.AmountAllocated)
            })
            .OrderByDescending(row => row.TotalAllocated)
            .ToListAsync(cancellationToken);

        var totalAllocated = allocationTotals.Sum(row => row.TotalAllocated);
        var allocationCoverage = allocationTotals
            .Select(row => new AdminAllocationCoverageResponse(
                row.ProgramArea,
                decimal.Round(row.TotalAllocated, 2),
                totalAllocated == 0m ? 0m : decimal.Round((row.TotalAllocated / totalAllocated) * 100m, 1)))
            .ToList();

        return TypedResults.Ok(new AdminDonationsOverviewResponse(
            pagedDonors,
            contributions,
            allocationCoverage,
            totalDonors,
            resolvedPage,
            resolvedPageSize,
            totalContributions,
            resolvedContributionsPage,
            resolvedContributionsPageSize));
    }

    private sealed record AdminDonationsOverviewResponse(
        IReadOnlyList<AdminDonorSummaryResponse> Donors,
        IReadOnlyList<AdminDonationActivityResponse> Contributions,
        IReadOnlyList<AdminAllocationCoverageResponse> AllocationCoverage,
        int TotalDonors,
        int Page,
        int PageSize,
        int TotalContributions,
        int ContributionsPage,
        int ContributionsPageSize);

    private static async Task<Results<Created<AdminDonorCreatedResponse>, ValidationProblem>> CreateDonorAsync(
        OperationalDbContext dbContext,
        AdminDonorCreateRequest request,
        CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.DisplayName))
        {
            errors["displayName"] = ["Display name is required."];
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            errors["email"] = ["Email is required."];
        }

        if (string.IsNullOrWhiteSpace(request.Phone))
        {
            errors["phone"] = ["Phone is required."];
        }

        if (string.IsNullOrWhiteSpace(request.SupporterType))
        {
            errors["supporterType"] = ["Supporter type is required."];
        }

        if (errors.Count > 0)
        {
            return TypedResults.ValidationProblem(errors);
        }

        var supporter = new Supporter
        {
            SupporterType = request.SupporterType.Trim(),
            DisplayName = request.DisplayName.Trim(),
            OrganizationName = string.IsNullOrWhiteSpace(request.OrganizationName)
                ? null
                : request.OrganizationName.Trim(),
            FirstName = string.IsNullOrWhiteSpace(request.FirstName) ? null : request.FirstName.Trim(),
            LastName = string.IsNullOrWhiteSpace(request.LastName) ? null : request.LastName.Trim(),
            RelationshipType = string.IsNullOrWhiteSpace(request.RelationshipType)
                ? "Supporter"
                : request.RelationshipType.Trim(),
            Region = string.IsNullOrWhiteSpace(request.Region) ? "National" : request.Region.Trim(),
            Country = string.IsNullOrWhiteSpace(request.Country)
                ? "Dominican Republic"
                : request.Country.Trim(),
            Email = request.Email.Trim(),
            Phone = request.Phone.Trim(),
            Status = string.IsNullOrWhiteSpace(request.Status) ? "Active" : request.Status.Trim(),
            CreatedAt = DateTime.UtcNow,
            FirstDonationDate = null,
            AcquisitionChannel = string.IsNullOrWhiteSpace(request.AcquisitionChannel)
                ? "Manual"
                : request.AcquisitionChannel.Trim()
        };

        dbContext.Supporters.Add(supporter);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Created(
            $"/api/admin/donations/donors/{supporter.SupporterId}",
            new AdminDonorCreatedResponse(supporter.SupporterId, supporter.DisplayName));
    }

    private sealed record AdminDonorCreateRequest(
        string DisplayName,
        string Email,
        string Phone,
        string SupporterType,
        string? OrganizationName,
        string? FirstName,
        string? LastName,
        string? RelationshipType,
        string? Region,
        string? Country,
        string? Status,
        string? AcquisitionChannel);

    private sealed record AdminDonorCreatedResponse(int SupporterId, string DisplayName);

    private sealed record SupporterLookupResponse(int SupporterId, string DisplayName, string Email);

    private sealed record AdminContributionCreateRequest(
        int SupporterId,
        string DonationType,
        DateTime DonationDate,
        decimal EstimatedValue,
        string? ImpactUnit,
        bool? IsRecurring,
        string? ChannelSource,
        decimal? Amount,
        string? CurrencyCode);

    private sealed record AdminContributionCreatedResponse(int DonationId, int SupporterId);

    private static async Task<Ok<IReadOnlyList<SupporterLookupResponse>>> GetSupportersAsync(
        OperationalDbContext dbContext,
        string? search,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Supporters.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(s =>
                s.DisplayName.ToLower().Contains(term) ||
                s.Email.ToLower().Contains(term));
        }

        var supporters = await query
            .OrderBy(s => s.DisplayName)
            .Select(s => new SupporterLookupResponse(s.SupporterId, s.DisplayName, s.Email))
            .Take(200)
            .ToListAsync(cancellationToken);

        return TypedResults.Ok<IReadOnlyList<SupporterLookupResponse>>(supporters);
    }

    private static async Task<Results<Created<AdminContributionCreatedResponse>, ValidationProblem>> CreateContributionAsync(
        OperationalDbContext dbContext,
        AdminContributionCreateRequest request,
        CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>();

        if (request.SupporterId <= 0)
        {
            errors["supporterId"] = ["Supporter is required."];
        }

        if (string.IsNullOrWhiteSpace(request.DonationType))
        {
            errors["donationType"] = ["Donation type is required."];
        }

        if (request.DonationDate == default)
        {
            errors["donationDate"] = ["Donation date is required."];
        }

        if (request.EstimatedValue <= 0)
        {
            errors["estimatedValue"] = ["Estimated value must be greater than 0."];
        }

        if (errors.Count > 0)
        {
            return TypedResults.ValidationProblem(errors);
        }

        var donation = new Donation
        {
            SupporterId = request.SupporterId,
            DonationType = request.DonationType.Trim(),
            DonationDate = request.DonationDate,
            EstimatedValue = request.EstimatedValue,
            ImpactUnit = string.IsNullOrWhiteSpace(request.ImpactUnit) ? "General" : request.ImpactUnit.Trim(),
            IsRecurring = request.IsRecurring ?? false,
            ChannelSource = string.IsNullOrWhiteSpace(request.ChannelSource)
                ? "Manual"
                : request.ChannelSource.Trim(),
            Amount = request.Amount,
            CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? null : request.CurrencyCode.Trim()
        };

        dbContext.Donations.Add(donation);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Created(
            $"/api/admin/donations/contributions/{donation.DonationId}",
            new AdminContributionCreatedResponse(donation.DonationId, donation.SupporterId));
    }

    private sealed record AdminDonorSummaryResponse(
        int SupporterId,
        string DisplayName,
        string SupporterType,
        string Status,
        DateTime? LastDonationDate,
        decimal TotalEstimatedValue);

    private sealed record AdminDonationActivityResponse(
        int DonationId,
        DateTime DonationDate,
        string SupporterName,
        string DonationType,
        string AllocationLabel,
        decimal EstimatedValue,
        string? CurrencyCode);

    private sealed record AdminAllocationCoverageResponse(
        string ProgramArea,
        decimal AmountAllocated,
        decimal PercentAllocated);
}
