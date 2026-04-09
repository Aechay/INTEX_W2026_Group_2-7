using INTEX_W2026_Group_2_7.Data;
using Microsoft.EntityFrameworkCore;

namespace INTEX_W2026_Group_2_7.Endpoints;

public static class PublicDonationEndpointExtensions
{
    public static IEndpointRouteBuilder MapPublicDonationEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/api/public/donations", CreateDonationAsync)
            .WithName("CreatePublicDonation")
            .AllowAnonymous();

        return endpoints;
    }

    private static async Task<IResult> CreateDonationAsync(
        PublicDonationCreateRequest request,
        OperationalDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        var email = request.Email?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(request.Name)] = ["Name is required."]
            });
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(request.Email)] = ["Email is required."]
            });
        }

        if (request.Amount <= 0)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(request.Amount)] = ["Amount must be greater than 0."]
            });
        }

        var (firstName, lastName) = SplitName(name);
        var today = DateTime.UtcNow.Date;

        // Each website donation creates a supporter + donation row.
        var supporter = new Supporter
        {
            SupporterType = "MonetaryDonor",
            DisplayName = name,
            OrganizationName = null,
            FirstName = firstName,
            LastName = lastName,
            RelationshipType = "Website",
            Region = "Unknown",
            Country = "Dominican Republic",
            Email = email,
            Phone = string.Empty,
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            FirstDonationDate = today,
            AcquisitionChannel = "Website"
        };

        dbContext.Supporters.Add(supporter);
        await dbContext.SaveChangesAsync(cancellationToken);

        var donation = new Donation
        {
            SupporterId = supporter.SupporterId,
            DonationType = "Monetary",
            DonationDate = today,
            IsRecurring = false,
            CampaignName = null,
            ChannelSource = "Website",
            CurrencyCode = "DOP",
            Amount = request.Amount,
            EstimatedValue = request.Amount,
            ImpactUnit = "Currency",
            Notes = null,
            CreatedByPartnerId = null,
            ReferralPostId = null
        };

        dbContext.Donations.Add(donation);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(new PublicDonationCreateResponse(
            supporter.SupporterId,
            donation.DonationId,
            donation.Amount ?? 0m,
            donation.DonationDate));
    }

    private static (string? FirstName, string? LastName) SplitName(string displayName)
    {
        var parts = displayName
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        return parts.Length switch
        {
            0 => (null, null),
            1 => (parts[0], null),
            _ => (parts[0], string.Join(' ', parts.Skip(1)))
        };
    }
}

public sealed record PublicDonationCreateRequest(
    string Name,
    string Email,
    decimal Amount);

public sealed record PublicDonationCreateResponse(
    int SupporterId,
    int DonationId,
    decimal Amount,
    DateTime DonationDate);
