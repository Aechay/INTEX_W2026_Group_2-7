/*
    Reintegration-readiness SQL training view patch.
    Run this in PROD to ensure the existing ml training views expose
    the extra columns required by the reintegration readiness model.
*/

IF SCHEMA_ID(N'ml') IS NULL
    EXEC(N'CREATE SCHEMA ml AUTHORIZATION dbo;');
GO

CREATE OR ALTER VIEW ml.ResidentsTrainingView
AS
SELECT
    resident.ResidentId AS resident_id,
    resident.SafehouseId AS safehouse_id,
    resident.CaseStatus AS case_status,
    resident.CaseCategory AS case_category,
    CAST(resident.SubCatTrafficked AS bit) AS sub_cat_trafficked,
    CAST(resident.SubCatPhysicalAbuse AS bit) AS sub_cat_physical_abuse,
    CAST(resident.SubCatSexualAbuse AS bit) AS sub_cat_sexual_abuse,
    CAST(resident.SubCatOsaec AS bit) AS sub_cat_osaec,
    CAST(resident.SubCatAtRisk AS bit) AS sub_cat_at_risk,
    CAST(resident.SubCatStreetChild AS bit) AS sub_cat_street_child,
    CAST(resident.IsPwd AS bit) AS is_pwd,
    CAST(resident.HasSpecialNeeds AS bit) AS has_special_needs,
    CAST(resident.FamilyIs4Ps AS bit) AS family_is_4ps,
    CAST(resident.FamilySoloParent AS bit) AS family_solo_parent,
    CAST(resident.FamilyIndigenous AS bit) AS family_indigenous,
    CAST(resident.FamilyInformalSettler AS bit) AS family_informal_settler,
    resident.InitialRiskLevel AS initial_risk_level,
    resident.CurrentRiskLevel AS current_risk_level,
    resident.ReintegrationStatus AS reintegration_status,
    resident.ReintegrationType AS reintegration_type
FROM dbo.Residents AS resident;
GO

CREATE OR ALTER VIEW ml.EducationRecordsTrainingView
AS
SELECT
    education.ResidentId AS resident_id,
    education.RecordDate AS record_date,
    education.ProgressPercent AS progress_percent,
    education.AttendanceRate AS attendance_rate,
    education.CompletionStatus AS completion_status
FROM dbo.EducationRecords AS education;
GO
