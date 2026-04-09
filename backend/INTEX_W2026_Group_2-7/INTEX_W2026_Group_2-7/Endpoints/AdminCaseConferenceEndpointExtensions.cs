using INTEX_W2026_Group_2_7.Auth;
using INTEX_W2026_Group_2_7.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace INTEX_W2026_Group_2_7.Endpoints;

public static class AdminCaseConferenceEndpointExtensions
{
    public static IEndpointRouteBuilder MapAdminCaseConferenceEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/admin/case-conferences", GetCaseConferencesAsync)
            .WithName("GetAdminCaseConferences")
            .RequireAuthorization(AppPolicies.AdminOnly);

        endpoints.MapGet("/api/admin/case-conferences/{id:int}", GetCaseConferenceAsync)
            .WithName("GetAdminCaseConference")
            .RequireAuthorization(AppPolicies.AdminOnly);

        endpoints.MapPost("/api/admin/case-conferences", CreateCaseConferenceAsync)
            .WithName("CreateAdminCaseConference")
            .RequireAuthorization(AppPolicies.AdminOnly);

        endpoints.MapPut("/api/admin/case-conferences/{id:int}", UpdateCaseConferenceAsync)
            .WithName("UpdateAdminCaseConference")
            .RequireAuthorization(AppPolicies.AdminOnly);

        endpoints.MapDelete("/api/admin/case-conferences/{id:int}", DeleteCaseConferenceAsync)
            .WithName("DeleteAdminCaseConference")
            .RequireAuthorization(AppPolicies.AdminOnly);

        return endpoints;
    }

    private static async Task<Ok<CaseConferenceCardDto[]>> GetCaseConferencesAsync(
        OperationalDbContext dbContext,
        int? residentId,
        string? status,
        CancellationToken cancellationToken)
    {
        var query = dbContext.InterventionPlans
            .AsNoTracking()
            .Join(
                dbContext.Residents.AsNoTracking(),
                plan => plan.ResidentId,
                resident => resident.ResidentId,
                (plan, resident) => new { plan, resident });

        if (residentId.HasValue)
        {
            query = query.Where(r => r.plan.ResidentId == residentId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(r => r.plan.Status == status);
        }

        var results = await query
            .OrderByDescending(r => r.plan.CaseConferenceDate.HasValue)
            .ThenByDescending(r => r.plan.CaseConferenceDate)
            .ThenByDescending(r => r.plan.TargetDate)
            .Select(r => new CaseConferenceCardDto(
                r.plan.PlanId,
                r.plan.ResidentId,
                r.resident.ResidentFirstName == "" ? r.resident.InternalCode + " \u2014 " + r.resident.CaseControlNo : r.resident.ResidentFirstName + " " + r.resident.ResidentLastName,
                r.plan.PlanCategory,
                r.plan.Status,
                r.plan.TargetDate,
                r.plan.CaseConferenceDate,
                r.plan.ServicesProvided))
            .ToArrayAsync(cancellationToken);

        return TypedResults.Ok(results);
    }

    private static async Task<Results<Ok<CaseConferenceDetailDto>, NotFound>> GetCaseConferenceAsync(
        OperationalDbContext dbContext,
        int id,
        CancellationToken cancellationToken)
    {
        var result = await dbContext.InterventionPlans
            .AsNoTracking()
            .Join(
                dbContext.Residents.AsNoTracking(),
                plan => plan.ResidentId,
                resident => resident.ResidentId,
                (plan, resident) => new { plan, resident })
            .Where(r => r.plan.PlanId == id)
            .Select(r => new CaseConferenceDetailDto(
                r.plan.PlanId,
                r.plan.ResidentId,
                r.resident.ResidentFirstName == "" ? r.resident.InternalCode + " \u2014 " + r.resident.CaseControlNo : r.resident.ResidentFirstName + " " + r.resident.ResidentLastName,
                r.plan.PlanCategory,
                r.plan.PlanDescription,
                r.plan.ServicesProvided,
                r.plan.TargetValue,
                r.plan.TargetDate,
                r.plan.Status,
                r.plan.CaseConferenceDate,
                r.plan.CreatedAt,
                r.plan.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);

        if (result is null)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(result);
    }

    private static async Task<Results<Created<CaseConferenceCardDto>, ValidationProblem>> CreateCaseConferenceAsync(
        OperationalDbContext dbContext,
        CaseConferenceUpsertRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.PlanCategory))
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["planCategory"] = ["Plan category is required."]
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

        var plan = new InterventionPlan
        {
            ResidentId = request.ResidentId,
            PlanCategory = request.PlanCategory.Trim(),
            PlanDescription = request.PlanDescription?.Trim() ?? string.Empty,
            ServicesProvided = request.ServicesProvided?.Trim() ?? string.Empty,
            TargetValue = request.TargetValue,
            TargetDate = request.TargetDate,
            Status = request.Status?.Trim() ?? "Active",
            CaseConferenceDate = request.CaseConferenceDate,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        dbContext.InterventionPlans.Add(plan);
        await dbContext.SaveChangesAsync(cancellationToken);

        var resident = await dbContext.Residents
            .AsNoTracking()
            .Where(r => r.ResidentId == plan.ResidentId)
            .Select(r => new { r.ResidentFirstName, r.ResidentLastName, r.InternalCode, r.CaseControlNo })
            .FirstOrDefaultAsync(cancellationToken);

        var displayName = resident is not null
            ? (string.IsNullOrEmpty(resident.ResidentFirstName)
                ? resident.InternalCode + " \u2014 " + resident.CaseControlNo
                : resident.ResidentFirstName + " " + resident.ResidentLastName)
            : string.Empty;

        return TypedResults.Created(
            $"/api/admin/case-conferences/{plan.PlanId}",
            ToCardDto(plan, displayName));
    }

    private static async Task<Results<Ok<CaseConferenceCardDto>, NotFound, ValidationProblem>> UpdateCaseConferenceAsync(
        OperationalDbContext dbContext,
        int id,
        CaseConferenceUpsertRequest request,
        CancellationToken cancellationToken)
    {
        var plan = await dbContext.InterventionPlans
            .FirstOrDefaultAsync(p => p.PlanId == id, cancellationToken);

        if (plan is null)
        {
            return TypedResults.NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.PlanCategory))
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["planCategory"] = ["Plan category is required."]
            });
        }

        plan.ResidentId = request.ResidentId;
        plan.PlanCategory = request.PlanCategory.Trim();
        plan.PlanDescription = request.PlanDescription?.Trim() ?? string.Empty;
        plan.ServicesProvided = request.ServicesProvided?.Trim() ?? string.Empty;
        plan.TargetValue = request.TargetValue;
        plan.TargetDate = request.TargetDate;
        plan.Status = request.Status?.Trim() ?? "Active";
        plan.CaseConferenceDate = request.CaseConferenceDate;
        plan.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        var resident = await dbContext.Residents
            .AsNoTracking()
            .Where(r => r.ResidentId == plan.ResidentId)
            .Select(r => new { r.ResidentFirstName, r.ResidentLastName, r.InternalCode, r.CaseControlNo })
            .FirstOrDefaultAsync(cancellationToken);

        var displayName = resident is not null
            ? (string.IsNullOrEmpty(resident.ResidentFirstName)
                ? resident.InternalCode + " \u2014 " + resident.CaseControlNo
                : resident.ResidentFirstName + " " + resident.ResidentLastName)
            : string.Empty;

        return TypedResults.Ok(ToCardDto(plan, displayName));
    }

    private static async Task<Results<NoContent, NotFound>> DeleteCaseConferenceAsync(
        OperationalDbContext dbContext,
        int id,
        CancellationToken cancellationToken)
    {
        var plan = await dbContext.InterventionPlans
            .FirstOrDefaultAsync(p => p.PlanId == id, cancellationToken);

        if (plan is null)
        {
            return TypedResults.NotFound();
        }

        dbContext.InterventionPlans.Remove(plan);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.NoContent();
    }

    private static CaseConferenceCardDto ToCardDto(InterventionPlan plan, string residentDisplayName) =>
        new(
            plan.PlanId,
            plan.ResidentId,
            residentDisplayName,
            plan.PlanCategory,
            plan.Status,
            plan.TargetDate,
            plan.CaseConferenceDate,
            plan.ServicesProvided);
}

public sealed record CaseConferenceCardDto(
    int PlanId,
    int ResidentId,
    string ResidentDisplayName,
    string PlanCategory,
    string Status,
    DateTime TargetDate,
    DateTime? CaseConferenceDate,
    string ServicesProvided);

public sealed record CaseConferenceDetailDto(
    int PlanId,
    int ResidentId,
    string ResidentDisplayName,
    string PlanCategory,
    string PlanDescription,
    string ServicesProvided,
    decimal TargetValue,
    DateTime TargetDate,
    string Status,
    DateTime? CaseConferenceDate,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record CaseConferenceUpsertRequest(
    int ResidentId,
    string PlanCategory,
    string? PlanDescription,
    string? ServicesProvided,
    decimal TargetValue,
    DateTime TargetDate,
    string? Status,
    DateTime? CaseConferenceDate);
