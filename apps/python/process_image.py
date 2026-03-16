from __future__ import annotations

import argparse
from pathlib import Path

from face_privacy import FaceBox, SUPPORTED_MODES, apply_edit, parse_face_box


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Hide a visible face by blurring or pixelating it."
    )
    parser.add_argument("--input", required=True, help="Path to the input image.")
    parser.add_argument("--output", required=True, help="Path to the edited output image.")
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
        help="Manual face box as x,y,w,h. Repeat to hide multiple faces.",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    manual_boxes: list[FaceBox] | None = None
    if args.face_box:
        manual_boxes = [parse_face_box(value) for value in args.face_box]

    output = Path(args.output)
    faces = apply_edit(
        input_path=args.input,
        output_path=output,
        mode=args.mode,
        face_boxes=manual_boxes,
    )
    print(f"Saved edited image to {output.resolve()}")
    print(f"Hidden {len(faces)} face(s) using mode '{args.mode}'.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
