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
            .Select(row => new
            {
                row.SupporterId,
                row.DisplayName,
                row.SupporterType,
                row.OrganizationName,
                row.FirstName,
                row.LastName,
                row.RelationshipType,
                row.Region,
                row.Country,
                row.Email,
                row.Phone,
                row.Status,
                row.AcquisitionChannel
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (supporter is null)
        {
            return TypedResults.NotFound();
        }

        var donations = await (
                from donation in dbContext.Donations.AsNoTracking()
                where donation.SupporterId == supporterId
                join allocation in dbContext.DonationAllocations.AsNoTracking()
                    on donation.DonationId equals allocation.DonationId into allocationGroup
                from allocation in allocationGroup.DefaultIfEmpty()
                orderby donation.DonationDate descending
                select new DonorDonationItem(
                    donation.DonationId,
                    donation.DonationDate,
                    donation.DonationType,
                    decimal.Round(donation.EstimatedValue, 2),
                    allocation == null ? null : allocation.ProgramArea,
                    allocation == null ? null : allocation.SafehouseId)
            )
            .ToListAsync(cancellationToken);

        var totalByDonor = donations.Sum(item => item.EstimatedValue);
        var totalDonationCount = donations.Count;
        var totalAll = await dbContext.Donations
            .AsNoTracking()
            .SumAsync(donation => donation.EstimatedValue, cancellationToken);

        return TypedResults.Ok(new AdminDonorDetailResponse(
            supporter.SupporterId,
            supporter.DisplayName,
            supporter.SupporterType,
            supporter.OrganizationName,
            supporter.FirstName,
            supporter.LastName,
            supporter.RelationshipType,
            supporter.Region,
            supporter.Country,
            supporter.Email,
            supporter.Phone,
            supporter.Status,
            supporter.AcquisitionChannel,
            totalDonationCount,
            decimal.Round(totalByDonor, 2),
            decimal.Round(totalAll, 2),
            donations));
    }

    private sealed record AdminDonorDetailResponse(
        int SupporterId,
        string DisplayName,
        string SupporterType,
        string? OrganizationName,
        string? FirstName,
        string? LastName,
        string RelationshipType,
        string Region,
        string Country,
        string Email,
        string Phone,
        string Status,
        string AcquisitionChannel,
        int TotalDonationCount,
        decimal TotalByDonor,
        decimal TotalAllDonations,
        IReadOnlyList<DonorDonationItem> Donations);

    private sealed record DonorDonationItem(
        int DonationId,
        DateTime DonationDate,
        string DonationType,
        decimal EstimatedValue,
        string? ProgramArea,
        int? SafehouseId);
}
