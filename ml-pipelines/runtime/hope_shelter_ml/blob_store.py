from __future__ import annotations

import json
import json
from pathlib import Path
from typing import Any

from azure.identity import DefaultAzureCredential
from azure.core.exceptions import ResourceExistsError
from azure.storage.blob import BlobServiceClient

from .common import ModelBundle, from_joblib_bytes, to_joblib_bytes, to_json_bytes
from .settings import BlobStorageSettings


class BlobArtifactStore:
    def __init__(self, settings: BlobStorageSettings) -> None:
        if settings.connection_string:
            self._client = BlobServiceClient.from_connection_string(settings.connection_string)
        elif settings.account_url:
            self._client = BlobServiceClient(
                account_url=settings.account_url,
                credential=DefaultAzureCredential(),
            )
        else:
            raise ValueError(
                "Configure ML_STORAGE_CONNECTION_STRING or ML_STORAGE_ACCOUNT_URL before using blob publishing."
            )

        self.container_name = settings.container_name
        self._container = self._client.get_container_client(self.container_name)

    def ensure_container(self) -> None:
        try:
            self._container.create_container()
        except ResourceExistsError:
            pass

    def upload_bytes(self, blob_name: str, payload: bytes, *, overwrite: bool = True) -> None:
        self.ensure_container()
        self._container.upload_blob(name=blob_name, data=payload, overwrite=overwrite)

    def upload_json(self, blob_name: str, payload: Any, *, overwrite: bool = True) -> None:
        self.upload_bytes(blob_name, to_json_bytes(payload), overwrite=overwrite)

    def download_bytes(self, blob_name: str) -> bytes:
        return self._container.download_blob(blob_name).readall()

    def download_json(self, blob_name: str) -> Any:
        return json.loads(self.download_bytes(blob_name).decode("utf-8"))

    def download_joblib(self, blob_name: str) -> Any:
        return from_joblib_bytes(self.download_bytes(blob_name))

    def publish_bundle(self, bundle: ModelBundle) -> dict[str, Any]:
        prefix = f"models/{bundle.model_name}/{bundle.model_version}"

        for blob_name, artifact in bundle.joblib_artifacts.items():
            self.upload_bytes(f"{prefix}/{blob_name}", to_joblib_bytes(artifact))

        for blob_name, artifact in bundle.json_artifacts.items():
            self.upload_json(f"{prefix}/{blob_name}", artifact)

        manifest = bundle.as_manifest(self.container_name, prefix)
        self.upload_json(f"models/{bundle.model_name}/latest.json", manifest)
        return manifest

def publish_bundle_locally(bundle: ModelBundle, output_dir: Path) -> Path:
    target_dir = output_dir / bundle.model_name / bundle.model_version
    target_dir.mkdir(parents=True, exist_ok=True)

    for blob_name, artifact in bundle.joblib_artifacts.items():
        (target_dir / blob_name).write_bytes(to_joblib_bytes(artifact))

    for blob_name, artifact in bundle.json_artifacts.items():
        (target_dir / blob_name).write_bytes(to_json_bytes(artifact))

    (target_dir / "latest.json").write_bytes(
        to_json_bytes(bundle.as_manifest("local", str(target_dir)))
    )
    return target_dir
