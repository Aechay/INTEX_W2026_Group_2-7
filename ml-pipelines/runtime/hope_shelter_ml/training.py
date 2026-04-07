from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any
from uuid import uuid4

import pandas as pd

from .blob_store import BlobArtifactStore, publish_bundle_locally
from .common import utcnow
from .donor_churn import DonorChurnTrainingResult, train_donor_churn_model
from .resident_risk import ResidentRiskTrainingResult, train_resident_risk_model
from .settings import RuntimeSettings, load_runtime_settings
from .social_media import SocialMediaTrainingResult, train_social_media_model
from .sql import SqlDatabase


@dataclass(frozen=True)
class TrainingRunResult:
    donor_churn: DonorChurnTrainingResult
    resident_risk: ResidentRiskTrainingResult
    social_media: SocialMediaTrainingResult


def _load_csv_frame(data_dir: Path, filename: str) -> pd.DataFrame:
    path = data_dir / filename
    if not path.exists():
        raise FileNotFoundError(f"Expected training file '{path}' was not found.")
    return pd.read_csv(path)


def load_training_frames(settings: RuntimeSettings) -> dict[str, pd.DataFrame]:
    if settings.input_mode == "sql":
        sql = SqlDatabase(settings.sql)
        return {
            name: sql.read_view(view_name)
            for name, view_name in settings.training_views.items()
        }

    if settings.input_mode != "csv":
        raise ValueError(f"Unsupported ML_INPUT_MODE '{settings.input_mode}'.")

    data_dir = settings.data_dir
    return {
        "supporters": _load_csv_frame(data_dir, "supporters.csv"),
        "donations": _load_csv_frame(data_dir, "donations.csv"),
        "residents": _load_csv_frame(data_dir, "residents.csv"),
        "process_recordings": _load_csv_frame(data_dir, "process_recordings.csv"),
        "home_visitations": _load_csv_frame(data_dir, "home_visitations.csv"),
        "education_records": _load_csv_frame(data_dir, "education_records.csv"),
        "health_records": _load_csv_frame(data_dir, "health_wellbeing_records.csv"),
        "incident_reports": _load_csv_frame(data_dir, "incident_reports.csv"),
        "intervention_plans": _load_csv_frame(data_dir, "intervention_plans.csv"),
        "social_media_posts": _load_csv_frame(data_dir, "social_media_posts.csv"),
    }


def run_training(settings: RuntimeSettings | None = None) -> TrainingRunResult:
    runtime_settings = settings or load_runtime_settings()
    frames = load_training_frames(runtime_settings)

    donor_churn = train_donor_churn_model(frames["supporters"], frames["donations"])
    resident_risk = train_resident_risk_model(
        frames["residents"],
        frames["process_recordings"],
        frames["home_visitations"],
        frames["education_records"],
        frames["health_records"],
        frames["incident_reports"],
        frames["intervention_plans"],
    )
    social_media = train_social_media_model(frames["social_media_posts"])

    return TrainingRunResult(
        donor_churn=donor_churn,
        resident_risk=resident_risk,
        social_media=social_media,
    )


def publish_training_run(
    result: TrainingRunResult,
    *,
    settings: RuntimeSettings | None = None,
    output_dir: Path | None = None,
) -> dict[str, Any]:
    runtime_settings = settings or load_runtime_settings()
    manifests: dict[str, Any] = {}

    if output_dir is not None:
        manifests["donor_churn"] = publish_bundle_locally(result.donor_churn.bundle, output_dir)
        manifests["resident_risk"] = publish_bundle_locally(result.resident_risk.bundle, output_dir)
        manifests["social_media"] = publish_bundle_locally(result.social_media.bundle, output_dir)
        return manifests

    store = BlobArtifactStore(runtime_settings.blob)
    manifests["donor_churn"] = store.publish_bundle(result.donor_churn.bundle)
    manifests["resident_risk"] = store.publish_bundle(result.resident_risk.bundle)
    manifests["social_media"] = store.publish_bundle(result.social_media.bundle)
    return manifests


def persist_batch_predictions(
    result: TrainingRunResult,
    *,
    settings: RuntimeSettings | None = None,
) -> None:
    runtime_settings = settings or load_runtime_settings()
    sql = SqlDatabase(runtime_settings.sql)
    run_id = str(uuid4())
    run_started_at = utcnow()
    run_completed_at = utcnow()

    with sql.transaction() as connection:
        for training_result, artifact_key in [
            (result.donor_churn, "donor-churn"),
            (result.resident_risk, "resident-risk"),
            (result.social_media, "social-media"),
        ]:
            sql.append_model_run(
                connection,
                run_id=run_id,
                model_name=training_result.bundle.model_name,
                model_version=training_result.bundle.model_version,
                status="Succeeded",
                started_at=run_started_at,
                completed_at=run_completed_at,
                metrics_json=training_result.bundle.json_artifacts["metrics.json"],
                artifact_uri=f"models/{artifact_key}/{training_result.bundle.model_version}",
            )

        sql.append_donor_predictions(
            connection,
            run_id=run_id,
            model_version=result.donor_churn.bundle.model_version,
            scored_at=run_completed_at,
            predictions=result.donor_churn.predictions,
        )
        sql.append_resident_predictions(
            connection,
            run_id=run_id,
            model_version=result.resident_risk.bundle.model_version,
            scored_at=run_completed_at,
            predictions=result.resident_risk.predictions,
        )
