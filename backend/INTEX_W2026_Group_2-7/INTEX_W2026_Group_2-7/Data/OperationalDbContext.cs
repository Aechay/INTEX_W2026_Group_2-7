using Microsoft.EntityFrameworkCore;

namespace INTEX_W2026_Group_2_7.Data;

public class OperationalDbContext : DbContext
{
    public OperationalDbContext(DbContextOptions<OperationalDbContext> options)
        : base(options)
    {
    }

    public DbSet<Safehouse> Safehouses => Set<Safehouse>();
    public DbSet<Partner> Partners => Set<Partner>();
    public DbSet<PartnerAssignment> PartnerAssignments => Set<PartnerAssignment>();
    public DbSet<Supporter> Supporters => Set<Supporter>();
    public DbSet<Donation> Donations => Set<Donation>();
    public DbSet<InKindDonationItem> InKindDonationItems => Set<InKindDonationItem>();
    public DbSet<DonationAllocation> DonationAllocations => Set<DonationAllocation>();
    public DbSet<Resident> Residents => Set<Resident>();
    public DbSet<ProcessRecording> ProcessRecordings => Set<ProcessRecording>();
    public DbSet<HomeVisitation> HomeVisitations => Set<HomeVisitation>();
    public DbSet<EducationRecord> EducationRecords => Set<EducationRecord>();
    public DbSet<HealthWellbeingRecord> HealthWellbeingRecords => Set<HealthWellbeingRecord>();
    public DbSet<InterventionPlan> InterventionPlans => Set<InterventionPlan>();
    public DbSet<IncidentReport> IncidentReports => Set<IncidentReport>();
    public DbSet<SocialMediaPost> SocialMediaPosts => Set<SocialMediaPost>();
    public DbSet<SafehouseMonthlyMetric> SafehouseMonthlyMetrics => Set<SafehouseMonthlyMetric>();
    public DbSet<PublicImpactSnapshot> PublicImpactSnapshots => Set<PublicImpactSnapshot>();
    public DbSet<MlModelRun> MlModelRuns => Set<MlModelRun>();
    public DbSet<DonorChurnPrediction> DonorChurnPredictions => Set<DonorChurnPrediction>();
    public DbSet<ResidentRiskPrediction> ResidentRiskPredictions => Set<ResidentRiskPrediction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Safehouse>(entity =>
        {
            entity.ToTable("Safehouses");
            entity.HasKey(safehouse => safehouse.SafehouseId);
            entity.Property(safehouse => safehouse.SafehouseCode).HasMaxLength(32);
            entity.Property(safehouse => safehouse.Name).HasMaxLength(200);
            entity.Property(safehouse => safehouse.Region).HasMaxLength(64);
            entity.Property(safehouse => safehouse.City).HasMaxLength(128);
            entity.Property(safehouse => safehouse.Province).HasMaxLength(128);
            entity.Property(safehouse => safehouse.Country).HasMaxLength(128);
            entity.Property(safehouse => safehouse.OpenDate).HasColumnType("date");
            entity.Property(safehouse => safehouse.Status).HasMaxLength(32);
            entity.HasIndex(safehouse => safehouse.SafehouseCode).IsUnique();
        });

        modelBuilder.Entity<Partner>(entity =>
        {
            entity.ToTable("Partners");
            entity.HasKey(partner => partner.PartnerId);
            entity.Property(partner => partner.PartnerName).HasMaxLength(200);
            entity.Property(partner => partner.PartnerType).HasMaxLength(64);
            entity.Property(partner => partner.RoleType).HasMaxLength(64);
            entity.Property(partner => partner.ContactName).HasMaxLength(200);
            entity.Property(partner => partner.Email).HasMaxLength(256);
            entity.Property(partner => partner.Phone).HasMaxLength(64);
            entity.Property(partner => partner.Region).HasMaxLength(64);
            entity.Property(partner => partner.Status).HasMaxLength(32);
            entity.Property(partner => partner.StartDate).HasColumnType("date");
            entity.Property(partner => partner.EndDate).HasColumnType("date");
        });

        modelBuilder.Entity<PartnerAssignment>(entity =>
        {
            entity.ToTable("PartnerAssignments");
            entity.HasKey(assignment => assignment.AssignmentId);
            entity.Property(assignment => assignment.ProgramArea).HasMaxLength(64);
            entity.Property(assignment => assignment.AssignmentStart).HasColumnType("date");
            entity.Property(assignment => assignment.AssignmentEnd).HasColumnType("date");
            entity.Property(assignment => assignment.Status).HasMaxLength(32);
            entity.HasIndex(assignment => assignment.PartnerId);
            entity.HasIndex(assignment => assignment.SafehouseId);
            entity.HasOne<Partner>()
                .WithMany()
                .HasForeignKey(assignment => assignment.PartnerId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<Safehouse>()
                .WithMany()
                .HasForeignKey(assignment => assignment.SafehouseId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Supporter>(entity =>
        {
            entity.ToTable("Supporters");
            entity.HasKey(supporter => supporter.SupporterId);
            entity.Property(supporter => supporter.SupporterType).HasMaxLength(64);
            entity.Property(supporter => supporter.DisplayName).HasMaxLength(200);
            entity.Property(supporter => supporter.OrganizationName).HasMaxLength(200);
            entity.Property(supporter => supporter.FirstName).HasMaxLength(100);
            entity.Property(supporter => supporter.LastName).HasMaxLength(100);
            entity.Property(supporter => supporter.RelationshipType).HasMaxLength(64);
            entity.Property(supporter => supporter.Region).HasMaxLength(64);
            entity.Property(supporter => supporter.Country).HasMaxLength(128);
            entity.Property(supporter => supporter.Email).HasMaxLength(256);
            entity.Property(supporter => supporter.Phone).HasMaxLength(64);
            entity.Property(supporter => supporter.Status).HasMaxLength(32);
            entity.Property(supporter => supporter.CreatedAt).HasColumnType("datetime2");
            entity.Property(supporter => supporter.FirstDonationDate).HasColumnType("date");
            entity.Property(supporter => supporter.AcquisitionChannel).HasMaxLength(64);
            entity.HasIndex(supporter => supporter.Email);
        });

        modelBuilder.Entity<Donation>(entity =>
        {
            entity.ToTable("Donations");
            entity.HasKey(donation => donation.DonationId);
            entity.Property(donation => donation.DonationType).HasMaxLength(32);
            entity.Property(donation => donation.DonationDate).HasColumnType("date");
            entity.Property(donation => donation.CampaignName).HasMaxLength(128);
            entity.Property(donation => donation.ChannelSource).HasMaxLength(64);
            entity.Property(donation => donation.CurrencyCode).HasMaxLength(8);
            entity.Property(donation => donation.Amount).HasPrecision(18, 2);
            entity.Property(donation => donation.EstimatedValue).HasPrecision(18, 2);
            entity.Property(donation => donation.ImpactUnit).HasMaxLength(32);
            entity.HasIndex(donation => donation.SupporterId);
            entity.HasIndex(donation => donation.DonationDate);
            entity.HasIndex(donation => donation.ReferralPostId);
            entity.HasOne<Supporter>()
                .WithMany()
                .HasForeignKey(donation => donation.SupporterId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Partner>()
                .WithMany()
                .HasForeignKey(donation => donation.CreatedByPartnerId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne<SocialMediaPost>()
                .WithMany()
                .HasForeignKey(donation => donation.ReferralPostId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<InKindDonationItem>(entity =>
        {
            entity.ToTable("InKindDonationItems");
            entity.HasKey(item => item.ItemId);
            entity.Property(item => item.ItemName).HasMaxLength(200);
            entity.Property(item => item.ItemCategory).HasMaxLength(64);
            entity.Property(item => item.UnitOfMeasure).HasMaxLength(32);
            entity.Property(item => item.EstimatedUnitValue).HasPrecision(18, 2);
            entity.Property(item => item.IntendedUse).HasMaxLength(64);
            entity.Property(item => item.ReceivedCondition).HasMaxLength(32);
            entity.HasIndex(item => item.DonationId);
            entity.HasOne<Donation>()
                .WithMany()
                .HasForeignKey(item => item.DonationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DonationAllocation>(entity =>
        {
            entity.ToTable("DonationAllocations");
            entity.HasKey(allocation => allocation.AllocationId);
            entity.Property(allocation => allocation.ProgramArea).HasMaxLength(64);
            entity.Property(allocation => allocation.AmountAllocated).HasPrecision(18, 2);
            entity.Property(allocation => allocation.AllocationDate).HasColumnType("date");
            entity.HasIndex(allocation => allocation.DonationId);
            entity.HasIndex(allocation => allocation.SafehouseId);
            entity.HasOne<Donation>()
                .WithMany()
                .HasForeignKey(allocation => allocation.DonationId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<Safehouse>()
                .WithMany()
                .HasForeignKey(allocation => allocation.SafehouseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Resident>(entity =>
        {
            entity.ToTable("Residents");
            entity.HasKey(resident => resident.ResidentId);
            entity.Property(resident => resident.CaseControlNo).HasMaxLength(32);
            entity.Property(resident => resident.InternalCode).HasMaxLength(32);
            entity.Property(resident => resident.FirstName).HasColumnName("ResidentFirstName").HasMaxLength(100);
            entity.Property(resident => resident.LastName).HasColumnName("ResidentLastName").HasMaxLength(100);
            entity.Property(resident => resident.CaseStatus).HasMaxLength(32);
            entity.Property(resident => resident.Sex).HasMaxLength(8);
            entity.Property(resident => resident.DateOfBirth).HasColumnType("date");
            entity.Property(resident => resident.BirthStatus).HasMaxLength(32);
            entity.Property(resident => resident.PlaceOfBirth).HasMaxLength(128);
            entity.Property(resident => resident.Religion).HasMaxLength(64);
            entity.Property(resident => resident.CaseCategory).HasMaxLength(64);
            entity.Property(resident => resident.PwdType).HasMaxLength(128);
            entity.Property(resident => resident.SpecialNeedsDiagnosis).HasMaxLength(256);
            entity.Property(resident => resident.DateOfAdmission).HasColumnType("date");
            entity.Property(resident => resident.AgeUponAdmission).HasMaxLength(64);
            entity.Property(resident => resident.PresentAge).HasMaxLength(64);
            entity.Property(resident => resident.LengthOfStay).HasMaxLength(64);
            entity.Property(resident => resident.ReferralSource).HasMaxLength(64);
            entity.Property(resident => resident.ReferringAgencyPerson).HasMaxLength(200);
            entity.Property(resident => resident.DateColbRegistered).HasColumnType("date");
            entity.Property(resident => resident.DateColbObtained).HasColumnType("date");
            entity.Property(resident => resident.AssignedSocialWorker).HasMaxLength(128);
            entity.Property(resident => resident.InitialCaseAssessment).HasMaxLength(128);
            entity.Property(resident => resident.DateCaseStudyPrepared).HasColumnType("date");
            entity.Property(resident => resident.ReintegrationType).HasMaxLength(64);
            entity.Property(resident => resident.ReintegrationStatus).HasMaxLength(32);
            entity.Property(resident => resident.InitialRiskLevel).HasMaxLength(32);
            entity.Property(resident => resident.CurrentRiskLevel).HasMaxLength(32);
            entity.Property(resident => resident.DateEnrolled).HasColumnType("date");
            entity.Property(resident => resident.DateClosed).HasColumnType("date");
            entity.Property(resident => resident.CreatedAt).HasColumnType("datetime2");
            entity.HasIndex(resident => resident.SafehouseId);
            entity.HasIndex(resident => resident.CaseControlNo).IsUnique();
            entity.HasIndex(resident => resident.InternalCode).IsUnique();
            entity.HasOne<Safehouse>()
                .WithMany()
                .HasForeignKey(resident => resident.SafehouseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProcessRecording>(entity =>
        {
            entity.ToTable("ProcessRecordings");
            entity.HasKey(recording => recording.RecordingId);
            entity.Property(recording => recording.SessionDate).HasColumnType("date");
            entity.Property(recording => recording.SocialWorker).HasMaxLength(128);
            entity.Property(recording => recording.SessionType).HasMaxLength(32);
            entity.Property(recording => recording.EmotionalStateObserved).HasMaxLength(32);
            entity.Property(recording => recording.EmotionalStateEnd).HasMaxLength(32);
            entity.HasIndex(recording => recording.ResidentId);
            entity.HasIndex(recording => new { recording.ResidentId, recording.SessionDate });
            entity.HasOne<Resident>()
                .WithMany()
                .HasForeignKey(recording => recording.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<HomeVisitation>(entity =>
        {
            entity.ToTable("HomeVisitations");
            entity.HasKey(visitation => visitation.VisitationId);
            entity.Property(visitation => visitation.VisitDate).HasColumnType("date");
            entity.Property(visitation => visitation.SocialWorker).HasMaxLength(128);
            entity.Property(visitation => visitation.VisitType).HasMaxLength(64);
            entity.Property(visitation => visitation.FamilyCooperationLevel).HasMaxLength(32);
            entity.Property(visitation => visitation.VisitOutcome).HasMaxLength(32);
            entity.HasIndex(visitation => visitation.ResidentId);
            entity.HasIndex(visitation => new { visitation.ResidentId, visitation.VisitDate });
            entity.HasOne<Resident>()
                .WithMany()
                .HasForeignKey(visitation => visitation.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EducationRecord>(entity =>
        {
            entity.ToTable("EducationRecords");
            entity.HasKey(record => record.EducationRecordId);
            entity.Property(record => record.RecordDate).HasColumnType("date");
            entity.Property(record => record.EducationLevel).HasMaxLength(64);
            entity.Property(record => record.SchoolName).HasMaxLength(200);
            entity.Property(record => record.EnrollmentStatus).HasMaxLength(64);
            entity.Property(record => record.AttendanceRate).HasPrecision(5, 3);
            entity.Property(record => record.ProgressPercent).HasPrecision(5, 1);
            entity.Property(record => record.CompletionStatus).HasMaxLength(32);
            entity.HasIndex(record => record.ResidentId);
            entity.HasIndex(record => new { record.ResidentId, record.RecordDate }).IsUnique();
            entity.HasOne<Resident>()
                .WithMany()
                .HasForeignKey(record => record.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<HealthWellbeingRecord>(entity =>
        {
            entity.ToTable("HealthWellbeingRecords");
            entity.HasKey(record => record.HealthRecordId);
            entity.Property(record => record.RecordDate).HasColumnType("date");
            entity.Property(record => record.GeneralHealthScore).HasPrecision(5, 2);
            entity.Property(record => record.NutritionScore).HasPrecision(5, 2);
            entity.Property(record => record.SleepQualityScore).HasPrecision(5, 2);
            entity.Property(record => record.EnergyLevelScore).HasPrecision(5, 2);
            entity.Property(record => record.HeightCm).HasPrecision(6, 2);
            entity.Property(record => record.WeightKg).HasPrecision(6, 2);
            entity.Property(record => record.Bmi).HasPrecision(6, 2);
            entity.HasIndex(record => record.ResidentId);
            entity.HasIndex(record => new { record.ResidentId, record.RecordDate }).IsUnique();
            entity.HasOne<Resident>()
                .WithMany()
                .HasForeignKey(record => record.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<InterventionPlan>(entity =>
        {
            entity.ToTable("InterventionPlans");
            entity.HasKey(plan => plan.PlanId);
            entity.Property(plan => plan.PlanCategory).HasMaxLength(64);
            entity.Property(plan => plan.TargetValue).HasPrecision(10, 2);
            entity.Property(plan => plan.TargetDate).HasColumnType("date");
            entity.Property(plan => plan.Status).HasMaxLength(32);
            entity.Property(plan => plan.CaseConferenceDate).HasColumnType("date");
            entity.Property(plan => plan.CreatedAt).HasColumnType("datetime2");
            entity.Property(plan => plan.UpdatedAt).HasColumnType("datetime2");
            entity.HasIndex(plan => plan.ResidentId);
            entity.HasOne<Resident>()
                .WithMany()
                .HasForeignKey(plan => plan.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IncidentReport>(entity =>
        {
            entity.ToTable("IncidentReports");
            entity.HasKey(report => report.IncidentId);
            entity.Property(report => report.IncidentDate).HasColumnType("date");
            entity.Property(report => report.IncidentType).HasMaxLength(64);
            entity.Property(report => report.Severity).HasMaxLength(16);
            entity.Property(report => report.ResolutionDate).HasColumnType("date");
            entity.Property(report => report.ReportedBy).HasMaxLength(128);
            entity.HasIndex(report => report.ResidentId);
            entity.HasIndex(report => report.SafehouseId);
            entity.HasOne<Resident>()
                .WithMany()
                .HasForeignKey(report => report.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<Safehouse>()
                .WithMany()
                .HasForeignKey(report => report.SafehouseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SocialMediaPost>(entity =>
        {
            entity.ToTable("SocialMediaPosts");
            entity.HasKey(post => post.PostId);
            entity.Property(post => post.Platform).HasMaxLength(32);
            entity.Property(post => post.PlatformPostId).HasMaxLength(64);
            entity.Property(post => post.PostUrl).HasMaxLength(512);
            entity.Property(post => post.CreatedAt).HasColumnType("datetime2");
            entity.Property(post => post.DayOfWeek).HasMaxLength(16);
            entity.Property(post => post.PostType).HasMaxLength(64);
            entity.Property(post => post.MediaType).HasMaxLength(32);
            entity.Property(post => post.CallToActionType).HasMaxLength(32);
            entity.Property(post => post.ContentTopic).HasMaxLength(64);
            entity.Property(post => post.SentimentTone).HasMaxLength(32);
            entity.Property(post => post.CampaignName).HasMaxLength(128);
            entity.Property(post => post.BoostBudgetPhp).HasPrecision(18, 2);
            entity.Property(post => post.EngagementRate).HasPrecision(9, 4);
            entity.Property(post => post.EstimatedDonationValuePhp).HasPrecision(18, 2);
            entity.HasIndex(post => post.PlatformPostId).IsUnique();
            entity.HasIndex(post => post.CreatedAt);
        });

        modelBuilder.Entity<SafehouseMonthlyMetric>(entity =>
        {
            entity.ToTable("SafehouseMonthlyMetrics");
            entity.HasKey(metric => metric.MetricId);
            entity.Property(metric => metric.MonthStart).HasColumnType("date");
            entity.Property(metric => metric.MonthEnd).HasColumnType("date");
            entity.Property(metric => metric.AvgEducationProgress).HasPrecision(6, 2);
            entity.Property(metric => metric.AvgHealthScore).HasPrecision(5, 2);
            entity.HasIndex(metric => metric.SafehouseId);
            entity.HasIndex(metric => new { metric.SafehouseId, metric.MonthStart }).IsUnique();
            entity.HasOne<Safehouse>()
                .WithMany()
                .HasForeignKey(metric => metric.SafehouseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PublicImpactSnapshot>(entity =>
        {
            entity.ToTable("PublicImpactSnapshots");
            entity.HasKey(snapshot => snapshot.SnapshotId);
            entity.Property(snapshot => snapshot.SnapshotDate).HasColumnType("date");
            entity.Property(snapshot => snapshot.PublishedAt).HasColumnType("date");
            entity.HasIndex(snapshot => snapshot.SnapshotDate).IsUnique();
        });

        modelBuilder.Entity<MlModelRun>(entity =>
        {
            entity.ToTable("MlModelRuns");
            entity.HasKey(run => run.RunId);
            entity.Property(run => run.ModelName).HasMaxLength(100);
            entity.Property(run => run.ModelVersion).HasMaxLength(100);
            entity.Property(run => run.Status).HasMaxLength(32);
            entity.Property(run => run.ArtifactUri).HasMaxLength(512);
            entity.Property(run => run.MetricsJson).HasColumnType("nvarchar(max)");
            entity.HasIndex(run => new { run.ModelName, run.StartedAt });
        });

        modelBuilder.Entity<DonorChurnPrediction>(entity =>
        {
            entity.ToTable("DonorChurnPredictions");
            entity.HasKey(prediction => new { prediction.RunId, prediction.DonorId });
            entity.Property(prediction => prediction.RiskBand).HasMaxLength(16);
            entity.Property(prediction => prediction.ModelVersion).HasMaxLength(100);
            entity.HasIndex(prediction => prediction.ScoredAt);
            entity.HasIndex(prediction => prediction.DonorId);
            entity.HasOne<MlModelRun>()
                .WithMany()
                .HasForeignKey(prediction => prediction.RunId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<Supporter>()
                .WithMany()
                .HasForeignKey(prediction => prediction.DonorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ResidentRiskPrediction>(entity =>
        {
            entity.ToTable("ResidentRiskPredictions");
            entity.HasKey(prediction => new { prediction.RunId, prediction.ResidentId });
            entity.Property(prediction => prediction.PredictedRisk).HasMaxLength(16);
            entity.Property(prediction => prediction.ModelVersion).HasMaxLength(100);
            entity.HasIndex(prediction => prediction.ScoredAt);
            entity.HasIndex(prediction => prediction.ResidentId);
            entity.HasOne<MlModelRun>()
                .WithMany()
                .HasForeignKey(prediction => prediction.RunId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<Resident>()
                .WithMany()
                .HasForeignKey(prediction => prediction.ResidentId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
