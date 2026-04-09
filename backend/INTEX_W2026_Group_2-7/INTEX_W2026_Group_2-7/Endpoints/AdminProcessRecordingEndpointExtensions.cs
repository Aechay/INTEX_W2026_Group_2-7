using INTEX_W2026_Group_2_7.Auth;
using INTEX_W2026_Group_2_7.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace INTEX_W2026_Group_2_7.Endpoints;

public static class AdminProcessRecordingEndpointExtensions
{
    public static IEndpointRouteBuilder MapAdminProcessRecordingEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/admin/process-recordings", GetProcessRecordingsAsync)
            .WithName("GetAdminProcessRecordings")
            .RequireAuthorization(AppPolicies.AdminOnly);

        endpoints.MapGet("/api/admin/process-recordings/{id:int}", GetProcessRecordingAsync)
            .WithName("GetAdminProcessRecording")
            .RequireAuthorization(AppPolicies.AdminOnly);

        endpoints.MapPost("/api/admin/process-recordings", CreateProcessRecordingAsync)
            .WithName("CreateAdminProcessRecording")
            .RequireAuthorization(AppPolicies.AdminOnly);

        endpoints.MapPut("/api/admin/process-recordings/{id:int}", UpdateProcessRecordingAsync)
            .WithName("UpdateAdminProcessRecording")
            .RequireAuthorization(AppPolicies.AdminOnly);

        endpoints.MapDelete("/api/admin/process-recordings/{id:int}", DeleteProcessRecordingAsync)
            .WithName("DeleteAdminProcessRecording")
            .RequireAuthorization(AppPolicies.AdminOnly);

        return endpoints;
    }

    private static async Task<Ok<ProcessRecordingCardDto[]>> GetProcessRecordingsAsync(
        OperationalDbContext dbContext,
        int? residentId,
        CancellationToken cancellationToken)
    {
        var query = dbContext.ProcessRecordings
            .AsNoTracking()
            .Join(
                dbContext.Residents.AsNoTracking(),
                recording => recording.ResidentId,
                resident => resident.ResidentId,
                (recording, resident) => new { recording, resident });

        if (residentId.HasValue)
        {
            query = query.Where(r => r.recording.ResidentId == residentId.Value);
        }

        var results = await query
            .OrderByDescending(r => r.recording.SessionDate)
            .Select(r => new ProcessRecordingCardDto(
                r.recording.RecordingId,
                r.recording.ResidentId,
                r.resident.ResidentFirstName == "" ? r.resident.InternalCode + " \u2014 " + r.resident.CaseControlNo : r.resident.ResidentFirstName + " " + r.resident.ResidentLastName,
                r.recording.SessionDate,
                r.recording.SocialWorker,
                r.recording.SessionType,
                r.recording.EmotionalStateObserved,
                r.recording.EmotionalStateEnd,
                r.recording.ProgressNoted,
                r.recording.ConcernsFlagged,
                r.recording.ReferralMade))
            .ToArrayAsync(cancellationToken);

        return TypedResults.Ok(results);
    }

    private static async Task<Results<Ok<ProcessRecordingDetailDto>, NotFound>> GetProcessRecordingAsync(
        OperationalDbContext dbContext,
        int id,
        CancellationToken cancellationToken)
    {
        var result = await dbContext.ProcessRecordings
            .AsNoTracking()
            .Join(
                dbContext.Residents.AsNoTracking(),
                recording => recording.ResidentId,
                resident => resident.ResidentId,
                (recording, resident) => new { recording, resident })
            .Where(r => r.recording.RecordingId == id)
            .Select(r => new ProcessRecordingDetailDto(
                r.recording.RecordingId,
                r.recording.ResidentId,
                r.resident.ResidentFirstName == "" ? r.resident.InternalCode + " \u2014 " + r.resident.CaseControlNo : r.resident.ResidentFirstName + " " + r.resident.ResidentLastName,
                r.recording.SessionDate,
                r.recording.SocialWorker,
                r.recording.SessionType,
                r.recording.SessionDurationMinutes,
                r.recording.EmotionalStateObserved,
                r.recording.EmotionalStateEnd,
                r.recording.SessionNarrative,
                r.recording.InterventionsApplied,
                r.recording.FollowUpActions,
                r.recording.ProgressNoted,
                r.recording.ConcernsFlagged,
                r.recording.ReferralMade,
                r.recording.NotesRestricted))
            .FirstOrDefaultAsync(cancellationToken);

        if (result is null)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(result);
    }

    private static async Task<Results<Created<ProcessRecordingCardDto>, ValidationProblem>> CreateProcessRecordingAsync(
        OperationalDbContext dbContext,
        ProcessRecordingUpsertRequest request,
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

        var recording = new ProcessRecording
        {
            ResidentId = request.ResidentId,
            SessionDate = request.SessionDate,
            SocialWorker = request.SocialWorker.Trim(),
            SessionType = request.SessionType?.Trim() ?? string.Empty,
            SessionDurationMinutes = request.SessionDurationMinutes,
            EmotionalStateObserved = request.EmotionalStateObserved?.Trim() ?? string.Empty,
            EmotionalStateEnd = request.EmotionalStateEnd?.Trim() ?? string.Empty,
            SessionNarrative = request.SessionNarrative?.Trim() ?? string.Empty,
            InterventionsApplied = request.InterventionsApplied?.Trim() ?? string.Empty,
            FollowUpActions = request.FollowUpActions?.Trim() ?? string.Empty,
            ProgressNoted = request.ProgressNoted,
            ConcernsFlagged = request.ConcernsFlagged,
            ReferralMade = request.ReferralMade,
            NotesRestricted = request.NotesRestricted?.Trim()
        };

        dbContext.ProcessRecordings.Add(recording);
        await dbContext.SaveChangesAsync(cancellationToken);

        var resident = await dbContext.Residents
            .AsNoTracking()
            .Where(r => r.ResidentId == recording.ResidentId)
            .Select(r => new { r.ResidentFirstName, r.ResidentLastName, r.InternalCode, r.CaseControlNo })
            .FirstOrDefaultAsync(cancellationToken);

        var displayName = resident is not null
            ? (string.IsNullOrEmpty(resident.ResidentFirstName)
                ? resident.InternalCode + " \u2014 " + resident.CaseControlNo
                : resident.ResidentFirstName + " " + resident.ResidentLastName)
            : string.Empty;

        return TypedResults.Created(
            $"/api/admin/process-recordings/{recording.RecordingId}",
            ToCardDto(recording, displayName));
    }

    private static async Task<Results<Ok<ProcessRecordingCardDto>, NotFound, ValidationProblem>> UpdateProcessRecordingAsync(
        OperationalDbContext dbContext,
        int id,
        ProcessRecordingUpsertRequest request,
        CancellationToken cancellationToken)
    {
        var recording = await dbContext.ProcessRecordings
            .FirstOrDefaultAsync(r => r.RecordingId == id, cancellationToken);

        if (recording is null)
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

        recording.ResidentId = request.ResidentId;
        recording.SessionDate = request.SessionDate;
        recording.SocialWorker = request.SocialWorker.Trim();
        recording.SessionType = request.SessionType?.Trim() ?? string.Empty;
        recording.SessionDurationMinutes = request.SessionDurationMinutes;
        recording.EmotionalStateObserved = request.EmotionalStateObserved?.Trim() ?? string.Empty;
        recording.EmotionalStateEnd = request.EmotionalStateEnd?.Trim() ?? string.Empty;
        recording.SessionNarrative = request.SessionNarrative?.Trim() ?? string.Empty;
        recording.InterventionsApplied = request.InterventionsApplied?.Trim() ?? string.Empty;
        recording.FollowUpActions = request.FollowUpActions?.Trim() ?? string.Empty;
        recording.ProgressNoted = request.ProgressNoted;
        recording.ConcernsFlagged = request.ConcernsFlagged;
        recording.ReferralMade = request.ReferralMade;
        recording.NotesRestricted = request.NotesRestricted?.Trim();

        await dbContext.SaveChangesAsync(cancellationToken);

        var resident = await dbContext.Residents
            .AsNoTracking()
            .Where(r => r.ResidentId == recording.ResidentId)
            .Select(r => new { r.ResidentFirstName, r.ResidentLastName, r.InternalCode, r.CaseControlNo })
            .FirstOrDefaultAsync(cancellationToken);

        var displayName = resident is not null
            ? (string.IsNullOrEmpty(resident.ResidentFirstName)
                ? resident.InternalCode + " \u2014 " + resident.CaseControlNo
                : resident.ResidentFirstName + " " + resident.ResidentLastName)
            : string.Empty;

        return TypedResults.Ok(ToCardDto(recording, displayName));
    }

    private static async Task<Results<NoContent, NotFound>> DeleteProcessRecordingAsync(
        OperationalDbContext dbContext,
        int id,
        CancellationToken cancellationToken)
    {
        var recording = await dbContext.ProcessRecordings
            .FirstOrDefaultAsync(r => r.RecordingId == id, cancellationToken);

        if (recording is null)
        {
            return TypedResults.NotFound();
        }

        dbContext.ProcessRecordings.Remove(recording);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.NoContent();
    }

    private static ProcessRecordingCardDto ToCardDto(ProcessRecording recording, string residentDisplayName) =>
        new(
            recording.RecordingId,
            recording.ResidentId,
            residentDisplayName,
            recording.SessionDate,
            recording.SocialWorker,
            recording.SessionType,
            recording.EmotionalStateObserved,
            recording.EmotionalStateEnd,
            recording.ProgressNoted,
            recording.ConcernsFlagged,
            recording.ReferralMade);
}

public sealed record ProcessRecordingCardDto(
    int RecordingId,
    int ResidentId,
    string ResidentDisplayName,
    DateTime SessionDate,
    string SocialWorker,
    string SessionType,
    string EmotionalStateObserved,
    string EmotionalStateEnd,
    bool ProgressNoted,
    bool ConcernsFlagged,
    bool ReferralMade);

public sealed record ProcessRecordingDetailDto(
    int RecordingId,
    int ResidentId,
    string ResidentDisplayName,
    DateTime SessionDate,
    string SocialWorker,
    string SessionType,
    int SessionDurationMinutes,
    string EmotionalStateObserved,
    string EmotionalStateEnd,
    string SessionNarrative,
    string InterventionsApplied,
    string FollowUpActions,
    bool ProgressNoted,
    bool ConcernsFlagged,
    bool ReferralMade,
    string? NotesRestricted);

public sealed record ProcessRecordingUpsertRequest(
    int ResidentId,
    DateTime SessionDate,
    string SocialWorker,
    string? SessionType,
    int SessionDurationMinutes,
    string? EmotionalStateObserved,
    string? EmotionalStateEnd,
    string? SessionNarrative,
    string? InterventionsApplied,
    string? FollowUpActions,
    bool ProgressNoted,
    bool ConcernsFlagged,
    bool ReferralMade,
    string? NotesRestricted);
