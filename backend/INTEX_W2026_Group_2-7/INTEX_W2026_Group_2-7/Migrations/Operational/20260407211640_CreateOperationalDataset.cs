using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.VisualBasic.FileIO;

#nullable disable

namespace INTEX_W2026_Group_2_7.Migrations.Operational
{
    /// <inheritdoc />
    public partial class CreateOperationalDataset : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MlModelRuns",
                columns: table => new
                {
                    RunId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ModelName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ModelVersion = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    StartedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    MetricsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ArtifactUri = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MlModelRuns", x => x.RunId);
                });

            migrationBuilder.CreateTable(
                name: "Partners",
                columns: table => new
                {
                    PartnerId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PartnerName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PartnerType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    RoleType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ContactName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Region = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    StartDate = table.Column<DateTime>(type: "date", nullable: false),
                    EndDate = table.Column<DateTime>(type: "date", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Partners", x => x.PartnerId);
                });

            migrationBuilder.CreateTable(
                name: "PublicImpactSnapshots",
                columns: table => new
                {
                    SnapshotId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SnapshotDate = table.Column<DateTime>(type: "date", nullable: false),
                    Headline = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SummaryText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MetricPayloadJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsPublished = table.Column<bool>(type: "bit", nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PublicImpactSnapshots", x => x.SnapshotId);
                });

            migrationBuilder.CreateTable(
                name: "Safehouses",
                columns: table => new
                {
                    SafehouseId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SafehouseCode = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Region = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    City = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Province = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Country = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    OpenDate = table.Column<DateTime>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    CapacityGirls = table.Column<int>(type: "int", nullable: false),
                    CapacityStaff = table.Column<int>(type: "int", nullable: false),
                    CurrentOccupancy = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Safehouses", x => x.SafehouseId);
                });

            migrationBuilder.CreateTable(
                name: "SocialMediaPosts",
                columns: table => new
                {
                    PostId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Platform = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    PlatformPostId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    PostUrl = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DayOfWeek = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    PostHour = table.Column<int>(type: "int", nullable: false),
                    PostType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    MediaType = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Caption = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Hashtags = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NumHashtags = table.Column<int>(type: "int", nullable: false),
                    MentionsCount = table.Column<int>(type: "int", nullable: false),
                    HasCallToAction = table.Column<bool>(type: "bit", nullable: false),
                    CallToActionType = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                    ContentTopic = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    SentimentTone = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    CaptionLength = table.Column<int>(type: "int", nullable: false),
                    FeaturesResidentStory = table.Column<bool>(type: "bit", nullable: false),
                    CampaignName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    IsBoosted = table.Column<bool>(type: "bit", nullable: false),
                    BoostBudgetPhp = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    Impressions = table.Column<int>(type: "int", nullable: false),
                    Reach = table.Column<int>(type: "int", nullable: false),
                    Likes = table.Column<int>(type: "int", nullable: false),
                    Comments = table.Column<int>(type: "int", nullable: false),
                    Shares = table.Column<int>(type: "int", nullable: false),
                    Saves = table.Column<int>(type: "int", nullable: false),
                    ClickThroughs = table.Column<int>(type: "int", nullable: false),
                    VideoViews = table.Column<int>(type: "int", nullable: true),
                    EngagementRate = table.Column<decimal>(type: "decimal(9,4)", precision: 9, scale: 4, nullable: false),
                    ProfileVisits = table.Column<int>(type: "int", nullable: false),
                    DonationReferrals = table.Column<int>(type: "int", nullable: false),
                    EstimatedDonationValuePhp = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    FollowerCountAtPost = table.Column<int>(type: "int", nullable: false),
                    WatchTimeSeconds = table.Column<int>(type: "int", nullable: true),
                    AvgViewDurationSeconds = table.Column<int>(type: "int", nullable: true),
                    SubscriberCountAtPost = table.Column<int>(type: "int", nullable: true),
                    Forwards = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialMediaPosts", x => x.PostId);
                });

            migrationBuilder.CreateTable(
                name: "Supporters",
                columns: table => new
                {
                    SupporterId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SupporterType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    OrganizationName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    FirstName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LastName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RelationshipType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Region = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Country = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FirstDonationDate = table.Column<DateTime>(type: "date", nullable: true),
                    AcquisitionChannel = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Supporters", x => x.SupporterId);
                });

            migrationBuilder.CreateTable(
                name: "PartnerAssignments",
                columns: table => new
                {
                    AssignmentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PartnerId = table.Column<int>(type: "int", nullable: false),
                    SafehouseId = table.Column<int>(type: "int", nullable: true),
                    ProgramArea = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    AssignmentStart = table.Column<DateTime>(type: "date", nullable: false),
                    AssignmentEnd = table.Column<DateTime>(type: "date", nullable: true),
                    ResponsibilityNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsPrimary = table.Column<bool>(type: "bit", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PartnerAssignments", x => x.AssignmentId);
                    table.ForeignKey(
                        name: "FK_PartnerAssignments_Partners_PartnerId",
                        column: x => x.PartnerId,
                        principalTable: "Partners",
                        principalColumn: "PartnerId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PartnerAssignments_Safehouses_SafehouseId",
                        column: x => x.SafehouseId,
                        principalTable: "Safehouses",
                        principalColumn: "SafehouseId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Residents",
                columns: table => new
                {
                    ResidentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CaseControlNo = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    InternalCode = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    SafehouseId = table.Column<int>(type: "int", nullable: false),
                    CaseStatus = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Sex = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: false),
                    DateOfBirth = table.Column<DateTime>(type: "date", nullable: false),
                    BirthStatus = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    PlaceOfBirth = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Religion = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    CaseCategory = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    SubCatOrphaned = table.Column<bool>(type: "bit", nullable: false),
                    SubCatTrafficked = table.Column<bool>(type: "bit", nullable: false),
                    SubCatChildLabor = table.Column<bool>(type: "bit", nullable: false),
                    SubCatPhysicalAbuse = table.Column<bool>(type: "bit", nullable: false),
                    SubCatSexualAbuse = table.Column<bool>(type: "bit", nullable: false),
                    SubCatOsaec = table.Column<bool>(type: "bit", nullable: false),
                    SubCatCicl = table.Column<bool>(type: "bit", nullable: false),
                    SubCatAtRisk = table.Column<bool>(type: "bit", nullable: false),
                    SubCatStreetChild = table.Column<bool>(type: "bit", nullable: false),
                    SubCatChildWithHiv = table.Column<bool>(type: "bit", nullable: false),
                    IsPwd = table.Column<bool>(type: "bit", nullable: false),
                    PwdType = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    HasSpecialNeeds = table.Column<bool>(type: "bit", nullable: false),
                    SpecialNeedsDiagnosis = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    FamilyIs4Ps = table.Column<bool>(type: "bit", nullable: false),
                    FamilySoloParent = table.Column<bool>(type: "bit", nullable: false),
                    FamilyIndigenous = table.Column<bool>(type: "bit", nullable: false),
                    FamilyParentPwd = table.Column<bool>(type: "bit", nullable: false),
                    FamilyInformalSettler = table.Column<bool>(type: "bit", nullable: false),
                    DateOfAdmission = table.Column<DateTime>(type: "date", nullable: false),
                    AgeUponAdmission = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    PresentAge = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    LengthOfStay = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ReferralSource = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ReferringAgencyPerson = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    DateColbRegistered = table.Column<DateTime>(type: "date", nullable: true),
                    DateColbObtained = table.Column<DateTime>(type: "date", nullable: true),
                    AssignedSocialWorker = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    InitialCaseAssessment = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    DateCaseStudyPrepared = table.Column<DateTime>(type: "date", nullable: true),
                    ReintegrationType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    ReintegrationStatus = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                    InitialRiskLevel = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    CurrentRiskLevel = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    DateEnrolled = table.Column<DateTime>(type: "date", nullable: false),
                    DateClosed = table.Column<DateTime>(type: "date", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NotesRestricted = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Residents", x => x.ResidentId);
                    table.ForeignKey(
                        name: "FK_Residents_Safehouses_SafehouseId",
                        column: x => x.SafehouseId,
                        principalTable: "Safehouses",
                        principalColumn: "SafehouseId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SafehouseMonthlyMetrics",
                columns: table => new
                {
                    MetricId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SafehouseId = table.Column<int>(type: "int", nullable: false),
                    MonthStart = table.Column<DateTime>(type: "date", nullable: false),
                    MonthEnd = table.Column<DateTime>(type: "date", nullable: false),
                    ActiveResidents = table.Column<int>(type: "int", nullable: false),
                    AvgEducationProgress = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: true),
                    AvgHealthScore = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    ProcessRecordingCount = table.Column<int>(type: "int", nullable: false),
                    HomeVisitationCount = table.Column<int>(type: "int", nullable: false),
                    IncidentCount = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SafehouseMonthlyMetrics", x => x.MetricId);
                    table.ForeignKey(
                        name: "FK_SafehouseMonthlyMetrics_Safehouses_SafehouseId",
                        column: x => x.SafehouseId,
                        principalTable: "Safehouses",
                        principalColumn: "SafehouseId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Donations",
                columns: table => new
                {
                    DonationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SupporterId = table.Column<int>(type: "int", nullable: false),
                    DonationType = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    DonationDate = table.Column<DateTime>(type: "date", nullable: false),
                    IsRecurring = table.Column<bool>(type: "bit", nullable: false),
                    CampaignName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    ChannelSource = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    CurrencyCode = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    EstimatedValue = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ImpactUnit = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedByPartnerId = table.Column<int>(type: "int", nullable: true),
                    ReferralPostId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Donations", x => x.DonationId);
                    table.ForeignKey(
                        name: "FK_Donations_Partners_CreatedByPartnerId",
                        column: x => x.CreatedByPartnerId,
                        principalTable: "Partners",
                        principalColumn: "PartnerId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Donations_SocialMediaPosts_ReferralPostId",
                        column: x => x.ReferralPostId,
                        principalTable: "SocialMediaPosts",
                        principalColumn: "PostId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Donations_Supporters_SupporterId",
                        column: x => x.SupporterId,
                        principalTable: "Supporters",
                        principalColumn: "SupporterId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DonorChurnPredictions",
                columns: table => new
                {
                    RunId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DonorId = table.Column<int>(type: "int", nullable: false),
                    RiskScore = table.Column<double>(type: "float", nullable: false),
                    RiskBand = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    ModelVersion = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ScoredAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DonorChurnPredictions", x => new { x.RunId, x.DonorId });
                    table.ForeignKey(
                        name: "FK_DonorChurnPredictions_MlModelRuns_RunId",
                        column: x => x.RunId,
                        principalTable: "MlModelRuns",
                        principalColumn: "RunId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DonorChurnPredictions_Supporters_DonorId",
                        column: x => x.DonorId,
                        principalTable: "Supporters",
                        principalColumn: "SupporterId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EducationRecords",
                columns: table => new
                {
                    EducationRecordId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ResidentId = table.Column<int>(type: "int", nullable: false),
                    RecordDate = table.Column<DateTime>(type: "date", nullable: false),
                    EducationLevel = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    SchoolName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    EnrollmentStatus = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    AttendanceRate = table.Column<decimal>(type: "decimal(5,3)", precision: 5, scale: 3, nullable: false),
                    ProgressPercent = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: false),
                    CompletionStatus = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EducationRecords", x => x.EducationRecordId);
                    table.ForeignKey(
                        name: "FK_EducationRecords_Residents_ResidentId",
                        column: x => x.ResidentId,
                        principalTable: "Residents",
                        principalColumn: "ResidentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HealthWellbeingRecords",
                columns: table => new
                {
                    HealthRecordId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ResidentId = table.Column<int>(type: "int", nullable: false),
                    RecordDate = table.Column<DateTime>(type: "date", nullable: false),
                    GeneralHealthScore = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    NutritionScore = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    SleepQualityScore = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    EnergyLevelScore = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    HeightCm = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false),
                    WeightKg = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false),
                    Bmi = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false),
                    MedicalCheckupDone = table.Column<bool>(type: "bit", nullable: false),
                    DentalCheckupDone = table.Column<bool>(type: "bit", nullable: false),
                    PsychologicalCheckupDone = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HealthWellbeingRecords", x => x.HealthRecordId);
                    table.ForeignKey(
                        name: "FK_HealthWellbeingRecords_Residents_ResidentId",
                        column: x => x.ResidentId,
                        principalTable: "Residents",
                        principalColumn: "ResidentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HomeVisitations",
                columns: table => new
                {
                    VisitationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ResidentId = table.Column<int>(type: "int", nullable: false),
                    VisitDate = table.Column<DateTime>(type: "date", nullable: false),
                    SocialWorker = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    VisitType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    LocationVisited = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FamilyMembersPresent = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Purpose = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Observations = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FamilyCooperationLevel = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    SafetyConcernsNoted = table.Column<bool>(type: "bit", nullable: false),
                    FollowUpNeeded = table.Column<bool>(type: "bit", nullable: false),
                    FollowUpNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    VisitOutcome = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HomeVisitations", x => x.VisitationId);
                    table.ForeignKey(
                        name: "FK_HomeVisitations_Residents_ResidentId",
                        column: x => x.ResidentId,
                        principalTable: "Residents",
                        principalColumn: "ResidentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "IncidentReports",
                columns: table => new
                {
                    IncidentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ResidentId = table.Column<int>(type: "int", nullable: false),
                    SafehouseId = table.Column<int>(type: "int", nullable: false),
                    IncidentDate = table.Column<DateTime>(type: "date", nullable: false),
                    IncidentType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Severity = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ResponseTaken = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Resolved = table.Column<bool>(type: "bit", nullable: false),
                    ResolutionDate = table.Column<DateTime>(type: "date", nullable: true),
                    ReportedBy = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    FollowUpRequired = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IncidentReports", x => x.IncidentId);
                    table.ForeignKey(
                        name: "FK_IncidentReports_Residents_ResidentId",
                        column: x => x.ResidentId,
                        principalTable: "Residents",
                        principalColumn: "ResidentId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_IncidentReports_Safehouses_SafehouseId",
                        column: x => x.SafehouseId,
                        principalTable: "Safehouses",
                        principalColumn: "SafehouseId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InterventionPlans",
                columns: table => new
                {
                    PlanId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ResidentId = table.Column<int>(type: "int", nullable: false),
                    PlanCategory = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    PlanDescription = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ServicesProvided = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TargetValue = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    TargetDate = table.Column<DateTime>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    CaseConferenceDate = table.Column<DateTime>(type: "date", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterventionPlans", x => x.PlanId);
                    table.ForeignKey(
                        name: "FK_InterventionPlans_Residents_ResidentId",
                        column: x => x.ResidentId,
                        principalTable: "Residents",
                        principalColumn: "ResidentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProcessRecordings",
                columns: table => new
                {
                    RecordingId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ResidentId = table.Column<int>(type: "int", nullable: false),
                    SessionDate = table.Column<DateTime>(type: "date", nullable: false),
                    SocialWorker = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    SessionType = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    SessionDurationMinutes = table.Column<int>(type: "int", nullable: false),
                    EmotionalStateObserved = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    EmotionalStateEnd = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    SessionNarrative = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InterventionsApplied = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FollowUpActions = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProgressNoted = table.Column<bool>(type: "bit", nullable: false),
                    ConcernsFlagged = table.Column<bool>(type: "bit", nullable: false),
                    ReferralMade = table.Column<bool>(type: "bit", nullable: false),
                    NotesRestricted = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessRecordings", x => x.RecordingId);
                    table.ForeignKey(
                        name: "FK_ProcessRecordings_Residents_ResidentId",
                        column: x => x.ResidentId,
                        principalTable: "Residents",
                        principalColumn: "ResidentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ResidentRiskPredictions",
                columns: table => new
                {
                    RunId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResidentId = table.Column<int>(type: "int", nullable: false),
                    PredictedRisk = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    PredictedRiskNum = table.Column<int>(type: "int", nullable: false),
                    FlagForReview = table.Column<bool>(type: "bit", nullable: false),
                    ModelVersion = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ScoredAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResidentRiskPredictions", x => new { x.RunId, x.ResidentId });
                    table.ForeignKey(
                        name: "FK_ResidentRiskPredictions_MlModelRuns_RunId",
                        column: x => x.RunId,
                        principalTable: "MlModelRuns",
                        principalColumn: "RunId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ResidentRiskPredictions_Residents_ResidentId",
                        column: x => x.ResidentId,
                        principalTable: "Residents",
                        principalColumn: "ResidentId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DonationAllocations",
                columns: table => new
                {
                    AllocationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DonationId = table.Column<int>(type: "int", nullable: false),
                    SafehouseId = table.Column<int>(type: "int", nullable: false),
                    ProgramArea = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    AmountAllocated = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    AllocationDate = table.Column<DateTime>(type: "date", nullable: false),
                    AllocationNotes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DonationAllocations", x => x.AllocationId);
                    table.ForeignKey(
                        name: "FK_DonationAllocations_Donations_DonationId",
                        column: x => x.DonationId,
                        principalTable: "Donations",
                        principalColumn: "DonationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DonationAllocations_Safehouses_SafehouseId",
                        column: x => x.SafehouseId,
                        principalTable: "Safehouses",
                        principalColumn: "SafehouseId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InKindDonationItems",
                columns: table => new
                {
                    ItemId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DonationId = table.Column<int>(type: "int", nullable: false),
                    ItemName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ItemCategory = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    UnitOfMeasure = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    EstimatedUnitValue = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    IntendedUse = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ReceivedCondition = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InKindDonationItems", x => x.ItemId);
                    table.ForeignKey(
                        name: "FK_InKindDonationItems_Donations_DonationId",
                        column: x => x.DonationId,
                        principalTable: "Donations",
                        principalColumn: "DonationId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DonationAllocations_DonationId",
                table: "DonationAllocations",
                column: "DonationId");

            migrationBuilder.CreateIndex(
                name: "IX_DonationAllocations_SafehouseId",
                table: "DonationAllocations",
                column: "SafehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_Donations_CreatedByPartnerId",
                table: "Donations",
                column: "CreatedByPartnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Donations_DonationDate",
                table: "Donations",
                column: "DonationDate");

            migrationBuilder.CreateIndex(
                name: "IX_Donations_ReferralPostId",
                table: "Donations",
                column: "ReferralPostId");

            migrationBuilder.CreateIndex(
                name: "IX_Donations_SupporterId",
                table: "Donations",
                column: "SupporterId");

            migrationBuilder.CreateIndex(
                name: "IX_DonorChurnPredictions_DonorId",
                table: "DonorChurnPredictions",
                column: "DonorId");

            migrationBuilder.CreateIndex(
                name: "IX_DonorChurnPredictions_ScoredAt",
                table: "DonorChurnPredictions",
                column: "ScoredAt");

            migrationBuilder.CreateIndex(
                name: "IX_EducationRecords_ResidentId",
                table: "EducationRecords",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationRecords_ResidentId_RecordDate",
                table: "EducationRecords",
                columns: new[] { "ResidentId", "RecordDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HealthWellbeingRecords_ResidentId",
                table: "HealthWellbeingRecords",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_HealthWellbeingRecords_ResidentId_RecordDate",
                table: "HealthWellbeingRecords",
                columns: new[] { "ResidentId", "RecordDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HomeVisitations_ResidentId",
                table: "HomeVisitations",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_HomeVisitations_ResidentId_VisitDate",
                table: "HomeVisitations",
                columns: new[] { "ResidentId", "VisitDate" });

            migrationBuilder.CreateIndex(
                name: "IX_IncidentReports_ResidentId",
                table: "IncidentReports",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentReports_SafehouseId",
                table: "IncidentReports",
                column: "SafehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_InKindDonationItems_DonationId",
                table: "InKindDonationItems",
                column: "DonationId");

            migrationBuilder.CreateIndex(
                name: "IX_InterventionPlans_ResidentId",
                table: "InterventionPlans",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_MlModelRuns_ModelName_StartedAt",
                table: "MlModelRuns",
                columns: new[] { "ModelName", "StartedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PartnerAssignments_PartnerId",
                table: "PartnerAssignments",
                column: "PartnerId");

            migrationBuilder.CreateIndex(
                name: "IX_PartnerAssignments_SafehouseId",
                table: "PartnerAssignments",
                column: "SafehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessRecordings_ResidentId",
                table: "ProcessRecordings",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessRecordings_ResidentId_SessionDate",
                table: "ProcessRecordings",
                columns: new[] { "ResidentId", "SessionDate" });

            migrationBuilder.CreateIndex(
                name: "IX_PublicImpactSnapshots_SnapshotDate",
                table: "PublicImpactSnapshots",
                column: "SnapshotDate",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ResidentRiskPredictions_ResidentId",
                table: "ResidentRiskPredictions",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_ResidentRiskPredictions_ScoredAt",
                table: "ResidentRiskPredictions",
                column: "ScoredAt");

            migrationBuilder.CreateIndex(
                name: "IX_Residents_CaseControlNo",
                table: "Residents",
                column: "CaseControlNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Residents_InternalCode",
                table: "Residents",
                column: "InternalCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Residents_SafehouseId",
                table: "Residents",
                column: "SafehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_SafehouseMonthlyMetrics_SafehouseId",
                table: "SafehouseMonthlyMetrics",
                column: "SafehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_SafehouseMonthlyMetrics_SafehouseId_MonthStart",
                table: "SafehouseMonthlyMetrics",
                columns: new[] { "SafehouseId", "MonthStart" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Safehouses_SafehouseCode",
                table: "Safehouses",
                column: "SafehouseCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SocialMediaPosts_CreatedAt",
                table: "SocialMediaPosts",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SocialMediaPosts_PlatformPostId",
                table: "SocialMediaPosts",
                column: "PlatformPostId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Supporters_Email",
                table: "Supporters",
                column: "Email");

            SeedOperationalDataset(migrationBuilder);

            migrationBuilder.Sql(
                """
                CREATE VIEW CurrentDonorChurnPredictions AS
                SELECT prediction.DonorId,
                       prediction.RiskScore,
                       prediction.RiskBand,
                       prediction.ModelVersion,
                       prediction.ScoredAt,
                       prediction.RunId
                FROM DonorChurnPredictions AS prediction
                WHERE prediction.ScoredAt = (SELECT MAX(latest.ScoredAt) FROM DonorChurnPredictions AS latest);
                """);

            migrationBuilder.Sql(
                """
                CREATE VIEW CurrentResidentRiskPredictions AS
                SELECT prediction.ResidentId,
                       prediction.PredictedRisk,
                       prediction.PredictedRiskNum,
                       prediction.FlagForReview,
                       prediction.ModelVersion,
                       prediction.ScoredAt,
                       prediction.RunId
                FROM ResidentRiskPredictions AS prediction
                WHERE prediction.ScoredAt = (SELECT MAX(latest.ScoredAt) FROM ResidentRiskPredictions AS latest);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS CurrentResidentRiskPredictions;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS CurrentDonorChurnPredictions;");

            migrationBuilder.DropTable(
                name: "DonationAllocations");

            migrationBuilder.DropTable(
                name: "DonorChurnPredictions");

            migrationBuilder.DropTable(
                name: "EducationRecords");

            migrationBuilder.DropTable(
                name: "HealthWellbeingRecords");

            migrationBuilder.DropTable(
                name: "HomeVisitations");

            migrationBuilder.DropTable(
                name: "IncidentReports");

            migrationBuilder.DropTable(
                name: "InKindDonationItems");

            migrationBuilder.DropTable(
                name: "InterventionPlans");

            migrationBuilder.DropTable(
                name: "PartnerAssignments");

            migrationBuilder.DropTable(
                name: "ProcessRecordings");

            migrationBuilder.DropTable(
                name: "PublicImpactSnapshots");

            migrationBuilder.DropTable(
                name: "ResidentRiskPredictions");

            migrationBuilder.DropTable(
                name: "SafehouseMonthlyMetrics");

            migrationBuilder.DropTable(
                name: "Donations");

            migrationBuilder.DropTable(
                name: "MlModelRuns");

            migrationBuilder.DropTable(
                name: "Residents");

            migrationBuilder.DropTable(
                name: "Partners");

            migrationBuilder.DropTable(
                name: "SocialMediaPosts");

            migrationBuilder.DropTable(
                name: "Supporters");

            migrationBuilder.DropTable(
                name: "Safehouses");
        }

        private static void SeedOperationalDataset(MigrationBuilder migrationBuilder)
        {
            SeedTable(
                migrationBuilder,
                "Safehouses",
                "safehouses.csv",
                ["SafehouseId", "SafehouseCode", "Name", "Region", "City", "Province", "Country", "OpenDate", "Status", "CapacityGirls", "CapacityStaff", "CurrentOccupancy", "Notes"],
                row => [ParseInt(row, "safehouse_id"), Text(row, "safehouse_code"), Text(row, "name"), Text(row, "region"), Text(row, "city"), Text(row, "province"), Text(row, "country"), ParseDate(row, "open_date"), Text(row, "status"), ParseInt(row, "capacity_girls"), ParseInt(row, "capacity_staff"), ParseInt(row, "current_occupancy"), NullableText(row, "notes")]);

            SeedTable(
                migrationBuilder,
                "Partners",
                "partners.csv",
                ["PartnerId", "PartnerName", "PartnerType", "RoleType", "ContactName", "Email", "Phone", "Region", "Status", "StartDate", "EndDate", "Notes"],
                row => [ParseInt(row, "partner_id"), Text(row, "partner_name"), Text(row, "partner_type"), Text(row, "role_type"), Text(row, "contact_name"), Text(row, "email"), Text(row, "phone"), Text(row, "region"), Text(row, "status"), ParseDate(row, "start_date"), ParseNullableDate(row, "end_date"), NullableText(row, "notes")]);

            SeedTable(
                migrationBuilder,
                "SocialMediaPosts",
                "social_media_posts.csv",
                ["PostId", "Platform", "PlatformPostId", "PostUrl", "CreatedAt", "DayOfWeek", "PostHour", "PostType", "MediaType", "Caption", "Hashtags", "NumHashtags", "MentionsCount", "HasCallToAction", "CallToActionType", "ContentTopic", "SentimentTone", "CaptionLength", "FeaturesResidentStory", "CampaignName", "IsBoosted", "BoostBudgetPhp", "Impressions", "Reach", "Likes", "Comments", "Shares", "Saves", "ClickThroughs", "VideoViews", "EngagementRate", "ProfileVisits", "DonationReferrals", "EstimatedDonationValuePhp", "FollowerCountAtPost", "WatchTimeSeconds", "AvgViewDurationSeconds", "SubscriberCountAtPost", "Forwards"],
                row =>
                [
                    ParseInt(row, "post_id"),
                    Text(row, "platform"),
                    Text(row, "platform_post_id"),
                    Text(row, "post_url"),
                    ParseDateTime(row, "created_at"),
                    Text(row, "day_of_week"),
                    ParseInt(row, "post_hour"),
                    Text(row, "post_type"),
                    Text(row, "media_type"),
                    Text(row, "caption"),
                    NullableText(row, "hashtags"),
                    ParseInt(row, "num_hashtags"),
                    ParseInt(row, "mentions_count"),
                    ParseBool(row, "has_call_to_action"),
                    NullableText(row, "call_to_action_type"),
                    Text(row, "content_topic"),
                    Text(row, "sentiment_tone"),
                    ParseInt(row, "caption_length"),
                    ParseBool(row, "features_resident_story"),
                    NullableText(row, "campaign_name"),
                    ParseBool(row, "is_boosted"),
                    ParseNullableDecimal(row, "boost_budget_php"),
                    ParseInt(row, "impressions"),
                    ParseInt(row, "reach"),
                    ParseInt(row, "likes"),
                    ParseInt(row, "comments"),
                    ParseInt(row, "shares"),
                    ParseInt(row, "saves"),
                    ParseInt(row, "click_throughs"),
                    ParseNullableInt(row, "video_views"),
                    ParseDecimal(row, "engagement_rate"),
                    ParseInt(row, "profile_visits"),
                    ParseInt(row, "donation_referrals"),
                    ParseDecimal(row, "estimated_donation_value_php"),
                    ParseInt(row, "follower_count_at_post"),
                    ParseNullableInt(row, "watch_time_seconds"),
                    ParseNullableInt(row, "avg_view_duration_seconds"),
                    ParseNullableInt(row, "subscriber_count_at_post"),
                    ParseNullableInt(row, "forwards")
                ]);

            SeedTable(
                migrationBuilder,
                "Supporters",
                "supporters.csv",
                ["SupporterId", "SupporterType", "DisplayName", "OrganizationName", "FirstName", "LastName", "RelationshipType", "Region", "Country", "Email", "Phone", "Status", "CreatedAt", "FirstDonationDate", "AcquisitionChannel"],
                row => [ParseInt(row, "supporter_id"), Text(row, "supporter_type"), Text(row, "display_name"), NullableText(row, "organization_name"), NullableText(row, "first_name"), NullableText(row, "last_name"), Text(row, "relationship_type"), Text(row, "region"), Text(row, "country"), Text(row, "email"), Text(row, "phone"), Text(row, "status"), ParseDateTime(row, "created_at"), ParseNullableDate(row, "first_donation_date"), Text(row, "acquisition_channel")]);

            SeedTable(
                migrationBuilder,
                "PartnerAssignments",
                "partner_assignments.csv",
                ["AssignmentId", "PartnerId", "SafehouseId", "ProgramArea", "AssignmentStart", "AssignmentEnd", "ResponsibilityNotes", "IsPrimary", "Status"],
                row => [ParseInt(row, "assignment_id"), ParseInt(row, "partner_id"), ParseNullableInt(row, "safehouse_id"), Text(row, "program_area"), ParseDate(row, "assignment_start"), ParseNullableDate(row, "assignment_end"), NullableText(row, "responsibility_notes"), ParseBool(row, "is_primary"), Text(row, "status")]);

            SeedTable(
                migrationBuilder,
                "Residents",
                "residents.csv",
                ["ResidentId", "CaseControlNo", "InternalCode", "SafehouseId", "CaseStatus", "Sex", "DateOfBirth", "BirthStatus", "PlaceOfBirth", "Religion", "CaseCategory", "SubCatOrphaned", "SubCatTrafficked", "SubCatChildLabor", "SubCatPhysicalAbuse", "SubCatSexualAbuse", "SubCatOsaec", "SubCatCicl", "SubCatAtRisk", "SubCatStreetChild", "SubCatChildWithHiv", "IsPwd", "PwdType", "HasSpecialNeeds", "SpecialNeedsDiagnosis", "FamilyIs4Ps", "FamilySoloParent", "FamilyIndigenous", "FamilyParentPwd", "FamilyInformalSettler", "DateOfAdmission", "AgeUponAdmission", "PresentAge", "LengthOfStay", "ReferralSource", "ReferringAgencyPerson", "DateColbRegistered", "DateColbObtained", "AssignedSocialWorker", "InitialCaseAssessment", "DateCaseStudyPrepared", "ReintegrationType", "ReintegrationStatus", "InitialRiskLevel", "CurrentRiskLevel", "DateEnrolled", "DateClosed", "CreatedAt", "NotesRestricted"],
                row =>
                [
                    ParseInt(row, "resident_id"),
                    Text(row, "case_control_no"),
                    Text(row, "internal_code"),
                    ParseInt(row, "safehouse_id"),
                    Text(row, "case_status"),
                    Text(row, "sex"),
                    ParseDate(row, "date_of_birth"),
                    Text(row, "birth_status"),
                    Text(row, "place_of_birth"),
                    Text(row, "religion"),
                    Text(row, "case_category"),
                    ParseBool(row, "sub_cat_orphaned"),
                    ParseBool(row, "sub_cat_trafficked"),
                    ParseBool(row, "sub_cat_child_labor"),
                    ParseBool(row, "sub_cat_physical_abuse"),
                    ParseBool(row, "sub_cat_sexual_abuse"),
                    ParseBool(row, "sub_cat_osaec"),
                    ParseBool(row, "sub_cat_cicl"),
                    ParseBool(row, "sub_cat_at_risk"),
                    ParseBool(row, "sub_cat_street_child"),
                    ParseBool(row, "sub_cat_child_with_hiv"),
                    ParseBool(row, "is_pwd"),
                    NullableText(row, "pwd_type"),
                    ParseBool(row, "has_special_needs"),
                    NullableText(row, "special_needs_diagnosis"),
                    ParseBool(row, "family_is_4ps"),
                    ParseBool(row, "family_solo_parent"),
                    ParseBool(row, "family_indigenous"),
                    ParseBool(row, "family_parent_pwd"),
                    ParseBool(row, "family_informal_settler"),
                    ParseDate(row, "date_of_admission"),
                    Text(row, "age_upon_admission"),
                    Text(row, "present_age"),
                    Text(row, "length_of_stay"),
                    Text(row, "referral_source"),
                    NullableText(row, "referring_agency_person"),
                    ParseNullableDate(row, "date_colb_registered"),
                    ParseNullableDate(row, "date_colb_obtained"),
                    Text(row, "assigned_social_worker"),
                    Text(row, "initial_case_assessment"),
                    ParseNullableDate(row, "date_case_study_prepared"),
                    NullableText(row, "reintegration_type"),
                    NullableText(row, "reintegration_status"),
                    Text(row, "initial_risk_level"),
                    Text(row, "current_risk_level"),
                    ParseDate(row, "date_enrolled"),
                    ParseNullableDate(row, "date_closed"),
                    ParseDateTime(row, "created_at"),
                    NullableText(row, "notes_restricted")
                ]);

            SeedTable(
                migrationBuilder,
                "SafehouseMonthlyMetrics",
                "safehouse_monthly_metrics.csv",
                ["MetricId", "SafehouseId", "MonthStart", "MonthEnd", "ActiveResidents", "AvgEducationProgress", "AvgHealthScore", "ProcessRecordingCount", "HomeVisitationCount", "IncidentCount", "Notes"],
                row => [ParseInt(row, "metric_id"), ParseInt(row, "safehouse_id"), ParseDate(row, "month_start"), ParseDate(row, "month_end"), ParseInt(row, "active_residents"), ParseNullableDecimal(row, "avg_education_progress"), ParseNullableDecimal(row, "avg_health_score"), ParseInt(row, "process_recording_count"), ParseInt(row, "home_visitation_count"), ParseInt(row, "incident_count"), NullableText(row, "notes")]);

            SeedTable(
                migrationBuilder,
                "PublicImpactSnapshots",
                "public_impact_snapshots.csv",
                ["SnapshotId", "SnapshotDate", "Headline", "SummaryText", "MetricPayloadJson", "IsPublished", "PublishedAt"],
                row => [ParseInt(row, "snapshot_id"), ParseDate(row, "snapshot_date"), Text(row, "headline"), Text(row, "summary_text"), Text(row, "metric_payload_json"), ParseBool(row, "is_published"), ParseDate(row, "published_at")]);

            SeedTable(
                migrationBuilder,
                "Donations",
                "donations.csv",
                ["DonationId", "SupporterId", "DonationType", "DonationDate", "IsRecurring", "CampaignName", "ChannelSource", "CurrencyCode", "Amount", "EstimatedValue", "ImpactUnit", "Notes", "CreatedByPartnerId", "ReferralPostId"],
                row => [ParseInt(row, "donation_id"), ParseInt(row, "supporter_id"), Text(row, "donation_type"), ParseDate(row, "donation_date"), ParseBool(row, "is_recurring"), NullableText(row, "campaign_name"), Text(row, "channel_source"), NullableText(row, "currency_code"), ParseNullableDecimal(row, "amount"), ParseDecimal(row, "estimated_value"), Text(row, "impact_unit"), NullableText(row, "notes"), null, ParseNullableInt(row, "referral_post_id")]);

            SeedTable(
                migrationBuilder,
                "InKindDonationItems",
                "in_kind_donation_items.csv",
                ["ItemId", "DonationId", "ItemName", "ItemCategory", "Quantity", "UnitOfMeasure", "EstimatedUnitValue", "IntendedUse", "ReceivedCondition"],
                row => [ParseInt(row, "item_id"), ParseInt(row, "donation_id"), Text(row, "item_name"), Text(row, "item_category"), ParseInt(row, "quantity"), Text(row, "unit_of_measure"), ParseDecimal(row, "estimated_unit_value"), Text(row, "intended_use"), Text(row, "received_condition")]);

            SeedTable(
                migrationBuilder,
                "DonationAllocations",
                "donation_allocations.csv",
                ["AllocationId", "DonationId", "SafehouseId", "ProgramArea", "AmountAllocated", "AllocationDate", "AllocationNotes"],
                row => [ParseInt(row, "allocation_id"), ParseInt(row, "donation_id"), ParseInt(row, "safehouse_id"), Text(row, "program_area"), ParseDecimal(row, "amount_allocated"), ParseDate(row, "allocation_date"), NullableText(row, "allocation_notes")]);

            SeedTable(
                migrationBuilder,
                "ProcessRecordings",
                "process_recordings.csv",
                ["RecordingId", "ResidentId", "SessionDate", "SocialWorker", "SessionType", "SessionDurationMinutes", "EmotionalStateObserved", "EmotionalStateEnd", "SessionNarrative", "InterventionsApplied", "FollowUpActions", "ProgressNoted", "ConcernsFlagged", "ReferralMade", "NotesRestricted"],
                row => [ParseInt(row, "recording_id"), ParseInt(row, "resident_id"), ParseDate(row, "session_date"), Text(row, "social_worker"), Text(row, "session_type"), ParseInt(row, "session_duration_minutes"), Text(row, "emotional_state_observed"), Text(row, "emotional_state_end"), Text(row, "session_narrative"), Text(row, "interventions_applied"), Text(row, "follow_up_actions"), ParseBool(row, "progress_noted"), ParseBool(row, "concerns_flagged"), ParseBool(row, "referral_made"), NullableText(row, "notes_restricted")]);

            SeedTable(
                migrationBuilder,
                "HomeVisitations",
                "home_visitations.csv",
                ["VisitationId", "ResidentId", "VisitDate", "SocialWorker", "VisitType", "LocationVisited", "FamilyMembersPresent", "Purpose", "Observations", "FamilyCooperationLevel", "SafetyConcernsNoted", "FollowUpNeeded", "FollowUpNotes", "VisitOutcome"],
                row => [ParseInt(row, "visitation_id"), ParseInt(row, "resident_id"), ParseDate(row, "visit_date"), Text(row, "social_worker"), Text(row, "visit_type"), Text(row, "location_visited"), Text(row, "family_members_present"), Text(row, "purpose"), Text(row, "observations"), Text(row, "family_cooperation_level"), ParseBool(row, "safety_concerns_noted"), ParseBool(row, "follow_up_needed"), NullableText(row, "follow_up_notes"), Text(row, "visit_outcome")]);

            SeedTable(
                migrationBuilder,
                "EducationRecords",
                "education_records.csv",
                ["EducationRecordId", "ResidentId", "RecordDate", "EducationLevel", "SchoolName", "EnrollmentStatus", "AttendanceRate", "ProgressPercent", "CompletionStatus", "Notes"],
                row => [ParseInt(row, "education_record_id"), ParseInt(row, "resident_id"), ParseDate(row, "record_date"), Text(row, "education_level"), Text(row, "school_name"), Text(row, "enrollment_status"), ParseDecimal(row, "attendance_rate"), ParseDecimal(row, "progress_percent"), Text(row, "completion_status"), NullableText(row, "notes")]);

            SeedTable(
                migrationBuilder,
                "HealthWellbeingRecords",
                "health_wellbeing_records.csv",
                ["HealthRecordId", "ResidentId", "RecordDate", "GeneralHealthScore", "NutritionScore", "SleepQualityScore", "EnergyLevelScore", "HeightCm", "WeightKg", "Bmi", "MedicalCheckupDone", "DentalCheckupDone", "PsychologicalCheckupDone", "Notes"],
                row => [ParseInt(row, "health_record_id"), ParseInt(row, "resident_id"), ParseDate(row, "record_date"), ParseDecimal(row, "general_health_score"), ParseDecimal(row, "nutrition_score"), ParseDecimal(row, "sleep_quality_score"), ParseDecimal(row, "energy_level_score"), ParseDecimal(row, "height_cm"), ParseDecimal(row, "weight_kg"), ParseDecimal(row, "bmi"), ParseBool(row, "medical_checkup_done"), ParseBool(row, "dental_checkup_done"), ParseBool(row, "psychological_checkup_done"), NullableText(row, "notes")]);

            SeedTable(
                migrationBuilder,
                "InterventionPlans",
                "intervention_plans.csv",
                ["PlanId", "ResidentId", "PlanCategory", "PlanDescription", "ServicesProvided", "TargetValue", "TargetDate", "Status", "CaseConferenceDate", "CreatedAt", "UpdatedAt"],
                row => [ParseInt(row, "plan_id"), ParseInt(row, "resident_id"), Text(row, "plan_category"), Text(row, "plan_description"), Text(row, "services_provided"), ParseDecimal(row, "target_value"), ParseDate(row, "target_date"), Text(row, "status"), ParseNullableDate(row, "case_conference_date"), ParseDateTime(row, "created_at"), ParseDateTime(row, "updated_at")]);

            SeedTable(
                migrationBuilder,
                "IncidentReports",
                "incident_reports.csv",
                ["IncidentId", "ResidentId", "SafehouseId", "IncidentDate", "IncidentType", "Severity", "Description", "ResponseTaken", "Resolved", "ResolutionDate", "ReportedBy", "FollowUpRequired"],
                row => [ParseInt(row, "incident_id"), ParseInt(row, "resident_id"), ParseInt(row, "safehouse_id"), ParseDate(row, "incident_date"), Text(row, "incident_type"), Text(row, "severity"), Text(row, "description"), Text(row, "response_taken"), ParseBool(row, "resolved"), ParseNullableDate(row, "resolution_date"), Text(row, "reported_by"), ParseBool(row, "follow_up_required")]);
        }

        private static void SeedTable(
            MigrationBuilder migrationBuilder,
            string table,
            string fileName,
            string[] columns,
            Func<IReadOnlyDictionary<string, string>, object[]> rowFactory)
        {
            var rows = ReadCsvRows(fileName)
                .Select(rowFactory)
                .ToArray();

            foreach (var batch in rows.Chunk(200))
            {
                migrationBuilder.InsertData(
                    table: table,
                    columns: columns,
                    values: ToMultidimensionalArray(batch));
            }
        }

        private static object[,] ToMultidimensionalArray(IReadOnlyList<object[]> rows)
        {
            var values = new object[rows.Count, rows[0].Length];
            for (var rowIndex = 0; rowIndex < rows.Count; rowIndex++)
            {
                for (var columnIndex = 0; columnIndex < rows[rowIndex].Length; columnIndex++)
                {
                    values[rowIndex, columnIndex] = rows[rowIndex][columnIndex];
                }
            }

            return values;
        }

        private static IReadOnlyList<Dictionary<string, string>> ReadCsvRows(string fileName)
        {
            var csvPath = Path.Combine(FindCsvDirectory(), fileName);
            var rows = new List<Dictionary<string, string>>();

            using var parser = new TextFieldParser(csvPath);
            parser.SetDelimiters(",");
            parser.HasFieldsEnclosedInQuotes = true;
            parser.TrimWhiteSpace = false;

            var headers = parser.ReadFields() ?? throw new InvalidOperationException($"The file '{fileName}' is empty.");
            while (!parser.EndOfData)
            {
                var fields = parser.ReadFields();
                if (fields is null)
                {
                    continue;
                }

                var row = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                for (var index = 0; index < headers.Length; index++)
                {
                    row[headers[index]] = index < fields.Length ? fields[index] : string.Empty;
                }

                rows.Add(row);
            }

            return rows;
        }

        private static string FindCsvDirectory()
        {
            var searchRoots = new[]
            {
                AppContext.BaseDirectory,
                Directory.GetCurrentDirectory(),
                Path.GetDirectoryName(typeof(CreateOperationalDataset).Assembly.Location) ?? AppContext.BaseDirectory
            };

            foreach (var root in searchRoots.Where(path => !string.IsNullOrWhiteSpace(path)).Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var directory = new DirectoryInfo(root);
                while (directory is not null)
                {
                    var candidate = Path.Combine(directory.FullName, "ml-pipelines", "lighthouse_csv_v7");
                    if (Directory.Exists(candidate))
                    {
                        return candidate;
                    }

                    directory = directory.Parent;
                }
            }

            throw new DirectoryNotFoundException("Could not find the ml-pipelines/lighthouse_csv_v7 directory required for seeding.");
        }

        private static string Text(IReadOnlyDictionary<string, string> row, string key) =>
            row.TryGetValue(key, out var value) ? value.Trim() : string.Empty;

        private static string NullableText(IReadOnlyDictionary<string, string> row, string key)
        {
            var value = Text(row, key);
            return string.IsNullOrWhiteSpace(value) ? null : value;
        }

        private static int ParseInt(IReadOnlyDictionary<string, string> row, string key) =>
            Convert.ToInt32(decimal.Parse(Text(row, key), CultureInfo.InvariantCulture));

        private static int? ParseNullableInt(IReadOnlyDictionary<string, string> row, string key)
        {
            var value = NullableText(row, key);
            return value is null
                ? null
                : Convert.ToInt32(decimal.Parse(value, CultureInfo.InvariantCulture));
        }

        private static decimal ParseDecimal(IReadOnlyDictionary<string, string> row, string key) =>
            decimal.Parse(Text(row, key), CultureInfo.InvariantCulture);

        private static decimal? ParseNullableDecimal(IReadOnlyDictionary<string, string> row, string key)
        {
            var value = NullableText(row, key);
            return value is null
                ? null
                : decimal.Parse(value, CultureInfo.InvariantCulture);
        }

        private static bool ParseBool(IReadOnlyDictionary<string, string> row, string key) =>
            bool.Parse(Text(row, key));

        private static DateTime ParseDate(IReadOnlyDictionary<string, string> row, string key) =>
            DateTime.Parse(Text(row, key), CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal);

        private static DateTime? ParseNullableDate(IReadOnlyDictionary<string, string> row, string key)
        {
            var value = NullableText(row, key);
            return value is null
                ? null
                : DateTime.Parse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal);
        }

        private static DateTime ParseDateTime(IReadOnlyDictionary<string, string> row, string key) =>
            DateTime.Parse(Text(row, key), CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal);
    }
}
