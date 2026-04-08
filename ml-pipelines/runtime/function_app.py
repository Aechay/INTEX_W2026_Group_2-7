from __future__ import annotations

import json
from datetime import UTC, datetime
from threading import Lock
from typing import Any

import azure.functions as func

from hope_shelter_ml.blob_store import BlobArtifactStore
from hope_shelter_ml.settings import load_runtime_settings
from hope_shelter_ml.social_media_inference import (
    SOCIAL_REQUEST_FIELDS,
    predict_social_media_value,
)

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

_cache_lock = Lock()
_cached_model: Any | None = None
_cached_manifest_version: str | None = None


def _ensure_authorized(request: func.HttpRequest) -> bool:
    settings = load_runtime_settings()
    if not settings.function_shared_secret:
        return True

    provided = request.headers.get("x-ml-shared-secret")
    return provided == settings.function_shared_secret


def _load_social_media_model() -> tuple[Any, str]:
    global _cached_manifest_version, _cached_model

    settings = load_runtime_settings()
    store = BlobArtifactStore(settings.blob)
    manifest = store.download_json(settings.social_media_latest_blob)
    manifest_version = str(manifest["modelVersion"])

    if _cached_model is not None and _cached_manifest_version == manifest_version:
        return _cached_model, manifest_version

    with _cache_lock:
        if _cached_model is not None and _cached_manifest_version == manifest_version:
            return _cached_model, manifest_version

        prefix = str(manifest["prefix"])
        model = store.download_joblib(f"{prefix}/model.joblib")
        _cached_model = model
        _cached_manifest_version = manifest_version
        return model, manifest_version


@app.route(route="social-media/predict", methods=["POST"])
def social_media_predict(request: func.HttpRequest) -> func.HttpResponse:
    if not _ensure_authorized(request):
        return func.HttpResponse("Unauthorized.", status_code=401)

    try:
        payload = request.get_json()
    except ValueError:
        return func.HttpResponse("Invalid JSON payload.", status_code=400)

    missing_fields = [field for field in SOCIAL_REQUEST_FIELDS if field not in payload]
    if missing_fields:
        return func.HttpResponse(
            f"Missing required fields: {', '.join(missing_fields)}",
            status_code=400,
        )

    try:
        model, model_version = _load_social_media_model()
        prediction = predict_social_media_value(model, payload)
    except Exception as exc:
        return func.HttpResponse(
            f"Unable to score the request: {exc}",
            status_code=500,
        )

    response = {
        "predictedDonationPhp": round(prediction, 2),
        "modelVersion": model_version,
        "scoredAt": datetime.now(UTC).isoformat(),
    }

    return func.HttpResponse(
        body=json.dumps(response),
        status_code=200,
        mimetype="application/json",
    )
