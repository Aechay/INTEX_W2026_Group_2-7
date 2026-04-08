from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd


NUMERIC_FEATURES = [
    "caption_length",
    "num_hashtags",
    "mentions_count",
    "is_cta",
    "is_story",
    "is_boosted_flag",
    "follower_count_at_post",
    "is_weekend",
    "post_hour",
]
CATEGORICAL_FEATURES = [
    "platform",
    "post_type",
    "media_type",
    "content_topic",
    "sentiment_tone",
    "time_bucket",
]
SOCIAL_REQUEST_FIELDS = [*NUMERIC_FEATURES, *CATEGORICAL_FEATURES]
FIELD_ALIASES = {
    "platform": ("platform", "Platform"),
    "post_type": ("post_type", "postType", "PostType"),
    "media_type": ("media_type", "mediaType", "MediaType"),
    "content_topic": ("content_topic", "contentTopic", "ContentTopic"),
    "sentiment_tone": ("sentiment_tone", "sentimentTone", "SentimentTone"),
    "time_bucket": ("time_bucket", "timeBucket", "TimeBucket"),
    "caption_length": ("caption_length", "captionLength", "CaptionLength"),
    "num_hashtags": ("num_hashtags", "numHashtags", "NumHashtags"),
    "mentions_count": ("mentions_count", "mentionsCount", "MentionsCount"),
    "is_cta": ("is_cta", "isCta", "IsCta"),
    "is_story": ("is_story", "isStory", "IsStory"),
    "is_boosted_flag": ("is_boosted_flag", "isBoostedFlag", "IsBoostedFlag"),
    "follower_count_at_post": (
        "follower_count_at_post",
        "followerCountAtPost",
        "FollowerCountAtPost",
    ),
    "is_weekend": ("is_weekend", "isWeekend", "IsWeekend"),
    "post_hour": ("post_hour", "postHour", "PostHour"),
}


def canonicalize_social_media_payload(payload: dict[str, Any]) -> dict[str, Any]:
    canonical_payload: dict[str, Any] = {}

    for canonical_field, aliases in FIELD_ALIASES.items():
        canonical_payload[canonical_field] = next(
            (payload[alias] for alias in aliases if alias in payload),
            None,
        )

    return canonical_payload


def normalize_social_media_request(payload: dict[str, Any]) -> pd.DataFrame:
    row = canonicalize_social_media_payload(payload)

    if row.get("time_bucket") in (None, "") and row.get("post_hour") is not None:
        post_hour = int(row["post_hour"])
        if 0 <= post_hour < 6:
            row["time_bucket"] = "Night"
        elif 6 <= post_hour < 12:
            row["time_bucket"] = "Morning"
        elif 12 <= post_hour < 18:
            row["time_bucket"] = "Afternoon"
        else:
            row["time_bucket"] = "Evening"

    frame = pd.DataFrame([row], columns=SOCIAL_REQUEST_FIELDS)
    for field in NUMERIC_FEATURES:
        frame[field] = pd.to_numeric(frame[field], errors="raise")

    for field in CATEGORICAL_FEATURES:
        frame[field] = frame[field].astype(str)

    return frame


def predict_social_media_value(model: Any, payload: dict[str, Any]) -> float:
    frame = normalize_social_media_request(payload)
    prediction_log = float(model.predict(frame)[0])
    return float(np.expm1(prediction_log))
