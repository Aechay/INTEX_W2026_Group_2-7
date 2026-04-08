import pandas as pd

from hope_shelter_ml.donor_churn import build_donor_feature_table
from hope_shelter_ml.resident_risk import build_resident_feature_table
from hope_shelter_ml.social_media import prepare_social_media_training_frame
from hope_shelter_ml.social_media_inference import normalize_social_media_request


def test_build_donor_feature_table_creates_lapse_target_and_rates():
    supporters = pd.DataFrame(
        [
            {
                "supporter_id": 1,
                "supporter_type": "Individual",
                "relationship_type": "Recurring",
                "acquisition_channel": "Social",
                "status": "Active",
            }
        ]
    )
    donations = pd.DataFrame(
        [
            {
                "donation_id": 10,
                "supporter_id": 1,
                "donation_type": "Monetary",
                "donation_date": "2025-01-01",
                "amount": 100,
                "is_recurring": 1,
                "campaign_name": "Campaign A",
                "channel_source": "Facebook",
            },
            {
                "donation_id": 11,
                "supporter_id": 1,
                "donation_type": "Monetary",
                "donation_date": "2025-02-01",
                "amount": 150,
                "is_recurring": 1,
                "campaign_name": "Campaign B",
                "channel_source": "Email",
            },
        ]
    )

    features = build_donor_feature_table(
        supporters,
        donations,
        reference_date=pd.Timestamp("2025-06-01"),
        lapse_window_days=180,
    )

    assert {"recency_days", "avg_days_between", "lapsed"}.issubset(features.columns)
    assert int(features.iloc[0]["lapsed"]) == 1
    assert float(features.iloc[0]["avg_days_between"]) > 0


def test_build_resident_feature_table_merges_numeric_features():
    residents = pd.DataFrame(
        [
            {
                "resident_id": 1,
                "safehouse_id": 1,
                "case_status": "Open",
                "case_category": "A",
                "sub_cat_trafficked": True,
                "sub_cat_physical_abuse": False,
                "sub_cat_sexual_abuse": False,
                "sub_cat_osaec": False,
                "sub_cat_at_risk": True,
                "sub_cat_street_child": False,
                "is_pwd": False,
                "has_special_needs": False,
                "family_is_4ps": False,
                "family_solo_parent": True,
                "family_indigenous": False,
                "family_informal_settler": True,
                "initial_risk_level": "Medium",
                "current_risk_level": "High",
                "reintegration_status": "In Progress",
            }
        ]
    )
    process_recordings = pd.DataFrame(
        [
            {
                "recording_id": 1,
                "resident_id": 1,
                "progress_noted": 1,
                "concerns_flagged": 1,
                "referral_made": 0,
                "session_duration_minutes": 30,
            }
        ]
    )
    home_visitations = pd.DataFrame(
        [
            {
                "visitation_id": 1,
                "resident_id": 1,
                "safety_concerns_noted": 1,
                "follow_up_needed": 1,
                "family_cooperation_level": "Cooperative",
                "visit_outcome": "Needs Improvement",
            }
        ]
    )
    education_records = pd.DataFrame(
        [
            {
                "education_record_id": 1,
                "resident_id": 1,
                "record_date": "2025-01-01",
                "progress_percent": 40,
                "attendance_rate": 0.8,
            },
            {
                "education_record_id": 2,
                "resident_id": 1,
                "record_date": "2025-02-01",
                "progress_percent": 55,
                "attendance_rate": 0.9,
            },
        ]
    )
    health_records = pd.DataFrame(
        [
            {
                "health_record_id": 1,
                "resident_id": 1,
                "record_date": "2025-01-01",
                "general_health_score": 3,
                "nutrition_score": 3,
                "sleep_quality_score": 2,
                "energy_level_score": 3,
                "bmi": 18.2,
            },
            {
                "health_record_id": 2,
                "resident_id": 1,
                "record_date": "2025-02-01",
                "general_health_score": 4,
                "nutrition_score": 4,
                "sleep_quality_score": 3,
                "energy_level_score": 4,
                "bmi": 18.4,
            },
        ]
    )
    incident_reports = pd.DataFrame(
        [
            {
                "incident_id": 1,
                "resident_id": 1,
                "resolved": False,
                "severity": "High",
                "follow_up_required": 1,
                "incident_type": "Behavioral",
            }
        ]
    )
    intervention_plans = pd.DataFrame(
        [
            {
                "plan_id": 1,
                "resident_id": 1,
                "status": "Open",
            }
        ]
    )

    features = build_resident_feature_table(
        residents,
        process_recordings,
        home_visitations,
        education_records,
        health_records,
        incident_reports,
        intervention_plans,
    )

    assert {"concern_rate", "health_change", "risk_num"}.issubset(features.columns)
    assert int(features.iloc[0]["risk_num"]) == 2


def test_prepare_social_media_training_frame_adds_engineered_columns():
    social_posts = pd.DataFrame(
        [
            {
                "post_id": 1,
                "created_at": "2025-01-01T10:00:00",
                "features_resident_story": True,
                "has_call_to_action": True,
                "is_boosted": False,
                "likes": 10,
                "comments": 2,
                "shares": 1,
                "estimated_donation_value_php": 2500,
                "day_of_week": "Wednesday",
                "post_hour": 10,
                "platform": "Facebook",
                "post_type": "ImpactStory",
                "media_type": "Photo",
                "content_topic": "DonorImpact",
                "sentiment_tone": "Hopeful",
                "caption_length": 200,
                "num_hashtags": 4,
                "mentions_count": 1,
                "follower_count_at_post": 5000,
            }
        ]
    )

    frame = prepare_social_media_training_frame(social_posts)

    assert {"is_story", "is_cta", "is_weekend", "time_bucket", "log_donation_value"}.issubset(
        frame.columns
    )
    assert frame.iloc[0]["time_bucket"] == "Morning"


def test_normalize_social_media_request_accepts_camel_case_payload():
    frame = normalize_social_media_request(
        {
            "platform": "Facebook",
            "postType": "ImpactStory",
            "mediaType": "Photo",
            "contentTopic": "DonorImpact",
            "sentimentTone": "Hopeful",
            "timeBucket": "Morning",
            "captionLength": 120,
            "numHashtags": 3,
            "mentionsCount": 1,
            "isCta": 1,
            "isStory": 1,
            "isBoostedFlag": 0,
            "followerCountAtPost": 5000,
            "isWeekend": 0,
            "postHour": 10,
        }
    )

    assert list(frame.columns) == [
        "caption_length",
        "num_hashtags",
        "mentions_count",
        "is_cta",
        "is_story",
        "is_boosted_flag",
        "follower_count_at_post",
        "is_weekend",
        "post_hour",
        "platform",
        "post_type",
        "media_type",
        "content_topic",
        "sentiment_tone",
        "time_bucket",
    ]
    assert frame.iloc[0]["post_type"] == "ImpactStory"
    assert frame.iloc[0]["follower_count_at_post"] == 5000
