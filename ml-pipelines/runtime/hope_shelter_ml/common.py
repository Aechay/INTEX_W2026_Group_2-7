from __future__ import annotations

import json
import re
import tempfile
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Mapping

import joblib


def utcnow() -> datetime:
    return datetime.now(UTC)


def timestamp_version(prefix: str) -> str:
    safe_prefix = re.sub(r"[^a-z0-9-]+", "-", prefix.lower()).strip("-") or "model"
    return f"{safe_prefix}-{utcnow().strftime('%Y%m%dT%H%M%SZ')}"


def sanitize_column_name(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    return normalized or "value"


def quote_multipart_identifier(identifier: str) -> str:
    return ".".join(f"[{part}]" for part in identifier.split("."))


def to_joblib_bytes(value: Any) -> bytes:
    with tempfile.NamedTemporaryFile(suffix=".joblib") as temp_file:
        joblib.dump(value, temp_file.name)
        return Path(temp_file.name).read_bytes()


def from_joblib_bytes(payload: bytes) -> Any:
    with tempfile.NamedTemporaryFile(suffix=".joblib") as temp_file:
        Path(temp_file.name).write_bytes(payload)
        return joblib.load(temp_file.name)


def to_json_bytes(value: Any) -> bytes:
    return json.dumps(value, indent=2, sort_keys=True).encode("utf-8")


@dataclass(frozen=True)
class ModelBundle:
    model_name: str
    model_version: str
    joblib_artifacts: Mapping[str, Any]
    json_artifacts: Mapping[str, Any]

    def as_manifest(self, container_name: str, prefix: str) -> dict[str, Any]:
        blobs = sorted(
            [*self.joblib_artifacts.keys(), *self.json_artifacts.keys()]
        )
        return {
            "modelName": self.model_name,
            "modelVersion": self.model_version,
            "container": container_name,
            "prefix": prefix,
            "artifacts": blobs,
            "updatedAt": utcnow().isoformat(),
        }
