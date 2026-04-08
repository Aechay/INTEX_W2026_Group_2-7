using INTEX_W2026_Group_2_7.Auth;
using INTEX_W2026_Group_2_7.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace INTEX_W2026_Group_2_7.Endpoints;

public static class AdminCaseloadEndpointExtensions
{
    public static IEndpointRouteBuilder MapAdminCaseloadEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/admin/caseload/residents", GetResidentsAsync)
            .WithName("GetAdminCaseloadResidents")
            .RequireAuthorization(AppPolicies.AdminOnly);

        endpoints.MapPost("/api/admin/caseload/residents", CreateResidentAsync)
            .WithName("CreateAdminCaseloadResident")
            .RequireAuthorization(AppPolicies.AdminOnly);

        endpoints.MapPut("/api/admin/caseload/residents/{residentId:int}", UpdateResidentAsync)
            .WithName("UpdateAdminCaseloadResident")
            .RequireAuthorization(AppPolicies.AdminOnly);

        return endpoints;
    }

    private static async Task<Ok<CaseloadResidentsResponse>> GetResidentsAsync(
        OperationalDbContext dbContext,
        string? search,
        string? caseStatus,
        int? safehouseId,
        string? caseCategory,
        string? assignedSocialWorker,
        string? reintegrationStatus,
        CancellationToken cancellationToken)
    {
        var safehouses = await dbContext.Safehouses
            .AsNoTracking()
            .OrderBy(s => s.Name)
            .Select(s => new SafehouseOptionDto(s.SafehouseId, s.Name))
            .ToArrayAsync(cancellationToken);

        var residentQuery = dbContext.Residents
            .AsNoTracking()
            .Join(
                dbContext.Safehouses.AsNoTracking(),
                resident => resident.SafehouseId,
                safehouse => safehouse.SafehouseId,
                (resident, safehouse) => new { resident, safehouse.Name });

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            residentQuery = residentQuery.Where(r =>
                (r.resident.FirstName ?? "").ToLower().Contains(term) ||
                (r.resident.LastName ?? "").ToLower().Contains(term) ||
                r.resident.InternalCode.ToLower().Contains(term) ||
                r.resident.CaseControlNo.ToLower().Contains(term) ||
                r.resident.AssignedSocialWorker.ToLower().Contains(term) ||
                r.Name.ToLower().Contains(term) ||
                r.resident.CaseCategory.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(caseStatus))
        {
            residentQuery = residentQuery.Where(r => r.resident.CaseStatus == caseStatus);
        }

        if (safehouseId.HasValue)
        {
            residentQuery = residentQuery.Where(r => r.resident.SafehouseId == safehouseId.Value);
        }

        if (!string.IsNullOrWhiteSpace(caseCategory))
        {
            residentQuery = residentQuery.Where(r => r.resident.CaseCategory == caseCategory);
        }

        if (!string.IsNullOrWhiteSpace(assignedSocialWorker))
        {
            residentQuery = residentQuery.Where(r => r.resident.AssignedSocialWorker == assignedSocialWorker);
        }

        if (!string.IsNullOrWhiteSpace(reintegrationStatus))
        {
            residentQuery = residentQuery.Where(r => r.resident.ReintegrationStatus == reintegrationStatus);
        }

        var residents = await residentQuery
            .OrderByDescending(r => r.resident.DateOfAdmission)
            .ThenBy(r => r.resident.InternalCode)
            .Select(r => new ResidentCardDto(
                r.resident.ResidentId,
                r.resident.InternalCode,
                r.resident.CaseControlNo,
                r.resident.FirstName,
                r.resident.LastName,
                r.resident.CaseStatus,
                r.resident.SafehouseId,
                r.Name,
                r.resident.Sex,
                r.resident.DateOfBirth,
                r.resident.PlaceOfBirth,
                r.resident.Religion,
                r.resident.CaseCategory,
                r.resident.SubCatOrphaned,
                r.resident.SubCatTrafficked,
                r.resident.SubCatChildLabor,
                r.resident.SubCatPhysicalAbuse,
                r.resident.SubCatSexualAbuse,
                r.resident.SubCatOsaec,
                r.resident.SubCatCicl,
                r.resident.SubCatAtRisk,
                r.resident.SubCatStreetChild,
                r.resident.SubCatChildWithHiv,
                r.resident.IsPwd,
                r.resident.PwdType,
                r.resident.HasSpecialNeeds,
                r.resident.SpecialNeedsDiagnosis,
                r.resident.FamilyIs4Ps,
                r.resident.FamilySoloParent,
                r.resident.FamilyIndigenous,
                r.resident.FamilyParentPwd,
                r.resident.FamilyInformalSettler,
                r.resident.DateOfAdmission,
                r.resident.AgeUponAdmission,
                r.resident.PresentAge,
                r.resident.LengthOfStay,
                r.resident.ReferralSource,
                r.resident.ReferringAgencyPerson,
                r.resident.DateColbRegistered,
                r.resident.DateColbObtained,
                r.resident.AssignedSocialWorker,
                r.resident.InitialCaseAssessment,
                r.resident.DateCaseStudyPrepared,
                r.resident.ReintegrationType,
                r.resident.ReintegrationStatus,
                r.resident.InitialRiskLevel,
                r.resident.CurrentRiskLevel,
                r.resident.DateEnrolled,
                r.resident.DateClosed,
                r.resident.NotesRestricted
            ))
            .ToArrayAsync(cancellationToken);

        var filterOptions = new CaseloadFilterOptionsDto(
            residents.Select(r => r.CaseStatus).Where(v => !string.IsNullOrWhiteSpace(v)).Distinct().OrderBy(v => v).ToArray(),
            residents.Select(r => r.CaseCategory).Where(v => !string.IsNullOrWhiteSpace(v)).Distinct().OrderBy(v => v).ToArray(),
            residents.Select(r => r.AssignedSocialWorker).Where(v => !string.IsNullOrWhiteSpace(v)).Distinct().OrderBy(v => v).ToArray(),
            residents.Select(r => r.ReintegrationStatus).Where(v => !string.IsNullOrWhiteSpace(v)).Distinct().OrderBy(v => v).ToArray()!
        );

        return TypedResults.Ok(new CaseloadResidentsResponse(residents, safehouses, filterOptions));
    }

    private static async Task<Results<Created<ResidentCardDto>, ValidationProblem>> CreateResidentAsync(
        OperationalDbContext dbContext,
        ResidentUpsertRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.InternalCode))
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["internalCode"] = ["Internal code is required."]
            });
        }

        var resident = new Resident
        {
            CaseControlNo = request.CaseControlNo?.Trim() ?? string.Empty,
            InternalCode = request.InternalCode.Trim(),
            FirstName = request.FirstName?.Trim(),
            LastName = request.LastName?.Trim(),
            SafehouseId = request.SafehouseId,
            CaseStatus = request.CaseStatus?.Trim() ?? "Active",
            Sex = request.Sex?.Trim() ?? "Female",
            DateOfBirth = request.DateOfBirth ?? DateTime.UtcNow.Date.AddYears(-13),
            BirthStatus = request.BirthStatus?.Trim() ?? string.Empty,
            PlaceOfBirth = request.PlaceOfBirth?.Trim() ?? string.Empty,
            Religion = request.Religion?.Trim() ?? string.Empty,
            CaseCategory = request.CaseCategory?.Trim() ?? string.Empty,
            SubCatOrphaned = request.SubCatOrphaned,
            SubCatTrafficked = request.SubCatTrafficked,
            SubCatChildLabor = request.SubCatChildLabor,
            SubCatPhysicalAbuse = request.SubCatPhysicalAbuse,
            SubCatSexualAbuse = request.SubCatSexualAbuse,
            SubCatOsaec = request.SubCatOsaec,
            SubCatCicl = request.SubCatCicl,
            SubCatAtRisk = request.SubCatAtRisk,
            SubCatStreetChild = request.SubCatStreetChild,
            SubCatChildWithHiv = request.SubCatChildWithHiv,
            IsPwd = request.IsPwd,
            PwdType = request.PwdType?.Trim(),
            HasSpecialNeeds = request.HasSpecialNeeds,
            SpecialNeedsDiagnosis = request.SpecialNeedsDiagnosis?.Trim(),
            FamilyIs4Ps = request.FamilyIs4Ps,
            FamilySoloParent = request.FamilySoloParent,
            FamilyIndigenous = request.FamilyIndigenous,
            FamilyParentPwd = request.FamilyParentPwd,
            FamilyInformalSettler = request.FamilyInformalSettler,
            DateOfAdmission = request.DateOfAdmission ?? DateTime.UtcNow.Date,
            AgeUponAdmission = request.AgeUponAdmission?.Trim() ?? string.Empty,
            PresentAge = request.PresentAge?.Trim() ?? string.Empty,
            LengthOfStay = request.LengthOfStay?.Trim() ?? string.Empty,
            ReferralSource = request.ReferralSource?.Trim() ?? string.Empty,
            ReferringAgencyPerson = request.ReferringAgencyPerson?.Trim(),
            DateColbRegistered = request.DateColbRegistered,
            DateColbObtained = request.DateColbObtained,
            AssignedSocialWorker = request.AssignedSocialWorker?.Trim() ?? string.Empty,
            InitialCaseAssessment = request.InitialCaseAssessment?.Trim() ?? string.Empty,
            DateCaseStudyPrepared = request.DateCaseStudyPrepared,
            ReintegrationType = request.ReintegrationType?.Trim(),
            ReintegrationStatus = request.ReintegrationStatus?.Trim(),
            InitialRiskLevel = request.InitialRiskLevel?.Trim() ?? string.Empty,
            CurrentRiskLevel = request.CurrentRiskLevel?.Trim() ?? string.Empty,
            DateEnrolled = request.DateEnrolled ?? DateTime.UtcNow.Date,
            DateClosed = request.DateClosed,
            CreatedAt = DateTime.UtcNow,
            NotesRestricted = request.NotesRestricted?.Trim()
        };

        dbContext.Residents.Add(resident);
        await dbContext.SaveChangesAsync(cancellationToken);

        var safehouseName = await dbContext.Safehouses
            .AsNoTracking()
            .Where(s => s.SafehouseId == resident.SafehouseId)
            .Select(s => s.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;

        return TypedResults.Created(
            $"/api/admin/caseload/residents/{resident.ResidentId}",
            ToResidentCardDto(resident, safehouseName));
    }

    private static async Task<Results<Ok<ResidentCardDto>, NotFound, ValidationProblem>> UpdateResidentAsync(
        OperationalDbContext dbContext,
        int residentId,
        ResidentUpsertRequest request,
        CancellationToken cancellationToken)
    {
        var resident = await dbContext.Residents.FirstOrDefaultAsync(r => r.ResidentId == residentId, cancellationToken);
        if (resident is null)
        {
            return TypedResults.NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.InternalCode))
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["internalCode"] = ["Internal code is required."]
            });
        }

        resident.CaseControlNo = request.CaseControlNo?.Trim() ?? string.Empty;
        resident.InternalCode = request.InternalCode.Trim();
        resident.FirstName = request.FirstName?.Trim();
        resident.LastName = request.LastName?.Trim();
        resident.SafehouseId = request.SafehouseId;
        resident.CaseStatus = request.CaseStatus?.Trim() ?? "Active";
        resident.Sex = request.Sex?.Trim() ?? "Female";
        resident.DateOfBirth = request.DateOfBirth ?? resident.DateOfBirth;
        resident.BirthStatus = request.BirthStatus?.Trim() ?? string.Empty;
        resident.PlaceOfBirth = request.PlaceOfBirth?.Trim() ?? string.Empty;
        resident.Religion = request.Religion?.Trim() ?? string.Empty;
        resident.CaseCategory = request.CaseCategory?.Trim() ?? string.Empty;
        resident.SubCatOrphaned = request.SubCatOrphaned;
        resident.SubCatTrafficked = request.SubCatTrafficked;
        resident.SubCatChildLabor = request.SubCatChildLabor;
        resident.SubCatPhysicalAbuse = request.SubCatPhysicalAbuse;
        resident.SubCatSexualAbuse = request.SubCatSexualAbuse;
        resident.SubCatOsaec = request.SubCatOsaec;
        resident.SubCatCicl = request.SubCatCicl;
        resident.SubCatAtRisk = request.SubCatAtRisk;
        resident.SubCatStreetChild = request.SubCatStreetChild;
        resident.SubCatChildWithHiv = request.SubCatChildWithHiv;
        resident.IsPwd = request.IsPwd;
        resident.PwdType = request.PwdType?.Trim();
        resident.HasSpecialNeeds = request.HasSpecialNeeds;
        resident.SpecialNeedsDiagnosis = request.SpecialNeedsDiagnosis?.Trim();
        resident.FamilyIs4Ps = request.FamilyIs4Ps;
        resident.FamilySoloParent = request.FamilySoloParent;
        resident.FamilyIndigenous = request.FamilyIndigenous;
        resident.FamilyParentPwd = request.FamilyParentPwd;
        resident.FamilyInformalSettler = request.FamilyInformalSettler;
        resident.DateOfAdmission = request.DateOfAdmission ?? resident.DateOfAdmission;
        resident.AgeUponAdmission = request.AgeUponAdmission?.Trim() ?? string.Empty;
        resident.PresentAge = request.PresentAge?.Trim() ?? string.Empty;
        resident.LengthOfStay = request.LengthOfStay?.Trim() ?? string.Empty;
        resident.ReferralSource = request.ReferralSource?.Trim() ?? string.Empty;
        resident.ReferringAgencyPerson = request.ReferringAgencyPerson?.Trim();
        resident.DateColbRegistered = request.DateColbRegistered;
        resident.DateColbObtained = request.DateColbObtained;
        resident.AssignedSocialWorker = request.AssignedSocialWorker?.Trim() ?? string.Empty;
        resident.InitialCaseAssessment = request.InitialCaseAssessment?.Trim() ?? string.Empty;
        resident.DateCaseStudyPrepared = request.DateCaseStudyPrepared;
        resident.ReintegrationType = request.ReintegrationType?.Trim();
        resident.ReintegrationStatus = request.ReintegrationStatus?.Trim();
        resident.InitialRiskLevel = request.InitialRiskLevel?.Trim() ?? string.Empty;
        resident.CurrentRiskLevel = request.CurrentRiskLevel?.Trim() ?? string.Empty;
        resident.DateEnrolled = request.DateEnrolled ?? resident.DateEnrolled;
        resident.DateClosed = request.DateClosed;
        resident.NotesRestricted = request.NotesRestricted?.Trim();

        await dbContext.SaveChangesAsync(cancellationToken);

        var safehouseName = await dbContext.Safehouses
            .AsNoTracking()
            .Where(s => s.SafehouseId == resident.SafehouseId)
            .Select(s => s.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;

        return TypedResults.Ok(ToResidentCardDto(resident, safehouseName));
    }

    private static ResidentCardDto ToResidentCardDto(Resident resident, string safehouseName) =>
        new(
            resident.ResidentId,
            resident.InternalCode,
            resident.CaseControlNo,
            resident.FirstName,
            resident.LastName,
            resident.CaseStatus,
            resident.SafehouseId,
            safehouseName,
            resident.Sex,
            resident.DateOfBirth,
            resident.PlaceOfBirth,
            resident.Religion,
            resident.CaseCategory,
            resident.SubCatOrphaned,
            resident.SubCatTrafficked,
            resident.SubCatChildLabor,
            resident.SubCatPhysicalAbuse,
            resident.SubCatSexualAbuse,
            resident.SubCatOsaec,
            resident.SubCatCicl,
            resident.SubCatAtRisk,
            resident.SubCatStreetChild,
            resident.SubCatChildWithHiv,
            resident.IsPwd,
            resident.PwdType,
            resident.HasSpecialNeeds,
            resident.SpecialNeedsDiagnosis,
            resident.FamilyIs4Ps,
            resident.FamilySoloParent,
            resident.FamilyIndigenous,
            resident.FamilyParentPwd,
            resident.FamilyInformalSettler,
            resident.DateOfAdmission,
            resident.AgeUponAdmission,
            resident.PresentAge,
            resident.LengthOfStay,
            resident.ReferralSource,
            resident.ReferringAgencyPerson,
            resident.DateColbRegistered,
            resident.DateColbObtained,
            resident.AssignedSocialWorker,
            resident.InitialCaseAssessment,
            resident.DateCaseStudyPrepared,
            resident.ReintegrationType,
            resident.ReintegrationStatus,
            resident.InitialRiskLevel,
            resident.CurrentRiskLevel,
            resident.DateEnrolled,
            resident.DateClosed,
            resident.NotesRestricted
        );
}

public sealed record CaseloadResidentsResponse(
    ResidentCardDto[] Residents,
    SafehouseOptionDto[] Safehouses,
    CaseloadFilterOptionsDto FilterOptions);

public sealed record SafehouseOptionDto(int SafehouseId, string Name);

public sealed record CaseloadFilterOptionsDto(
    string[] CaseStatuses,
    string[] CaseCategories,
    string[] AssignedSocialWorkers,
    string[] ReintegrationStatuses);

public sealed record ResidentCardDto(
    int ResidentId,
    string InternalCode,
    string CaseControlNo,
    string? FirstName,
    string? LastName,
    string CaseStatus,
    int SafehouseId,
    string SafehouseName,
    string Sex,
    DateTime DateOfBirth,
    string PlaceOfBirth,
    string Religion,
    string CaseCategory,
    bool SubCatOrphaned,
    bool SubCatTrafficked,
    bool SubCatChildLabor,
    bool SubCatPhysicalAbuse,
    bool SubCatSexualAbuse,
    bool SubCatOsaec,
    bool SubCatCicl,
    bool SubCatAtRisk,
    bool SubCatStreetChild,
    bool SubCatChildWithHiv,
    bool IsPwd,
    string? PwdType,
    bool HasSpecialNeeds,
    string? SpecialNeedsDiagnosis,
    bool FamilyIs4Ps,
    bool FamilySoloParent,
    bool FamilyIndigenous,
    bool FamilyParentPwd,
    bool FamilyInformalSettler,
    DateTime DateOfAdmission,
    string AgeUponAdmission,
    string PresentAge,
    string LengthOfStay,
    string ReferralSource,
    string? ReferringAgencyPerson,
    DateTime? DateColbRegistered,
    DateTime? DateColbObtained,
    string AssignedSocialWorker,
    string InitialCaseAssessment,
    DateTime? DateCaseStudyPrepared,
    string? ReintegrationType,
    string? ReintegrationStatus,
    string InitialRiskLevel,
    string CurrentRiskLevel,
    DateTime DateEnrolled,
    DateTime? DateClosed,
    string? NotesRestricted);

public sealed record ResidentUpsertRequest(
    string? CaseControlNo,
    string InternalCode,
    string? FirstName,
    string? LastName,
    int SafehouseId,
    string? CaseStatus,
    string? Sex,
    DateTime? DateOfBirth,
    string? BirthStatus,
    string? PlaceOfBirth,
    string? Religion,
    string? CaseCategory,
    bool SubCatOrphaned,
    bool SubCatTrafficked,
    bool SubCatChildLabor,
    bool SubCatPhysicalAbuse,
    bool SubCatSexualAbuse,
    bool SubCatOsaec,
    bool SubCatCicl,
    bool SubCatAtRisk,
    bool SubCatStreetChild,
    bool SubCatChildWithHiv,
    bool IsPwd,
    string? PwdType,
    bool HasSpecialNeeds,
    string? SpecialNeedsDiagnosis,
    bool FamilyIs4Ps,
    bool FamilySoloParent,
    bool FamilyIndigenous,
    bool FamilyParentPwd,
    bool FamilyInformalSettler,
    DateTime? DateOfAdmission,
    string? AgeUponAdmission,
    string? PresentAge,
    string? LengthOfStay,
    string? ReferralSource,
    string? ReferringAgencyPerson,
    DateTime? DateColbRegistered,
    DateTime? DateColbObtained,
    string? AssignedSocialWorker,
    string? InitialCaseAssessment,
    DateTime? DateCaseStudyPrepared,
    string? ReintegrationType,
    string? ReintegrationStatus,
    string? InitialRiskLevel,
    string? CurrentRiskLevel,
    DateTime? DateEnrolled,
    DateTime? DateClosed,
    string? NotesRestricted);
