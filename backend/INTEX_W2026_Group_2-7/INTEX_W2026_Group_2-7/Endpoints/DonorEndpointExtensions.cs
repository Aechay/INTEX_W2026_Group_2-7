using System.Security.Claims;
using INTEX_W2026_Group_2_7.Auth;
using INTEX_W2026_Group_2_7.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace INTEX_W2026_Group_2_7.Endpoints;

public static class DonorEndpointExtensions
{
    public static IEndpointRouteBuilder MapDonorEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/donor")
            .RequireAuthorization(AppPolicies.AuthenticatedUser);

        group.MapGet("/donations", async (
                ClaimsPrincipal principal,
                UserManager<ApplicationUser> userManager,
                OperationalDbContext operationalDbContext) =>
            {
                var user = await userManager.GetUserAsync(principal);
                var email = user?.Email?.Trim();
                if (string.IsNullOrWhiteSpace(email))
                {
                    return Results.BadRequest(new { detail = "The signed-in account does not have an email address." });
                }

                var normalizedEmail = email.ToUpperInvariant();

                var supporterIds = await operationalDbContext.Supporters
                    .Where(supporter =>
                        !string.IsNullOrWhiteSpace(supporter.Email) &&
                        supporter.Email.Trim().ToUpper() == normalizedEmail)
                    .Select(supporter => supporter.SupporterId)
                    .ToArrayAsync();

                if (supporterIds.Length == 0)
                {
                    return Results.Ok(new DonorDonationsResponse(
                        email,
                        0m,
                        0m,
                        []));
                }

                var donations = await operationalDbContext.Donations
                    .Where(donation => supporterIds.Contains(donation.SupporterId))
                    .OrderByDescending(donation => donation.DonationDate)
                    .Select(donation => new
                    {
                        donation.DonationId,
                        donation.DonationDate,
                        donation.DonationType,
                        donation.CampaignName,
                        donation.ChannelSource,
                        donation.CurrencyCode,
                        donation.Amount,
                        donation.EstimatedValue
                    })
                    .ToListAsync();

                if (donations.Count == 0)
                {
                    return Results.Ok(new DonorDonationsResponse(
                        email,
                        0m,
                        0m,
                        []));
                }

                var donationIds = donations
                    .Select(donation => donation.DonationId)
                    .ToArray();

                var allocationRows = await (
                    from allocation in operationalDbContext.DonationAllocations
                    join safehouse in operationalDbContext.Safehouses
                        on allocation.SafehouseId equals safehouse.SafehouseId
                    where donationIds.Contains(allocation.DonationId)
                    orderby allocation.AllocationDate descending, allocation.AllocationId
                    select new
                    {
                        allocation.DonationId,
                        allocation.ProgramArea,
                        allocation.AmountAllocated,
                        allocation.AllocationDate,
                        SafehouseName = safehouse.Name,
                        safehouse.City,
                        safehouse.Country
                    })
                    .ToListAsync();

                var allocationsByDonation = allocationRows
                    .GroupBy(row => row.DonationId)
                    .ToDictionary(
                        groupByDonation => groupByDonation.Key,
                        groupByDonation => groupByDonation
                            .Select(row => new DonationAllocationSummary(
                                row.ProgramArea,
                                row.AmountAllocated,
                                row.AllocationDate,
                                row.SafehouseName,
                                row.City,
                                row.Country))
                            .ToArray());

                var donationItems = donations
                    .Select(donation => new DonationHistoryItem(
                        donation.DonationId,
                        donation.DonationDate,
                        donation.DonationType,
                        donation.CampaignName,
                        donation.ChannelSource,
                        donation.CurrencyCode,
                        donation.Amount,
                        donation.EstimatedValue,
                        allocationsByDonation.GetValueOrDefault(donation.DonationId, [])))
                    .ToArray();

                var totalDonated = donationItems.Sum(item => item.Amount ?? 0m);
                var totalAllocated = allocationRows.Sum(row => row.AmountAllocated);

                return Results.Ok(new DonorDonationsResponse(
                    email,
                    totalDonated,
                    totalAllocated,
                    donationItems));
            })
            .WithName("GetDonorDonations");

        return app;
    }

    private sealed record DonorDonationsResponse(
        string Email,
        decimal TotalDonated,
        decimal TotalAllocated,
        IReadOnlyList<DonationHistoryItem> Donations);

    private sealed record DonationHistoryItem(
        int DonationId,
        DateTime DonationDate,
        string DonationType,
        string? CampaignName,
        string ChannelSource,
        string? CurrencyCode,
        decimal? Amount,
        decimal EstimatedValue,
        IReadOnlyList<DonationAllocationSummary> Allocations);

    private sealed record DonationAllocationSummary(
        string ProgramArea,
        decimal AmountAllocated,
        DateTime AllocationDate,
        string SafehouseName,
        string City,
        string Country);
}
