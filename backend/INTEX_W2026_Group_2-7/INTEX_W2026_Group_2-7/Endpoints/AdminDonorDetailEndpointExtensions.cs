using INTEX_W2026_Group_2_7.Auth;
using INTEX_W2026_Group_2_7.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace INTEX_W2026_Group_2_7.Endpoints;

public static class AdminDonorDetailEndpointExtensions
{
    public static IEndpointRouteBuilder MapAdminDonorDetailEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/admin/donations/donors/{supporterId:int}", GetDonorDetailAsync)
            .WithName("GetAdminDonorDetail")
            .RequireAuthorization(AppPolicies.AdminOnly)
            .Produces<AdminDonorDetailResponse>();

        return endpoints;
    }

    private static async Task<Results<Ok<AdminDonorDetailResponse>, NotFound>> GetDonorDetailAsync(
        OperationalDbContext dbContext,
        int supporterId,
        CancellationToken cancellationToken)
    {
        var supporter = await dbContext.Supporters
            .AsNoTracking()
            .Where(row => row.SupporterId == supporterId)
            .Select(row => new { row.SupporterId, row.DisplayName })
            .FirstOrDefaultAsync(cancellationToken);

        if (supporter is null)
        {
            return TypedResults.NotFound();
        }

        var donations = await dbContext.Donations
            .AsNoTracking()
            .Where(donation => donation.SupporterId == supporterId)
            .OrderByDescending(donation => donation.DonationDate)
            .Select(donation => new DonorDonationItem(
                donation.DonationId,
                donation.DonationDate,
                donation.DonationType,
                decimal.Round(donation.EstimatedValue, 2)))
            .ToListAsync(cancellationToken);

        var totalByDonor = donations.Sum(item => item.EstimatedValue);
        var totalDonationCount = donations.Count;
        var totalAll = await dbContext.Donations
            .AsNoTracking()
            .SumAsync(donation => donation.EstimatedValue, cancellationToken);

        return TypedResults.Ok(new AdminDonorDetailResponse(
            supporter.SupporterId,
            supporter.DisplayName,
            totalDonationCount,
            decimal.Round(totalByDonor, 2),
            decimal.Round(totalAll, 2),
            donations));
    }

    private sealed record AdminDonorDetailResponse(
        int SupporterId,
        string DisplayName,
        int TotalDonationCount,
        decimal TotalByDonor,
        decimal TotalAllDonations,
        IReadOnlyList<DonorDonationItem> Donations);

    private sealed record DonorDonationItem(
        int DonationId,
        DateTime DonationDate,
        string DonationType,
        decimal EstimatedValue);
}
