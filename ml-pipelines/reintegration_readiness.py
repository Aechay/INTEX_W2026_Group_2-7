from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd

from runtime.hope_shelter_ml.reintegration_readiness import train_reintegration_readiness_model


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train reintegration readiness model from CSV extracts."
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=Path("lighthouse_csv_v7"),
        help="Directory containing resident ML CSV files.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("artifacts/reintegration-readiness"),
        help="Output folder for model artifacts.",
    )
    return parser.parse_args()


def _read_csv(data_dir: Path, name: str) -> pd.DataFrame:
    path = data_dir / name
    if not path.exists():
        raise FileNotFoundError(f"Missing expected dataset file: {path}")
    return pd.read_csv(path)


def main() -> None:
    args = parse_args()
    data_dir = args.data_dir
    output_dir = args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    residents = _read_csv(data_dir, "residents.csv")
    process_recordings = _read_csv(data_dir, "process_recordings.csv")
    home_visitations = _read_csv(data_dir, "home_visitations.csv")
    education_records = _read_csv(data_dir, "education_records.csv")
    health_records = _read_csv(data_dir, "health_wellbeing_records.csv")
    incident_reports = _read_csv(data_dir, "incident_reports.csv")
    intervention_plans = _read_csv(data_dir, "intervention_plans.csv")

    trained = train_reintegration_readiness_model(
        residents,
        process_recordings,
        home_visitations,
        education_records,
        health_records,
        incident_reports,
        intervention_plans,
    )

    bundle = trained.bundle
    for artifact_name, model_obj in bundle.joblib_artifacts.items():
        joblib.dump(model_obj, output_dir / artifact_name)

    for artifact_name, payload in bundle.json_artifacts.items():
        with (output_dir / artifact_name).open("w", encoding="utf-8") as output_file:
            json.dump(payload, output_file, indent=2, sort_keys=True)

    trained.predictions.to_csv(output_dir / "batch_predictions.csv", index=False)
    print(f"Wrote reintegration readiness artifacts to {output_dir}")


if __name__ == "__main__":
    main()
