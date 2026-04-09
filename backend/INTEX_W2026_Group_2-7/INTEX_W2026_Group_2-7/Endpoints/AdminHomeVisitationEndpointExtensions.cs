using INTEX_W2026_Group_2_7.Auth;
using INTEX_W2026_Group_2_7.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace INTEX_W2026_Group_2_7.Endpoints;

public static class AdminHomeVisitationEndpointExtensions
{
    public static IEndpointRouteBuilder MapAdminHomeVisitationEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/admin/home-visitations", GetHomeVisitationsAsync)
            .WithName("GetAdminHomeVisitations")
            .RequireAuthorization(AppPolicies.AdminOnly);

        endpoints.MapGet("/api/admin/home-visitations/{id:int}", GetHomeVisitationAsync)
            .WithName("GetAdminHomeVisitation")
            .RequireAuthorization(AppPolicies.AdminOnly);

        endpoints.MapPost("/api/admin/home-visitations", CreateHomeVisitationAsync)
            .WithName("CreateAdminHomeVisitation")
            .RequireAuthorization(AppPolicies.AdminOnly);

        endpoints.MapPut("/api/admin/home-visitations/{id:int}", UpdateHomeVisitationAsync)
            .WithName("UpdateAdminHomeVisitation")
            .RequireAuthorization(AppPolicies.AdminOnly);

        endpoints.MapDelete("/api/admin/home-visitations/{id:int}", DeleteHomeVisitationAsync)
            .WithName("DeleteAdminHomeVisitation")
            .RequireAuthorization(AppPolicies.AdminOnly);

        return endpoints;
    }

    private static async Task<Ok<HomeVisitationCardDto[]>> GetHomeVisitationsAsync(
        OperationalDbContext dbContext,
        int? residentId,
        string? visitType,
        CancellationToken cancellationToken)
    {
        var query = dbContext.HomeVisitations
            .AsNoTracking()
            .Join(
                dbContext.Residents.AsNoTracking(),
                visitation => visitation.ResidentId,
                resident => resident.ResidentId,
                (visitation, resident) => new { visitation, resident });

        if (residentId.HasValue)
        {
            query = query.Where(r => r.visitation.ResidentId == residentId.Value);
        }

        if (!string.IsNullOrWhiteSpace(visitType))
        {
            query = query.Where(r => r.visitation.VisitType == visitType);
        }

        var results = await query
            .OrderByDescending(r => r.visitation.VisitDate)
            .Select(r => new HomeVisitationCardDto(
                r.visitation.VisitationId,
                r.visitation.ResidentId,
                r.resident.InternalCode + " \u2014 " + r.resident.CaseControlNo,
                r.visitation.VisitDate,
                r.visitation.SocialWorker,
                r.visitation.VisitType,
                r.visitation.FamilyCooperationLevel,
                r.visitation.SafetyConcernsNoted,
                r.visitation.FollowUpNeeded,
                r.visitation.VisitOutcome))
            .ToArrayAsync(cancellationToken);

        return TypedResults.Ok(results);
    }

    private static async Task<Results<Ok<HomeVisitationDetailDto>, NotFound>> GetHomeVisitationAsync(
        OperationalDbContext dbContext,
        int id,
        CancellationToken cancellationToken)
    {
        var result = await dbContext.HomeVisitations
            .AsNoTracking()
            .Join(
                dbContext.Residents.AsNoTracking(),
                visitation => visitation.ResidentId,
                resident => resident.ResidentId,
                (visitation, resident) => new { visitation, resident })
            .Where(r => r.visitation.VisitationId == id)
            .Select(r => new HomeVisitationDetailDto(
                r.visitation.VisitationId,
                r.visitation.ResidentId,
                r.resident.InternalCode + " \u2014 " + r.resident.CaseControlNo,
                r.visitation.VisitDate,
                r.visitation.SocialWorker,
                r.visitation.VisitType,
                r.visitation.LocationVisited,
                r.visitation.FamilyMembersPresent,
                r.visitation.Purpose,
                r.visitation.Observations,
                r.visitation.FamilyCooperationLevel,
                r.visitation.SafetyConcernsNoted,
                r.visitation.FollowUpNeeded,
                r.visitation.FollowUpNotes,
                r.visitation.VisitOutcome))
            .FirstOrDefaultAsync(cancellationToken);

        if (result is null)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(result);
    }

    private static async Task<Results<Created<HomeVisitationCardDto>, ValidationProblem>> CreateHomeVisitationAsync(
        OperationalDbContext dbContext,
        HomeVisitationUpsertRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.SocialWorker))
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["socialWorker"] = ["Social worker is required."]
            });
        }

        var residentExists = await dbContext.Residents
            .AsNoTracking()
            .AnyAsync(r => r.ResidentId == request.ResidentId, cancellationToken);

        if (!residentExists)
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["residentId"] = ["Resident not found."]
            });
        }

        var visitation = new HomeVisitation
        {
            ResidentId = request.ResidentId,
            VisitDate = request.VisitDate,
            SocialWorker = request.SocialWorker.Trim(),
            VisitType = request.VisitType?.Trim() ?? string.Empty,
            LocationVisited = request.LocationVisited?.Trim() ?? string.Empty,
            FamilyMembersPresent = request.FamilyMembersPresent?.Trim() ?? string.Empty,
            Purpose = request.Purpose?.Trim() ?? string.Empty,
            Observations = request.Observations?.Trim() ?? string.Empty,
            FamilyCooperationLevel = request.FamilyCooperationLevel?.Trim() ?? string.Empty,
            SafetyConcernsNoted = request.SafetyConcernsNoted,
            FollowUpNeeded = request.FollowUpNeeded,
            FollowUpNotes = request.FollowUpNotes?.Trim(),
            VisitOutcome = request.VisitOutcome?.Trim() ?? string.Empty
        };

        dbContext.HomeVisitations.Add(visitation);
        await dbContext.SaveChangesAsync(cancellationToken);

        var resident = await dbContext.Residents
            .AsNoTracking()
            .Where(r => r.ResidentId == visitation.ResidentId)
            .Select(r => new { r.InternalCode, r.CaseControlNo })
            .FirstOrDefaultAsync(cancellationToken);

        var displayName = resident is not null
            ? resident.InternalCode + " \u2014 " + resident.CaseControlNo
            : string.Empty;

        return TypedResults.Created(
            $"/api/admin/home-visitations/{visitation.VisitationId}",
            ToCardDto(visitation, displayName));
    }

    private static async Task<Results<Ok<HomeVisitationCardDto>, NotFound, ValidationProblem>> UpdateHomeVisitationAsync(
        OperationalDbContext dbContext,
        int id,
        HomeVisitationUpsertRequest request,
        CancellationToken cancellationToken)
    {
        var visitation = await dbContext.HomeVisitations
            .FirstOrDefaultAsync(v => v.VisitationId == id, cancellationToken);

        if (visitation is null)
        {
            return TypedResults.NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.SocialWorker))
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["socialWorker"] = ["Social worker is required."]
            });
        }

        visitation.ResidentId = request.ResidentId;
        visitation.VisitDate = request.VisitDate;
        visitation.SocialWorker = request.SocialWorker.Trim();
        visitation.VisitType = request.VisitType?.Trim() ?? string.Empty;
        visitation.LocationVisited = request.LocationVisited?.Trim() ?? string.Empty;
        visitation.FamilyMembersPresent = request.FamilyMembersPresent?.Trim() ?? string.Empty;
        visitation.Purpose = request.Purpose?.Trim() ?? string.Empty;
        visitation.Observations = request.Observations?.Trim() ?? string.Empty;
        visitation.FamilyCooperationLevel = request.FamilyCooperationLevel?.Trim() ?? string.Empty;
        visitation.SafetyConcernsNoted = request.SafetyConcernsNoted;
        visitation.FollowUpNeeded = request.FollowUpNeeded;
        visitation.FollowUpNotes = request.FollowUpNotes?.Trim();
        visitation.VisitOutcome = request.VisitOutcome?.Trim() ?? string.Empty;

        await dbContext.SaveChangesAsync(cancellationToken);

        var resident = await dbContext.Residents
            .AsNoTracking()
            .Where(r => r.ResidentId == visitation.ResidentId)
            .Select(r => new { r.InternalCode, r.CaseControlNo })
            .FirstOrDefaultAsync(cancellationToken);

        var displayName = resident is not null
            ? resident.InternalCode + " \u2014 " + resident.CaseControlNo
            : string.Empty;

        return TypedResults.Ok(ToCardDto(visitation, displayName));
    }

    private static async Task<Results<NoContent, NotFound>> DeleteHomeVisitationAsync(
        OperationalDbContext dbContext,
        int id,
        CancellationToken cancellationToken)
    {
        var visitation = await dbContext.HomeVisitations
            .FirstOrDefaultAsync(v => v.VisitationId == id, cancellationToken);

        if (visitation is null)
        {
            return TypedResults.NotFound();
        }

        dbContext.HomeVisitations.Remove(visitation);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.NoContent();
    }

    private static HomeVisitationCardDto ToCardDto(HomeVisitation visitation, string residentDisplayName) =>
        new(
            visitation.VisitationId,
            visitation.ResidentId,
            residentDisplayName,
            visitation.VisitDate,
            visitation.SocialWorker,
            visitation.VisitType,
            visitation.FamilyCooperationLevel,
            visitation.SafetyConcernsNoted,
            visitation.FollowUpNeeded,
            visitation.VisitOutcome);
}

public sealed record HomeVisitationCardDto(
    int VisitationId,
    int ResidentId,
    string ResidentDisplayName,
    DateTime VisitDate,
    string SocialWorker,
    string VisitType,
    string FamilyCooperationLevel,
    bool SafetyConcernsNoted,
    bool FollowUpNeeded,
    string VisitOutcome);

public sealed record HomeVisitationDetailDto(
    int VisitationId,
    int ResidentId,
    string ResidentDisplayName,
    DateTime VisitDate,
    string SocialWorker,
    string VisitType,
    string LocationVisited,
    string FamilyMembersPresent,
    string Purpose,
    string Observations,
    string FamilyCooperationLevel,
    bool SafetyConcernsNoted,
    bool FollowUpNeeded,
    string? FollowUpNotes,
    string VisitOutcome);

public sealed record HomeVisitationUpsertRequest(
    int ResidentId,
    DateTime VisitDate,
    string SocialWorker,
    string? VisitType,
    string? LocationVisited,
    string? FamilyMembersPresent,
    string? Purpose,
    string? Observations,
    string? FamilyCooperationLevel,
    bool SafetyConcernsNoted,
    bool FollowUpNeeded,
    string? FollowUpNotes,
    string? VisitOutcome);
