from __future__ import annotations

import argparse
import time
from pathlib import Path

from face_privacy import FaceBox, SUPPORTED_EXTENSIONS, SUPPORTED_MODES, apply_edit, parse_face_box


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Watch a folder and automatically hide faces in newly added or updated images."
    )
    parser.add_argument("--input-dir", default="incoming", help="Folder to watch for images.")
    parser.add_argument("--output-dir", default="processed", help="Folder where edited images are written.")
    parser.add_argument(
        "--mode",
        default="pixelate",
        choices=SUPPORTED_MODES,
        help="How to hide the detected face.",
    )
    parser.add_argument(
        "--face-box",
        action="append",
        default=[],
        help="Manual face box as x,y,w,h. Repeat to hide multiple faces in each watched image.",
    )
    parser.add_argument("--interval", type=float, default=2.0, help="Polling interval in seconds.")
    return parser


def output_path_for(input_file: Path, output_dir: Path, mode: str) -> Path:
    return output_dir / f"{input_file.stem}_{mode}{input_file.suffix}"


def main() -> int:
    args = build_parser().parse_args()
    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    manual_boxes: list[FaceBox] | None = None
    if args.face_box:
        manual_boxes = [parse_face_box(value) for value in args.face_box]

    input_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Watching {input_dir.resolve()} for images...")
    print(f"Processed files will be written to {output_dir.resolve()}")

    while True:
        for input_file in sorted(input_dir.iterdir()):
            if input_file.suffix.lower() not in SUPPORTED_EXTENSIONS or not input_file.is_file():
                continue

            output_file = output_path_for(input_file, output_dir, args.mode)
            if output_file.exists() and output_file.stat().st_mtime >= input_file.stat().st_mtime:
                continue

            try:
                faces = apply_edit(
                    input_path=input_file,
                    output_path=output_file,
                    mode=args.mode,
                    face_boxes=manual_boxes,
                )
                print(f"Processed {input_file.name} -> {output_file.name} ({len(faces)} face(s))")
            except Exception as exc:
                print(f"Skipped {input_file.name}: {exc}")

        time.sleep(args.interval)


if __name__ == "__main__":
    raise SystemExit(main())
