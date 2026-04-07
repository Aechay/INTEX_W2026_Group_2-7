from __future__ import annotations

from dataclasses import dataclass

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import GridSearchCV, StratifiedKFold, cross_val_predict, cross_val_score
from sklearn.preprocessing import StandardScaler

from .common import ModelBundle, sanitize_column_name, timestamp_version


RISK_MAP = {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}
RISK_LABELS = ["Low", "Medium", "High", "Critical"]


@dataclass(frozen=True)
class ResidentRiskTrainingResult:
    bundle: ModelBundle
    resident_features: pd.DataFrame
    predictions: pd.DataFrame


def build_resident_feature_table(
    residents: pd.DataFrame,
    process_recordings: pd.DataFrame,
    home_visitations: pd.DataFrame,
    education_records: pd.DataFrame,
    health_records: pd.DataFrame,
    incident_reports: pd.DataFrame,
    intervention_plans: pd.DataFrame,
) -> pd.DataFrame:
    process_recordings = process_recordings.copy()
    home_visitations = home_visitations.copy()
    education_records = education_records.copy()
    health_records = health_records.copy()
    incident_reports = incident_reports.copy()

    pr_features = process_recordings.groupby("resident_id").agg(
        total_sessions=("recording_id", "count"),
        sessions_with_progress=("progress_noted", "sum"),
        sessions_with_concerns=("concerns_flagged", "sum"),
        sessions_with_referral=("referral_made", "sum"),
        avg_session_duration=("session_duration_minutes", "mean"),
    ).reset_index()
    pr_features["progress_rate"] = pr_features["sessions_with_progress"] / pr_features[
        "total_sessions"
    ].clip(lower=1)
    pr_features["concern_rate"] = pr_features["sessions_with_concerns"] / pr_features[
        "total_sessions"
    ].clip(lower=1)

    hv_features = home_visitations.groupby("resident_id").agg(
        total_visits=("visitation_id", "count"),
        visits_with_safety_concerns=("safety_concerns_noted", "sum"),
        visits_needing_followup=("follow_up_needed", "sum"),
    ).reset_index()

    coop_map = {
        "Highly Cooperative": 3,
        "Cooperative": 2,
        "Neutral": 1,
        "Uncooperative": 0,
    }
    home_visitations["coop_num"] = home_visitations["family_cooperation_level"].map(coop_map)
    hv_coop = home_visitations.groupby("resident_id")["coop_num"].mean().reset_index()
    hv_coop.columns = ["resident_id", "avg_family_cooperation"]

    outcome_map = {
        "Favorable": 3,
        "Needs Improvement": 2,
        "Inconclusive": 1,
        "Unfavorable": 0,
    }
    home_visitations["outcome_num"] = home_visitations["visit_outcome"].map(outcome_map)
    hv_outcome = home_visitations.groupby("resident_id")["outcome_num"].mean().reset_index()
    hv_outcome.columns = ["resident_id", "avg_visit_outcome"]

    hv_features = hv_features.merge(hv_coop, on="resident_id", how="left")
    hv_features = hv_features.merge(hv_outcome, on="resident_id", how="left")
    hv_features["safety_concern_rate"] = hv_features["visits_with_safety_concerns"] / hv_features[
        "total_visits"
    ].clip(lower=1)
    hv_features["followup_rate"] = hv_features["visits_needing_followup"] / hv_features[
        "total_visits"
    ].clip(lower=1)

    education_records["record_date"] = pd.to_datetime(education_records["record_date"])
    ed_first = (
        education_records.sort_values("record_date")
        .groupby("resident_id")
        .first()[["progress_percent", "attendance_rate"]]
        .reset_index()
    )
    ed_first.columns = ["resident_id", "ed_progress_first", "ed_attendance_first"]
    ed_last = (
        education_records.sort_values("record_date")
        .groupby("resident_id")
        .last()[["progress_percent", "attendance_rate"]]
        .reset_index()
    )
    ed_last.columns = ["resident_id", "ed_progress_last", "ed_attendance_last"]
    ed_features = ed_first.merge(ed_last, on="resident_id")
    ed_features["ed_progress_change"] = (
        ed_features["ed_progress_last"] - ed_features["ed_progress_first"]
    )
    ed_features["ed_attendance_change"] = (
        ed_features["ed_attendance_last"] - ed_features["ed_attendance_first"]
    )
    ed_avg = education_records.groupby("resident_id").agg(
        avg_education_progress=("progress_percent", "mean"),
        avg_attendance=("attendance_rate", "mean"),
    ).reset_index()
    ed_features = ed_features.merge(ed_avg, on="resident_id", how="left")

    health_records["record_date"] = pd.to_datetime(health_records["record_date"])
    h_first = (
        health_records.sort_values("record_date")
        .groupby("resident_id")
        .first()[
            [
                "general_health_score",
                "nutrition_score",
                "sleep_quality_score",
                "energy_level_score",
                "bmi",
            ]
        ]
        .reset_index()
    )
    h_first.columns = [
        "resident_id",
        "health_first",
        "nutrition_first",
        "sleep_first",
        "energy_first",
        "bmi_first",
    ]
    h_last = (
        health_records.sort_values("record_date")
        .groupby("resident_id")
        .last()[
            [
                "general_health_score",
                "nutrition_score",
                "sleep_quality_score",
                "energy_level_score",
                "bmi",
            ]
        ]
        .reset_index()
    )
    h_last.columns = [
        "resident_id",
        "health_last",
        "nutrition_last",
        "sleep_last",
        "energy_last",
        "bmi_last",
    ]
    h_features = h_first.merge(h_last, on="resident_id")
    h_features["health_change"] = h_features["health_last"] - h_features["health_first"]
    h_features["nutrition_change"] = h_features["nutrition_last"] - h_features["nutrition_first"]
    h_features["sleep_change"] = h_features["sleep_last"] - h_features["sleep_first"]
    h_avg = health_records.groupby("resident_id").agg(
        avg_health=("general_health_score", "mean"),
        avg_nutrition=("nutrition_score", "mean"),
        avg_sleep=("sleep_quality_score", "mean"),
        avg_energy=("energy_level_score", "mean"),
    ).reset_index()
    h_features = h_features.merge(h_avg, on="resident_id", how="left")

    inc_features = incident_reports.groupby("resident_id").agg(
        total_incidents=("incident_id", "count"),
        unresolved_incidents=("resolved", lambda values: (~values).sum()),
        high_severity_incidents=("severity", lambda values: (values == "High").sum()),
        followup_required_incidents=("follow_up_required", "sum"),
    ).reset_index()

    for incident_type in incident_reports["incident_type"].dropna().unique():
        column_name = f"incidents_{sanitize_column_name(str(incident_type))}"
        type_counts = (
            incident_reports[incident_reports["incident_type"] == incident_type]
            .groupby("resident_id")
            .size()
            .reset_index(name=column_name)
        )
        inc_features = inc_features.merge(type_counts, on="resident_id", how="left")

    inc_features = inc_features.fillna(0)
    inc_features["unresolved_rate"] = inc_features["unresolved_incidents"] / inc_features[
        "total_incidents"
    ].clip(lower=1)

    ip_features = intervention_plans.groupby("resident_id").agg(
        total_plans=("plan_id", "count"),
        plans_achieved=("status", lambda values: (values == "Achieved").sum()),
        plans_open=("status", lambda values: (values == "Open").sum()),
        plans_in_progress=("status", lambda values: (values == "In Progress").sum()),
        plans_on_hold=("status", lambda values: (values == "On Hold").sum()),
    ).reset_index()
    ip_features["plan_achievement_rate"] = ip_features["plans_achieved"] / ip_features[
        "total_plans"
    ].clip(lower=1)
    ip_features["plan_stall_rate"] = ip_features["plans_on_hold"] / ip_features[
        "total_plans"
    ].clip(lower=1)

    resident_base = residents[
        [
            "resident_id",
            "safehouse_id",
            "case_status",
            "case_category",
            "sub_cat_trafficked",
            "sub_cat_physical_abuse",
            "sub_cat_sexual_abuse",
            "sub_cat_osaec",
            "sub_cat_at_risk",
            "sub_cat_street_child",
            "is_pwd",
            "has_special_needs",
            "family_is_4ps",
            "family_solo_parent",
            "family_indigenous",
            "family_informal_settler",
            "initial_risk_level",
            "current_risk_level",
            "reintegration_status",
        ]
    ].copy()

    bool_columns = [
        "sub_cat_trafficked",
        "sub_cat_physical_abuse",
        "sub_cat_sexual_abuse",
        "sub_cat_osaec",
        "sub_cat_at_risk",
        "sub_cat_street_child",
        "is_pwd",
        "has_special_needs",
        "family_is_4ps",
        "family_solo_parent",
        "family_indigenous",
        "family_informal_settler",
    ]
    for column in bool_columns:
        resident_base[column] = resident_base[column].astype(int)

    resident_ml = resident_base.copy()
    for frame in [pr_features, hv_features, ed_features, h_features, inc_features, ip_features]:
        resident_ml = resident_ml.merge(frame, on="resident_id", how="left")

    resident_ml = resident_ml.fillna(0)
    resident_ml["risk_num"] = resident_ml["current_risk_level"].map(RISK_MAP)
    resident_ml["elevated_risk"] = (resident_ml["risk_num"] >= 2).astype(int)
    return resident_ml


def train_resident_risk_model(
    residents: pd.DataFrame,
    process_recordings: pd.DataFrame,
    home_visitations: pd.DataFrame,
    education_records: pd.DataFrame,
    health_records: pd.DataFrame,
    incident_reports: pd.DataFrame,
    intervention_plans: pd.DataFrame,
    *,
    model_version: str | None = None,
) -> ResidentRiskTrainingResult:
    resident_ml = build_resident_feature_table(
        residents,
        process_recordings,
        home_visitations,
        education_records,
        health_records,
        incident_reports,
        intervention_plans,
    )

    exclude_columns = {
        "resident_id",
        "safehouse_id",
        "case_status",
        "case_category",
        "initial_risk_level",
        "current_risk_level",
        "reintegration_status",
        "risk_num",
        "elevated_risk",
    }
    feature_columns = [
        column
        for column in resident_ml.columns
        if column not in exclude_columns
        and resident_ml[column].dtype in ["int64", "float64", "int32", "float32", "bool"]
    ]

    X = resident_ml[feature_columns].copy().astype(float)
    y_multi = resident_ml["risk_num"].copy()
    y_binary = resident_ml["elevated_risk"].copy()

    scaler = StandardScaler()
    X_scaled = pd.DataFrame(
        scaler.fit_transform(X),
        columns=feature_columns,
        index=X.index,
    )

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    grid_rf = GridSearchCV(
        RandomForestClassifier(random_state=42, class_weight="balanced"),
        {
            "n_estimators": [100, 200, 300],
            "max_depth": [3, 4, 5, 6],
            "min_samples_leaf": [1, 2, 3],
        },
        cv=cv,
        scoring="f1_weighted",
        n_jobs=-1,
    )
    grid_rf.fit(X_scaled, y_multi)

    best_model = grid_rf.best_estimator_
    y_pred_cv = cross_val_predict(best_model, X_scaled, y_multi, cv=cv)

    metrics = {
        "trainingSamples": int(X_scaled.shape[0]),
        "featureCount": len(feature_columns),
        "bestParameters": grid_rf.best_params_,
        "bestCvWeightedF1": float(grid_rf.best_score_),
        "binaryF1Mean": float(
            cross_val_score(
                RandomForestClassifier(
                    random_state=42,
                    n_estimators=100,
                    max_depth=4,
                    class_weight="balanced",
                ),
                X_scaled,
                y_binary,
                cv=cv,
                scoring="f1",
            ).mean()
        ),
        "classificationReport": classification_report(
            y_multi,
            y_pred_cv,
            target_names=RISK_LABELS,
            output_dict=True,
            zero_division=0,
        ),
    }

    config = {
        "features": feature_columns,
        "risk_labels": RISK_LABELS,
        "risk_map": RISK_MAP,
    }

    predictions = pd.DataFrame(
        {
            "resident_id": resident_ml["resident_id"].astype(int),
            "predicted_risk_num": best_model.predict(X_scaled).astype(int),
        }
    )
    reverse_risk_map = {value: key for key, value in RISK_MAP.items()}
    predictions["predicted_risk"] = predictions["predicted_risk_num"].map(reverse_risk_map)
    predictions["flag_for_review"] = (
        predictions["predicted_risk_num"] > resident_ml["risk_num"].astype(int)
    )

    bundle = ModelBundle(
        model_name="resident-risk",
        model_version=model_version or timestamp_version("resident-risk"),
        joblib_artifacts={
            "model.joblib": best_model,
            "scaler.joblib": scaler,
        },
        json_artifacts={
            "config.json": config,
            "metrics.json": metrics,
        },
    )

    return ResidentRiskTrainingResult(
        bundle=bundle,
        resident_features=resident_ml,
        predictions=predictions,
    )
