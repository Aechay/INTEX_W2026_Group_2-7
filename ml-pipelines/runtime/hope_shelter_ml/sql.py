from __future__ import annotations

import json
import struct
from contextlib import contextmanager
from datetime import datetime
from typing import Iterator

import pandas as pd
import pyodbc
from azure.identity import DefaultAzureCredential

from .common import quote_multipart_identifier
from .settings import SqlSettings


SQL_ACCESS_TOKEN = 1256


class SqlDatabase:
    def __init__(self, settings: SqlSettings) -> None:
        self._settings = settings

    def _connection_string(self) -> str:
        if self._settings.connection_string:
            return self._settings.connection_string

        if not self._settings.server or not self._settings.database:
            raise ValueError(
                "Configure ML_SQL_CONNECTION_STRING or ML_SQL_SERVER/ML_SQL_DATABASE before using SQL mode."
            )

        return (
            f"Driver={{{self._settings.driver}}};"
            f"Server=tcp:{self._settings.server},1433;"
            f"Database={self._settings.database};"
            "Encrypt=yes;"
            "TrustServerCertificate=no;"
            f"Connection Timeout={self._settings.connection_timeout_seconds};"
        )

    def connect(self) -> pyodbc.Connection:
        connection_string = self._connection_string()

        if self._settings.connection_string:
            return pyodbc.connect(connection_string, autocommit=False)

        token = DefaultAzureCredential().get_token("https://database.windows.net//.default").token
        token_bytes = token.encode("utf-16-le")
        exptoken = struct.pack(f"<I{len(token_bytes)}s", len(token_bytes), token_bytes)
        return pyodbc.connect(
            connection_string,
            attrs_before={SQL_ACCESS_TOKEN: exptoken},
            autocommit=False,
        )

    @contextmanager
    def transaction(self) -> Iterator[pyodbc.Connection]:
        connection = self.connect()
        try:
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def read_view(self, view_name: str) -> pd.DataFrame:
        query = f"SELECT * FROM {quote_multipart_identifier(view_name)}"
        with self.connect() as connection:
            return pd.read_sql(query, connection)

    def append_model_run(
        self,
        connection: pyodbc.Connection,
        *,
        run_id: str,
        model_name: str,
        model_version: str,
        status: str,
        started_at: datetime,
        completed_at: datetime | None,
        metrics_json: dict[str, object],
        artifact_uri: str,
    ) -> None:
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO MlModelRuns
                (RunId, ModelName, ModelVersion, Status, StartedAt, CompletedAt, MetricsJson, ArtifactUri)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            run_id,
            model_name,
            model_version,
            status,
            started_at,
            completed_at,
            json.dumps(metrics_json),
            artifact_uri,
        )

    def append_donor_predictions(
        self,
        connection: pyodbc.Connection,
        *,
        run_id: str,
        model_version: str,
        scored_at: datetime,
        predictions: pd.DataFrame,
    ) -> None:
        rows = [
            (
                int(row.supporter_id),
                float(row.risk_score),
                str(row.risk_band),
                model_version,
                scored_at,
                run_id,
            )
            for row in predictions.itertuples(index=False)
        ]

        if not rows:
            return

        cursor = connection.cursor()
        cursor.fast_executemany = True
        cursor.executemany(
            """
            INSERT INTO DonorChurnPredictions
                (DonorId, RiskScore, RiskBand, ModelVersion, ScoredAt, RunId)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            rows,
        )

    def append_resident_predictions(
        self,
        connection: pyodbc.Connection,
        *,
        run_id: str,
        model_version: str,
        scored_at: datetime,
        predictions: pd.DataFrame,
    ) -> None:
        rows = [
            (
                int(row.resident_id),
                str(row.predicted_risk),
                int(row.predicted_risk_num),
                bool(row.flag_for_review),
                model_version,
                scored_at,
                run_id,
            )
            for row in predictions.itertuples(index=False)
        ]

        if not rows:
            return

        cursor = connection.cursor()
        cursor.fast_executemany = True
        cursor.executemany(
            """
            INSERT INTO ResidentRiskPredictions
                (ResidentId, PredictedRisk, PredictedRiskNum, FlagForReview, ModelVersion, ScoredAt, RunId)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            rows,
        )
