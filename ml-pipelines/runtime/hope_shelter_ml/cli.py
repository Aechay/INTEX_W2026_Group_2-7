from __future__ import annotations

import argparse
import json
from pathlib import Path

from .blob_store import BlobArtifactStore, publish_bundle_locally
from .donor_churn import train_donor_churn_model
from .resident_risk import train_resident_risk_model
from .settings import load_runtime_settings
from .social_media import predict_social_media_value, train_social_media_model
from .training import load_training_frames, persist_batch_predictions, publish_training_run, run_training


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Hope Shelter ML runtime entrypoints.")
    parser.add_argument("--output-dir", type=Path, default=None)
    parser.add_argument(
        "--publish-to-blob",
        action="store_true",
        help="Publish model bundles to blob storage using the ML_STORAGE_* settings.",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("train-all")
    subparsers.add_parser("train-donor-churn")
    subparsers.add_parser("score-donor-churn-batch")
    subparsers.add_parser("train-resident-risk")
    subparsers.add_parser("score-resident-risk-batch")
    subparsers.add_parser("train-social-media")

    predict_parser = subparsers.add_parser("predict-social-media")
    predict_parser.add_argument("--payload", required=True, help="Path to a JSON request payload.")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    settings = load_runtime_settings()

    if args.command == "train-all":
        result = run_training(settings)
        if args.publish_to_blob:
            publish_training_run(result, settings=settings)
            persist_batch_predictions(result, settings=settings)
        elif args.output_dir is not None:
            publish_training_run(result, settings=settings, output_dir=args.output_dir)
        return

    frames = load_training_frames(settings)

    if args.command == "train-donor-churn":
        trained = train_donor_churn_model(frames["supporters"], frames["donations"])
        if args.publish_to_blob:
            BlobArtifactStore(settings.blob).publish_bundle(trained.bundle)
        elif args.output_dir is not None:
            publish_bundle_locally(trained.bundle, args.output_dir)
        return

    if args.command == "score-donor-churn-batch":
        trained = train_donor_churn_model(frames["supporters"], frames["donations"])
        print(trained.predictions.to_csv(index=False))
        return

    if args.command == "train-resident-risk":
        trained = train_resident_risk_model(
            frames["residents"],
            frames["process_recordings"],
            frames["home_visitations"],
            frames["education_records"],
            frames["health_records"],
            frames["incident_reports"],
            frames["intervention_plans"],
        )
        if args.publish_to_blob:
            BlobArtifactStore(settings.blob).publish_bundle(trained.bundle)
        elif args.output_dir is not None:
            publish_bundle_locally(trained.bundle, args.output_dir)
        return

    if args.command == "score-resident-risk-batch":
        trained = train_resident_risk_model(
            frames["residents"],
            frames["process_recordings"],
            frames["home_visitations"],
            frames["education_records"],
            frames["health_records"],
            frames["incident_reports"],
            frames["intervention_plans"],
        )
        print(trained.predictions.to_csv(index=False))
        return

    if args.command == "train-social-media":
        trained = train_social_media_model(frames["social_media_posts"])
        if args.publish_to_blob:
            BlobArtifactStore(settings.blob).publish_bundle(trained.bundle)
        elif args.output_dir is not None:
            publish_bundle_locally(trained.bundle, args.output_dir)
        return

    if args.command == "predict-social-media":
        with Path(args.payload).open("r", encoding="utf-8") as payload_file:
            payload = json.load(payload_file)

        trained = train_social_media_model(frames["social_media_posts"])
        model = trained.bundle.joblib_artifacts["model.joblib"]
        prediction = predict_social_media_value(model, payload)
        print(json.dumps({"predictedDonationPhp": round(prediction, 2)}, indent=2))


if __name__ == "__main__":
    main()
