from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from typing import Any, Iterable

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GridSearchCV, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .common import ModelBundle, timestamp_version


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


@dataclass(frozen=True)
class SocialMediaTrainingResult:
    bundle: ModelBundle


def prepare_social_media_training_frame(social_posts: pd.DataFrame) -> pd.DataFrame:
    social = social_posts.copy()
    social["created_at"] = pd.to_datetime(social["created_at"])
    social["is_story"] = social["features_resident_story"].astype(int)
    social["is_cta"] = social["has_call_to_action"].astype(int)
    social["is_boosted_flag"] = social["is_boosted"].astype(int)
    social["engagements"] = social[["likes", "comments", "shares"]].fillna(0).sum(axis=1)
    social["log_donation_value"] = np.log1p(social["estimated_donation_value_php"])
    social["is_weekend"] = social["day_of_week"].isin(["Saturday", "Sunday"]).astype(int)
    social["time_bucket"] = pd.cut(
        social["post_hour"],
        bins=[0, 6, 12, 18, 24],
        labels=["Night", "Morning", "Afternoon", "Evening"],
        right=False,
    )

    model_data = social.dropna(subset=SOCIAL_REQUEST_FIELDS + ["log_donation_value"]).copy()
    if model_data.empty:
        raise ValueError("Social media training requires non-null features and target rows.")

    return model_data


def train_social_media_model(
    social_posts: pd.DataFrame,
    *,
    model_version: str | None = None,
) -> SocialMediaTrainingResult:
    model_data = prepare_social_media_training_frame(social_posts)
    X = model_data[SOCIAL_REQUEST_FIELDS].copy()
    y = model_data["log_donation_value"].copy()

    preprocessor = ColumnTransformer(
        [
            ("num", StandardScaler(), NUMERIC_FEATURES),
            (
                "cat",
                OneHotEncoder(drop="first", sparse_output=False, handle_unknown="ignore"),
                CATEGORICAL_FEATURES,
            ),
        ]
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
    )

    gb_pipe = Pipeline(
        [
            ("prep", preprocessor),
            ("reg", GradientBoostingRegressor(random_state=42)),
        ]
    )
    grid_search = GridSearchCV(
        gb_pipe,
        {
            "reg__n_estimators": [100, 200, 300],
            "reg__max_depth": [3, 4, 5],
            "reg__learning_rate": [0.05, 0.1, 0.15],
        },
        cv=5,
        scoring="r2",
        n_jobs=-1,
    )
    grid_search.fit(X_train, y_train)

    best_model = grid_search.best_estimator_
    y_pred = best_model.predict(X_test)
    y_test_php = np.expm1(y_test)
    y_pred_php = np.expm1(y_pred)
    cv_scores = cross_val_score(best_model, X_train, y_train, cv=5, scoring="r2")

    metrics = {
        "trainingSamples": int(X_train.shape[0]),
        "testSamples": int(X_test.shape[0]),
        "bestParameters": grid_search.best_params_,
        "bestCvR2": float(grid_search.best_score_),
        "testR2": float(r2_score(y_test, y_pred)),
        "cvR2Mean": float(cv_scores.mean()),
        "cvR2Std": float(cv_scores.std()),
        "testRmsePhp": float(np.sqrt(mean_squared_error(y_test_php, y_pred_php))),
        "testMaePhp": float(mean_absolute_error(y_test_php, y_pred_php)),
    }

    config = {
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "target": "log1p(estimated_donation_value_php)",
        "note": "Exponentiate predictions with np.expm1() to get PHP values.",
    }

    bundle = ModelBundle(
        model_name="social-media",
        model_version=model_version or timestamp_version("social-media"),
        joblib_artifacts={"model.joblib": best_model},
        json_artifacts={"config.json": config, "metrics.json": metrics},
    )

    return SocialMediaTrainingResult(bundle=bundle)


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


def predict_social_media_value(model: Pipeline, payload: dict[str, Any]) -> float:
    frame = normalize_social_media_request(payload)
    prediction_log = float(model.predict(frame)[0])
    return float(np.expm1(prediction_log))
