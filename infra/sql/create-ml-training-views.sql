IF SCHEMA_ID(N'ml') IS NULL
    EXEC(N'CREATE SCHEMA ml AUTHORIZATION dbo;');
GO

CREATE OR ALTER VIEW ml.SupportersTrainingView
AS
SELECT
    supporter.SupporterId AS supporter_id,
    supporter.SupporterType AS supporter_type,
    supporter.RelationshipType AS relationship_type,
    supporter.AcquisitionChannel AS acquisition_channel,
    supporter.Status AS status
FROM dbo.Supporters AS supporter;
GO

CREATE OR ALTER VIEW ml.DonationsTrainingView
AS
SELECT
    donation.DonationId AS donation_id,
    donation.SupporterId AS supporter_id,
    donation.DonationDate AS donation_date,
    CAST(COALESCE(donation.Amount, donation.EstimatedValue, 0.00) AS decimal(18, 2)) AS amount,
    donation.DonationType AS donation_type,
    CAST(donation.IsRecurring AS bit) AS is_recurring,
    donation.CampaignName AS campaign_name,
    donation.ChannelSource AS channel_source
FROM dbo.Donations AS donation;
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

CREATE OR ALTER VIEW ml.ProcessRecordingsTrainingView
AS
SELECT
    recording.RecordingId AS recording_id,
    recording.ResidentId AS resident_id,
    CAST(recording.ProgressNoted AS bit) AS progress_noted,
    CAST(recording.ConcernsFlagged AS bit) AS concerns_flagged,
    CAST(recording.ReferralMade AS bit) AS referral_made,
    recording.SessionDurationMinutes AS session_duration_minutes
FROM dbo.ProcessRecordings AS recording;
GO

CREATE OR ALTER VIEW ml.HomeVisitationsTrainingView
AS
SELECT
    visitation.VisitationId AS visitation_id,
    visitation.ResidentId AS resident_id,
    CAST(visitation.SafetyConcernsNoted AS bit) AS safety_concerns_noted,
    CAST(visitation.FollowUpNeeded AS bit) AS follow_up_needed,
    visitation.FamilyCooperationLevel AS family_cooperation_level,
    visitation.VisitOutcome AS visit_outcome
FROM dbo.HomeVisitations AS visitation;
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

CREATE OR ALTER VIEW ml.HealthWellbeingRecordsTrainingView
AS
SELECT
    health.ResidentId AS resident_id,
    health.RecordDate AS record_date,
    health.GeneralHealthScore AS general_health_score,
    health.NutritionScore AS nutrition_score,
    health.SleepQualityScore AS sleep_quality_score,
    health.EnergyLevelScore AS energy_level_score,
    health.Bmi AS bmi
FROM dbo.HealthWellbeingRecords AS health;
GO

CREATE OR ALTER VIEW ml.IncidentReportsTrainingView
AS
SELECT
    incident.IncidentId AS incident_id,
    incident.ResidentId AS resident_id,
    CAST(incident.Resolved AS bit) AS resolved,
    incident.Severity AS severity,
    CAST(incident.FollowUpRequired AS bit) AS follow_up_required,
    incident.IncidentType AS incident_type
FROM dbo.IncidentReports AS incident;
GO

CREATE OR ALTER VIEW ml.InterventionPlansTrainingView
AS
SELECT
    intervention.PlanId AS plan_id,
    intervention.ResidentId AS resident_id,
    intervention.Status AS status
FROM dbo.InterventionPlans AS intervention;
GO

CREATE OR ALTER VIEW ml.SocialMediaPostsTrainingView
AS
SELECT
    post.CreatedAt AS created_at,
    post.Platform AS platform,
    post.PostType AS post_type,
    post.MediaType AS media_type,
    post.ContentTopic AS content_topic,
    post.SentimentTone AS sentiment_tone,
    post.CaptionLength AS caption_length,
    post.NumHashtags AS num_hashtags,
    post.MentionsCount AS mentions_count,
    CAST(post.FeaturesResidentStory AS bit) AS features_resident_story,
    CAST(post.HasCallToAction AS bit) AS has_call_to_action,
    CAST(post.IsBoosted AS bit) AS is_boosted,
    post.FollowerCountAtPost AS follower_count_at_post,
    post.DayOfWeek AS day_of_week,
    post.PostHour AS post_hour,
    post.Likes AS likes,
    post.Comments AS comments,
    post.Shares AS shares,
    post.EstimatedDonationValuePhp AS estimated_donation_value_php
FROM dbo.SocialMediaPosts AS post;
GO
