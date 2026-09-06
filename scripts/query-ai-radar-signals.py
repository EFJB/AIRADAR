#!/usr/bin/env python3
"""Query AI Radar daily signal snapshots as JSON."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


ORDER_CHOICES = (
    "original",
    "newest",
    "oldest",
    "title-asc",
    "title-desc",
    "status",
    "id",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Read an AI Radar daily JSON snapshot and return N signals as JSON."
    )
    parser.add_argument(
        "--date",
        help="Snapshot date in YYYY-MM-DD format. Defaults to the latest available day.",
    )
    parser.add_argument(
        "-n",
        "--count",
        type=int,
        default=5,
        help="Number of signals to return. Defaults to 5.",
    )
    parser.add_argument(
        "--order",
        choices=ORDER_CHOICES,
        default="original",
        help="Signal order. Defaults to original snapshot order.",
    )
    parser.add_argument(
        "--daily-dir",
        default="fixtures/daily",
        help="Directory containing YYYY-MM-DD-ai-news.json snapshots.",
    )
    return parser.parse_args()


def fail(message: str) -> None:
    print(json.dumps({"error": message}, ensure_ascii=False), file=sys.stderr)
    raise SystemExit(1)


def validate_date(value: str) -> str:
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        fail(f"Invalid date '{value}'. Use YYYY-MM-DD.")
    return value


def latest_snapshot_date(daily_dir: Path) -> str:
    snapshots = sorted(daily_dir.glob("*-ai-news.json"))
    dates: list[str] = []
    for snapshot in snapshots:
        date_part = snapshot.name.removesuffix("-ai-news.json")
        try:
            datetime.strptime(date_part, "%Y-%m-%d")
        except ValueError:
            continue
        dates.append(date_part)
    if not dates:
        fail(f"No daily snapshots found in {daily_dir}.")
    return dates[-1]


def load_snapshot(path: Path) -> dict[str, Any]:
    if not path.exists():
        fail(f"Snapshot not found: {path}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        fail(f"Invalid JSON in {path}: {error}")
    if not isinstance(data, dict):
        fail(f"Snapshot root must be a JSON object: {path}")
    signals = data.get("signals")
    if not isinstance(signals, list):
        fail(f"Snapshot must contain a 'signals' array: {path}")
    return data


def source_date(signal: dict[str, Any]) -> str:
    source = signal.get("source")
    if not isinstance(source, dict):
        return ""
    published_at = source.get("publishedAt")
    return published_at if isinstance(published_at, str) else ""


def text_field(signal: dict[str, Any], field: str) -> str:
    value = signal.get(field)
    return value.lower() if isinstance(value, str) else ""


def ordered_signals(signals: list[Any], order: str) -> list[dict[str, Any]]:
    valid_signals = [signal for signal in signals if isinstance(signal, dict)]
    if order == "original":
        return valid_signals
    if order == "newest":
        return sorted(valid_signals, key=source_date, reverse=True)
    if order == "oldest":
        return sorted(valid_signals, key=source_date)
    if order == "title-asc":
        return sorted(valid_signals, key=lambda signal: text_field(signal, "title"))
    if order == "title-desc":
        return sorted(valid_signals, key=lambda signal: text_field(signal, "title"), reverse=True)
    if order == "status":
        return sorted(valid_signals, key=lambda signal: text_field(signal, "status"))
    if order == "id":
        return sorted(valid_signals, key=lambda signal: text_field(signal, "id"))
    fail(f"Unsupported order: {order}")


def main() -> None:
    args = parse_args()
    if args.count < 0:
        fail("--count must be zero or greater.")

    daily_dir = Path(args.daily_dir)
    selected_date = validate_date(args.date) if args.date else latest_snapshot_date(daily_dir)
    snapshot_path = daily_dir / f"{selected_date}-ai-news.json"
    snapshot = load_snapshot(snapshot_path)

    signals = ordered_signals(snapshot["signals"], args.order)
    selected_signals = signals[: args.count]
    result = {
        "date": selected_date,
        "snapshot": str(snapshot_path),
        "order": args.order,
        "requestedCount": args.count,
        "returnedCount": len(selected_signals),
        "availableCount": len(signals),
        "signals": selected_signals,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
