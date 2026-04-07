from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path


@dataclass(frozen=True)
class BlobStorageSettings:
    container_name: str = "ml-model-artifacts"
    account_url: str | None = None
    connection_string: str | None = None


@dataclass(frozen=True)
class SqlSettings:
    connection_string: str | None = None
    server: str | None = None
    database: str | None = None
    driver: str = "ODBC Driver 18 for SQL Server"
    connection_timeout_seconds: int = 120


@dataclass(frozen=True)
class RuntimeSettings:
    input_mode: str = "csv"
    data_dir: Path = Path("../lighthouse_csv_v7")
    blob: BlobStorageSettings = field(default_factory=BlobStorageSettings)
    sql: SqlSettings = field(default_factory=SqlSettings)
    function_shared_secret: str | None = None
    function_route: str = "/api/social-media/predict"
    social_media_latest_blob: str = "models/social-media/latest.json"
    training_views: dict[str, str] = field(default_factory=dict)


def load_runtime_settings() -> RuntimeSettings:
    return RuntimeSettings(
        input_mode=os.getenv("ML_INPUT_MODE", "csv").strip().lower(),
        data_dir=Path(os.getenv("ML_DATA_DIR", "../lighthouse_csv_v7")),
        blob=BlobStorageSettings(
            container_name=os.getenv("ML_STORAGE_CONTAINER_NAME", "ml-model-artifacts"),
            account_url=os.getenv("ML_STORAGE_ACCOUNT_URL"),
            connection_string=os.getenv("ML_STORAGE_CONNECTION_STRING"),
        ),
        sql=SqlSettings(
            connection_string=os.getenv("ML_SQL_CONNECTION_STRING"),
            server=os.getenv("ML_SQL_SERVER"),
            database=os.getenv("ML_SQL_DATABASE"),
            driver=os.getenv("ML_SQL_DRIVER", "ODBC Driver 18 for SQL Server"),
            connection_timeout_seconds=int(os.getenv("ML_SQL_CONNECTION_TIMEOUT", "120")),
        ),
        function_shared_secret=os.getenv("ML_FUNCTION_SHARED_SECRET"),
        function_route=os.getenv("ML_FUNCTION_ROUTE", "/api/social-media/predict"),
        social_media_latest_blob=os.getenv(
            "ML_SOCIAL_MEDIA_LATEST_BLOB",
            "models/social-media/latest.json",
        ),
        training_views={
            "supporters": os.getenv("ML_VIEW_SUPPORTERS", "ml.SupportersTrainingView"),
            "donations": os.getenv("ML_VIEW_DONATIONS", "ml.DonationsTrainingView"),
            "residents": os.getenv("ML_VIEW_RESIDENTS", "ml.ResidentsTrainingView"),
            "process_recordings": os.getenv(
                "ML_VIEW_PROCESS_RECORDINGS", "ml.ProcessRecordingsTrainingView"
            ),
            "home_visitations": os.getenv(
                "ML_VIEW_HOME_VISITATIONS", "ml.HomeVisitationsTrainingView"
            ),
            "education_records": os.getenv(
                "ML_VIEW_EDUCATION_RECORDS", "ml.EducationRecordsTrainingView"
            ),
            "health_records": os.getenv(
                "ML_VIEW_HEALTH_RECORDS", "ml.HealthWellbeingRecordsTrainingView"
            ),
            "incident_reports": os.getenv(
                "ML_VIEW_INCIDENT_REPORTS", "ml.IncidentReportsTrainingView"
            ),
            "intervention_plans": os.getenv(
                "ML_VIEW_INTERVENTION_PLANS", "ml.InterventionPlansTrainingView"
            ),
            "social_media_posts": os.getenv(
                "ML_VIEW_SOCIAL_MEDIA_POSTS", "ml.SocialMediaPostsTrainingView"
            ),
        },
    )
