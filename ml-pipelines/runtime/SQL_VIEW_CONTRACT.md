# ML SQL View Contract

The nightly training job can run in `ML_INPUT_MODE=sql`. In that mode it reads denormalized views from the operational database instead of local CSV files.

These views are **not** created automatically by the Python runtime or the Bicep template. Create them in the operational database after you decide how your production tables map to the notebook feature engineering.

This repository includes an idempotent Azure SQL script at [`infra/sql/create-ml-training-views.sql`](/Users/alijahwhitney/Documents/Github/School/INTEX_W2026_Group_2-7/infra/sql/create-ml-training-views.sql) that creates the default `ml.*TrainingView` objects against the current operational schema.
For reintegration-readiness view updates only, use [`infra/sql/create-reintegration-readiness-training-views.sql`](/Users/alijahwhitney/Documents/Github/School/INTEX_W2026_Group_2-7/infra/sql/create-reintegration-readiness-training-views.sql).

## Required access

The Azure Container Apps Job managed identity needs:

- `SELECT` on the training views below
- `INSERT` on `MlModelRuns`
- `INSERT` on `DonorChurnPredictions`
- `INSERT` on `ResidentRiskPredictions`
- `INSERT` on `ReintegrationReadinessPredictions`

The simplest setup is:

```sql
CREATE USER [hope-ml-training-id] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [hope-ml-training-id];
ALTER ROLE db_datawriter ADD MEMBER [hope-ml-training-id];
```

Replace `hope-ml-training-id` with the actual managed identity name or contained user you create for the Container Apps Job. With the default Bicep `namePrefix` of `hope-ml`, the user-assigned identity name is `hope-ml-training-id`.

## View names

The runtime defaults to these view names unless you override them with `ML_VIEW_*` environment variables:

- `ml.SupportersTrainingView`
- `ml.DonationsTrainingView`
- `ml.ResidentsTrainingView`
- `ml.ProcessRecordingsTrainingView`
- `ml.HomeVisitationsTrainingView`
- `ml.EducationRecordsTrainingView`
- `ml.HealthWellbeingRecordsTrainingView`
- `ml.IncidentReportsTrainingView`
- `ml.InterventionPlansTrainingView`
- `ml.SocialMediaPostsTrainingView`

## Required columns

### `ml.SupportersTrainingView`

- `supporter_id`
- `supporter_type`
- `relationship_type`
- `acquisition_channel`
- `status`

### `ml.DonationsTrainingView`

- `donation_id`
- `supporter_id`
- `donation_date`
- `amount`
- `donation_type`
- `is_recurring`
- `campaign_name`
- `channel_source`

### `ml.ResidentsTrainingView`

- `resident_id`
- `safehouse_id`
- `case_status`
- `case_category`
- `sub_cat_trafficked`
- `sub_cat_physical_abuse`
- `sub_cat_sexual_abuse`
- `sub_cat_osaec`
- `sub_cat_at_risk`
- `sub_cat_street_child`
- `is_pwd`
- `has_special_needs`
- `family_is_4ps`
- `family_solo_parent`
- `family_indigenous`
- `family_informal_settler`
- `initial_risk_level`
- `current_risk_level`
- `reintegration_status`
- `reintegration_type`

### `ml.ProcessRecordingsTrainingView`

- `recording_id`
- `resident_id`
- `progress_noted`
- `concerns_flagged`
- `referral_made`
- `session_duration_minutes`

### `ml.HomeVisitationsTrainingView`

- `visitation_id`
- `resident_id`
- `safety_concerns_noted`
- `follow_up_needed`
- `family_cooperation_level`
- `visit_outcome`

### `ml.EducationRecordsTrainingView`

- `resident_id`
- `record_date`
- `progress_percent`
- `attendance_rate`
- `completion_status`

### `ml.HealthWellbeingRecordsTrainingView`

- `resident_id`
- `record_date`
- `general_health_score`
- `nutrition_score`
- `sleep_quality_score`
- `energy_level_score`
- `bmi`

### `ml.IncidentReportsTrainingView`

- `incident_id`
- `resident_id`
- `resolved`
- `severity`
- `follow_up_required`
- `incident_type`

### `ml.InterventionPlansTrainingView`

- `plan_id`
- `resident_id`
- `status`

### `ml.SocialMediaPostsTrainingView`

- `created_at`
- `platform`
- `post_type`
- `media_type`
- `content_topic`
- `sentiment_tone`
- `caption_length`
- `num_hashtags`
- `mentions_count`
- `features_resident_story`
- `has_call_to_action`
- `is_boosted`
- `follower_count_at_post`
- `day_of_week`
- `post_hour`
- `likes`
- `comments`
- `shares`
- `estimated_donation_value_php`

## Notes

- Boolean-style fields should be projected as `0/1` or SQL `bit` columns.
- Date columns should be valid SQL datetime/date types.
- String category values should remain stable over time. If production source tables use codes, convert them into model-facing labels in the views.
- The social-media model computes `time_bucket` from `post_hour`, so that column is required even if the source platform already stores a bucket label.
