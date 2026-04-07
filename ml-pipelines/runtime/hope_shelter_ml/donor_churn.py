from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import GridSearchCV, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .common import ModelBundle, timestamp_version


NUMERIC_FEATURES = [
    "recency_days",
    "donation_count",
    "total_amount",
    "avg_amount",
    "tenure_days",
    "avg_days_between",
    "has_recurring",
    "campaign_count",
    "std_amount",
    "unique_channels",
]
CATEGORICAL_FEATURES = ["acquisition_channel", "relationship_type"]


@dataclass(frozen=True)
class DonorChurnTrainingResult:
    bundle: ModelBundle
    donor_features: pd.DataFrame
    predictions: pd.DataFrame


def build_donor_feature_table(
    supporters: pd.DataFrame,
    donations: pd.DataFrame,
    *,
    reference_date: pd.Timestamp = pd.Timestamp("2025-06-01"),
    lapse_window_days: int = 180,
) -> pd.DataFrame:
    donations = donations.copy()
    donations["donation_date"] = pd.to_datetime(donations["donation_date"])
    donations["amount"] = pd.to_numeric(donations["amount"], errors="coerce")

    monetary = donations[donations["donation_type"] == "Monetary"].copy()
    hist = monetary[monetary["donation_date"] <= reference_date].copy()
    future = monetary[
        (monetary["donation_date"] > reference_date)
        & (monetary["donation_date"] <= reference_date + pd.Timedelta(days=lapse_window_days))
    ].copy()

    donor_features = hist.groupby("supporter_id").agg(
        donation_count=("donation_id", "count"),
        total_amount=("amount", "sum"),
        avg_amount=("amount", "mean"),
        max_amount=("amount", "max"),
        min_amount=("amount", "min"),
        std_amount=("amount", "std"),
        first_donation=("donation_date", "min"),
        last_donation=("donation_date", "max"),
        has_recurring=("is_recurring", "max"),
        campaign_count=("campaign_name", lambda values: values.notna().sum()),
        unique_channels=("channel_source", "nunique"),
    ).reset_index()

    if donor_features.empty:
        raise ValueError("Donor churn training requires at least one historical monetary donation.")

    donor_features["recency_days"] = (reference_date - donor_features["last_donation"]).dt.days
    donor_features["tenure_days"] = (reference_date - donor_features["first_donation"]).dt.days
    donor_features["avg_days_between"] = (
        donor_features["tenure_days"] / donor_features["donation_count"].clip(lower=1)
    )
    donor_features["std_amount"] = donor_features["std_amount"].fillna(0)

    donor_features = donor_features.merge(
        supporters[
            [
                "supporter_id",
                "supporter_type",
                "relationship_type",
                "acquisition_channel",
                "status",
            ]
        ],
        on="supporter_id",
        how="left",
    )

    future_donors = set(future["supporter_id"].unique())
    donor_features["lapsed"] = (~donor_features["supporter_id"].isin(future_donors)).astype(int)
    donor_features[CATEGORICAL_FEATURES] = donor_features[CATEGORICAL_FEATURES].fillna("Unknown")

    return donor_features


def score_donor_churn_batch(
    model: Pipeline,
    donor_features: pd.DataFrame,
    *,
    medium_threshold: float = 0.4,
    high_threshold: float = 0.7,
) -> pd.DataFrame:
    features = donor_features[NUMERIC_FEATURES + CATEGORICAL_FEATURES].copy()
    probabilities = model.predict_proba(features)[:, 1]
    risk_band = np.select(
        [probabilities >= high_threshold, probabilities >= medium_threshold],
        ["High", "Medium"],
        default="Low",
    )

    return pd.DataFrame(
        {
            "supporter_id": donor_features["supporter_id"].astype(int),
            "risk_score": probabilities.astype(float),
            "risk_band": risk_band.astype(str),
        }
    )


def train_donor_churn_model(
    supporters: pd.DataFrame,
    donations: pd.DataFrame,
    *,
    model_version: str | None = None,
    reference_date: pd.Timestamp = pd.Timestamp("2025-06-01"),
    lapse_window_days: int = 180,
) -> DonorChurnTrainingResult:
    donor_features = build_donor_feature_table(
        supporters,
        donations,
        reference_date=reference_date,
        lapse_window_days=lapse_window_days,
    )

    X = donor_features[NUMERIC_FEATURES + CATEGORICAL_FEATURES].copy()
    y = donor_features["lapsed"].copy()

    preprocessor = ColumnTransformer(
        transformers=[
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
        test_size=0.25,
        random_state=42,
        stratify=y,
    )

    gb_pipe = Pipeline(
        [
            ("prep", preprocessor),
            ("clf", GradientBoostingClassifier(random_state=42)),
        ]
    )
    grid_search = GridSearchCV(
        gb_pipe,
        {
            "clf__n_estimators": [50, 100, 200],
            "clf__max_depth": [2, 3, 4],
            "clf__learning_rate": [0.05, 0.1, 0.2],
        },
        cv=5,
        scoring="roc_auc",
        n_jobs=-1,
    )
    grid_search.fit(X_train, y_train)

    best_model = grid_search.best_estimator_
    y_prob = best_model.predict_proba(X_test)[:, 1]
    y_pred = best_model.predict(X_test)
    cv_scores = cross_val_score(best_model, X_train, y_train, cv=5, scoring="roc_auc")

    metrics = {
        "referenceDate": str(reference_date.date()),
        "lapseWindowDays": lapse_window_days,
        "trainingSamples": int(X_train.shape[0]),
        "testSamples": int(X_test.shape[0]),
        "testAuc": float(roc_auc_score(y_test, y_prob)),
        "cvAucMean": float(cv_scores.mean()),
        "cvAucStd": float(cv_scores.std()),
        "classificationReport": classification_report(
            y_test,
            y_pred,
            target_names=["Retained", "Lapsed"],
            output_dict=True,
            zero_division=0,
        ),
        "bestParameters": grid_search.best_params_,
    }

    config = {
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "reference_date": str(reference_date.date()),
        "lapse_window_days": lapse_window_days,
        "risk_thresholds": {"high": 0.7, "medium": 0.4, "low": 0.0},
    }

    bundle = ModelBundle(
        model_name="donor-churn",
        model_version=model_version or timestamp_version("donor-churn"),
        joblib_artifacts={"model.joblib": best_model},
        json_artifacts={
            "config.json": config,
            "metrics.json": metrics,
        },
    )

    predictions = score_donor_churn_batch(best_model, donor_features)
    return DonorChurnTrainingResult(
        bundle=bundle,
        donor_features=donor_features,
        predictions=predictions,
    )
