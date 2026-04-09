namespace INTEX_W2026_Group_2_7.Data;

public sealed class Safehouse
{
    public int SafehouseId { get; set; }
    public string SafehouseCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public DateTime OpenDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int CapacityGirls { get; set; }
    public int CapacityStaff { get; set; }
    public int CurrentOccupancy { get; set; }
    public string? Notes { get; set; }
}

public sealed class Partner
{
    public int PartnerId { get; set; }
    public string PartnerName { get; set; } = string.Empty;
    public string PartnerType { get; set; } = string.Empty;
    public string RoleType { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Notes { get; set; }
}

public sealed class PartnerAssignment
{
    public int AssignmentId { get; set; }
    public int PartnerId { get; set; }
    public int? SafehouseId { get; set; }
    public string ProgramArea { get; set; } = string.Empty;
    public DateTime AssignmentStart { get; set; }
    public DateTime? AssignmentEnd { get; set; }
    public string? ResponsibilityNotes { get; set; }
    public bool IsPrimary { get; set; }
    public string Status { get; set; } = string.Empty;
}

public sealed class Supporter
{
    public int SupporterId { get; set; }
    public string SupporterType { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? OrganizationName { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string RelationshipType { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? FirstDonationDate { get; set; }
    public string AcquisitionChannel { get; set; } = string.Empty;
}

public sealed class Donation
{
    public int DonationId { get; set; }
    public int SupporterId { get; set; }
    public string DonationType { get; set; } = string.Empty;
    public DateTime DonationDate { get; set; }
    public bool IsRecurring { get; set; }
    public string? CampaignName { get; set; }
    public string ChannelSource { get; set; } = string.Empty;
    public string? CurrencyCode { get; set; }
    public decimal? Amount { get; set; }
    public decimal EstimatedValue { get; set; }
    public string ImpactUnit { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public int? CreatedByPartnerId { get; set; }
    public int? ReferralPostId { get; set; }
}

public sealed class InKindDonationItem
{
    public int ItemId { get; set; }
    public int DonationId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemCategory { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public decimal EstimatedUnitValue { get; set; }
    public string IntendedUse { get; set; } = string.Empty;
    public string ReceivedCondition { get; set; } = string.Empty;
}

public sealed class DonationAllocation
{
    public int AllocationId { get; set; }
    public int DonationId { get; set; }
    public int SafehouseId { get; set; }
    public string ProgramArea { get; set; } = string.Empty;
    public decimal AmountAllocated { get; set; }
    public DateTime AllocationDate { get; set; }
    public string? AllocationNotes { get; set; }
}

public sealed class Resident
{
    public int ResidentId { get; set; }
    public string ResidentFirstName { get; set; } = string.Empty;
    public string ResidentLastName { get; set; } = string.Empty;
    public string CaseControlNo { get; set; } = string.Empty;
    public string InternalCode { get; set; } = string.Empty;
    public int SafehouseId { get; set; }
    public string CaseStatus { get; set; } = string.Empty;
    public string Sex { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string BirthStatus { get; set; } = string.Empty;
    public string PlaceOfBirth { get; set; } = string.Empty;
    public string Religion { get; set; } = string.Empty;
    public string CaseCategory { get; set; } = string.Empty;
    public bool SubCatOrphaned { get; set; }
    public bool SubCatTrafficked { get; set; }
    public bool SubCatChildLabor { get; set; }
    public bool SubCatPhysicalAbuse { get; set; }
    public bool SubCatSexualAbuse { get; set; }
    public bool SubCatOsaec { get; set; }
    public bool SubCatCicl { get; set; }
    public bool SubCatAtRisk { get; set; }
    public bool SubCatStreetChild { get; set; }
    public bool SubCatChildWithHiv { get; set; }
    public bool IsPwd { get; set; }
    public string? PwdType { get; set; }
    public bool HasSpecialNeeds { get; set; }
    public string? SpecialNeedsDiagnosis { get; set; }
    public bool FamilyIs4Ps { get; set; }
    public bool FamilySoloParent { get; set; }
    public bool FamilyIndigenous { get; set; }
    public bool FamilyParentPwd { get; set; }
    public bool FamilyInformalSettler { get; set; }
    public DateTime DateOfAdmission { get; set; }
    public string AgeUponAdmission { get; set; } = string.Empty;
    public string PresentAge { get; set; } = string.Empty;
    public string LengthOfStay { get; set; } = string.Empty;
    public string ReferralSource { get; set; } = string.Empty;
    public string? ReferringAgencyPerson { get; set; }
    public DateTime? DateColbRegistered { get; set; }
    public DateTime? DateColbObtained { get; set; }
    public string AssignedSocialWorker { get; set; } = string.Empty;
    public string InitialCaseAssessment { get; set; } = string.Empty;
    public DateTime? DateCaseStudyPrepared { get; set; }
    public string? ReintegrationType { get; set; }
    public string? ReintegrationStatus { get; set; }
    public string InitialRiskLevel { get; set; } = string.Empty;
    public string CurrentRiskLevel { get; set; } = string.Empty;
    public DateTime DateEnrolled { get; set; }
    public DateTime? DateClosed { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? NotesRestricted { get; set; }
}

public sealed class ProcessRecording
{
    public int RecordingId { get; set; }
    public int ResidentId { get; set; }
    public DateTime SessionDate { get; set; }
    public string SocialWorker { get; set; } = string.Empty;
    public string SessionType { get; set; } = string.Empty;
    public int SessionDurationMinutes { get; set; }
    public string EmotionalStateObserved { get; set; } = string.Empty;
    public string EmotionalStateEnd { get; set; } = string.Empty;
    public string SessionNarrative { get; set; } = string.Empty;
    public string InterventionsApplied { get; set; } = string.Empty;
    public string FollowUpActions { get; set; } = string.Empty;
    public bool ProgressNoted { get; set; }
    public bool ConcernsFlagged { get; set; }
    public bool ReferralMade { get; set; }
    public string? NotesRestricted { get; set; }
}

public sealed class HomeVisitation
{
    public int VisitationId { get; set; }
    public int ResidentId { get; set; }
    public DateTime VisitDate { get; set; }
    public string SocialWorker { get; set; } = string.Empty;
    public string VisitType { get; set; } = string.Empty;
    public string LocationVisited { get; set; } = string.Empty;
    public string FamilyMembersPresent { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public string Observations { get; set; } = string.Empty;
    public string FamilyCooperationLevel { get; set; } = string.Empty;
    public bool SafetyConcernsNoted { get; set; }
    public bool FollowUpNeeded { get; set; }
    public string? FollowUpNotes { get; set; }
    public string VisitOutcome { get; set; } = string.Empty;
}

public sealed class EducationRecord
{
    public int EducationRecordId { get; set; }
    public int ResidentId { get; set; }
    public DateTime RecordDate { get; set; }
    public string EducationLevel { get; set; } = string.Empty;
    public string SchoolName { get; set; } = string.Empty;
    public string EnrollmentStatus { get; set; } = string.Empty;
    public decimal AttendanceRate { get; set; }
    public decimal ProgressPercent { get; set; }
    public string CompletionStatus { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public sealed class HealthWellbeingRecord
{
    public int HealthRecordId { get; set; }
    public int ResidentId { get; set; }
    public DateTime RecordDate { get; set; }
    public decimal GeneralHealthScore { get; set; }
    public decimal NutritionScore { get; set; }
    public decimal SleepQualityScore { get; set; }
    public decimal EnergyLevelScore { get; set; }
    public decimal HeightCm { get; set; }
    public decimal WeightKg { get; set; }
    public decimal Bmi { get; set; }
    public bool MedicalCheckupDone { get; set; }
    public bool DentalCheckupDone { get; set; }
    public bool PsychologicalCheckupDone { get; set; }
    public string? Notes { get; set; }
}

public sealed class InterventionPlan
{
    public int PlanId { get; set; }
    public int ResidentId { get; set; }
    public string PlanCategory { get; set; } = string.Empty;
    public string PlanDescription { get; set; } = string.Empty;
    public string ServicesProvided { get; set; } = string.Empty;
    public decimal TargetValue { get; set; }
    public DateTime TargetDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? CaseConferenceDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class IncidentReport
{
    public int IncidentId { get; set; }
    public int ResidentId { get; set; }
    public int SafehouseId { get; set; }
    public DateTime IncidentDate { get; set; }
    public string IncidentType { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ResponseTaken { get; set; } = string.Empty;
    public bool Resolved { get; set; }
    public DateTime? ResolutionDate { get; set; }
    public string ReportedBy { get; set; } = string.Empty;
    public bool FollowUpRequired { get; set; }
}

public sealed class SocialMediaPost
{
    public int PostId { get; set; }
    public string Platform { get; set; } = string.Empty;
    public string? PlatformPostId { get; set; }
    public string? PostUrl { get; set; }
    public string PublishStatus { get; set; } = "Published";
    public DateTime CreatedAt { get; set; }
    public DateTime? PublishedAtUtc { get; set; }
    public string DayOfWeek { get; set; } = string.Empty;
    public int PostHour { get; set; }
    public string PostType { get; set; } = string.Empty;
    public string MediaType { get; set; } = string.Empty;
    public string Caption { get; set; } = string.Empty;
    public string? Hashtags { get; set; }
    public int NumHashtags { get; set; }
    public int MentionsCount { get; set; }
    public bool HasCallToAction { get; set; }
    public string? CallToActionType { get; set; }
    public string? CallToActionUrl { get; set; }
    public string? AltText { get; set; }
    public string? MediaAssetUrlsJson { get; set; }
    public string? PlatformMetadataJson { get; set; }
    public string ContentTopic { get; set; } = string.Empty;
    public string SentimentTone { get; set; } = string.Empty;
    public int CaptionLength { get; set; }
    public bool FeaturesResidentStory { get; set; }
    public string? CampaignName { get; set; }
    public bool IsBoosted { get; set; }
    public decimal? BoostBudgetPhp { get; set; }
    public int Impressions { get; set; }
    public int Reach { get; set; }
    public int Likes { get; set; }
    public int Comments { get; set; }
    public int Shares { get; set; }
    public int Saves { get; set; }
    public int ClickThroughs { get; set; }
    public int? VideoViews { get; set; }
    public decimal EngagementRate { get; set; }
    public int ProfileVisits { get; set; }
    public int DonationReferrals { get; set; }
    public decimal EstimatedDonationValuePhp { get; set; }
    public decimal? PredictedDonationValuePhp { get; set; }
    public string? PredictionModelVersion { get; set; }
    public DateTimeOffset? PredictionScoredAtUtc { get; set; }
    public int FollowerCountAtPost { get; set; }
    public DateTime? LastMetricsUpdatedAtUtc { get; set; }
    public int? WatchTimeSeconds { get; set; }
    public int? AvgViewDurationSeconds { get; set; }
    public int? SubscriberCountAtPost { get; set; }
    public int? Forwards { get; set; }
}

public sealed class SafehouseMonthlyMetric
{
    public int MetricId { get; set; }
    public int SafehouseId { get; set; }
    public DateTime MonthStart { get; set; }
    public DateTime MonthEnd { get; set; }
    public int ActiveResidents { get; set; }
    public decimal? AvgEducationProgress { get; set; }
    public decimal? AvgHealthScore { get; set; }
    public int ProcessRecordingCount { get; set; }
    public int HomeVisitationCount { get; set; }
    public int IncidentCount { get; set; }
    public string? Notes { get; set; }
}

public sealed class PublicImpactSnapshot
{
    public int SnapshotId { get; set; }
    public DateTime SnapshotDate { get; set; }
    public string Headline { get; set; } = string.Empty;
    public string SummaryText { get; set; } = string.Empty;
    public string MetricPayloadJson { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
    public DateTime PublishedAt { get; set; }
}
