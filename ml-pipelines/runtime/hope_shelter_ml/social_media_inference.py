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


def normalize_social_media_request(payload: dict[str, Any]) -> pd.DataFrame:
    row = {field: payload.get(field) for field in SOCIAL_REQUEST_FIELDS}

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
