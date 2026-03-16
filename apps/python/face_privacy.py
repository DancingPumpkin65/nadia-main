from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEPS_DIR = ROOT / ".deps"
if DEPS_DIR.exists():
    sys.path.insert(0, str(DEPS_DIR))

import cv2
import numpy as np
from PIL import Image, ImageFilter

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
SUPPORTED_MODES = ("pixelate", "blur")


@dataclass(frozen=True)
class FaceBox:
    x: int
    y: int
    w: int
    h: int


def load_image(image_path: str | Path) -> Image.Image:
    return Image.open(image_path).convert("RGB")


def save_image(image: Image.Image, output_path: str | Path) -> None:
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output)


def detect_faces(image: Image.Image, expand_ratio: float = 0.22) -> list[FaceBox]:
    bgr = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    cascade_path = Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml"
    classifier = cv2.CascadeClassifier(str(cascade_path))
    raw_faces = classifier.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(48, 48),
    )

    width, height = image.size
    faces: list[FaceBox] = []
    for x, y, w, h in raw_faces:
        pad_x = int(w * expand_ratio)
        pad_y = int(h * expand_ratio)
        left = max(0, x - pad_x)
        top = max(0, y - pad_y)
        right = min(width, x + w + pad_x)
        bottom = min(height, y + h + pad_y)
        faces.append(FaceBox(left, top, right - left, bottom - top))

    faces.sort(key=lambda item: item.w * item.h, reverse=True)
    return faces


def parse_face_box(value: str) -> FaceBox:
    parts = [part.strip() for part in value.split(",")]
    if len(parts) != 4:
        raise ValueError("Face box must be x,y,w,h")
    x, y, w, h = (int(part) for part in parts)
    if w <= 0 or h <= 0:
        raise ValueError("Face box width and height must be positive")
    return FaceBox(x, y, w, h)


def pixelate_region(image: Image.Image, face: FaceBox, pixel_scale: int = 14) -> None:
    region = image.crop((face.x, face.y, face.x + face.w, face.y + face.h))
    downscaled = region.resize(
        (
            max(1, region.width // pixel_scale),
            max(1, region.height // pixel_scale),
        ),
        Image.Resampling.BILINEAR,
    )
    rebuilt = downscaled.resize(region.size, Image.Resampling.NEAREST)
    image.paste(rebuilt, (face.x, face.y))


def blur_region(image: Image.Image, face: FaceBox, radius: int = 18) -> None:
    region = image.crop((face.x, face.y, face.x + face.w, face.y + face.h))
    image.paste(region.filter(ImageFilter.GaussianBlur(radius=radius)), (face.x, face.y))


def apply_edit(
    input_path: str | Path,
    output_path: str | Path,
    mode: str,
    face_boxes: list[FaceBox] | None = None,
) -> list[FaceBox]:
    image = load_image(input_path)
    faces = face_boxes or detect_faces(image)

    if not faces:
        raise RuntimeError(
            "No face was detected. Try again with a clearer image or pass --face-box x,y,w,h."
        )

    if mode not in SUPPORTED_MODES:
        raise ValueError(f"Unsupported mode: {mode}")

    for face in faces:
        if mode == "blur":
            blur_region(image, face)
        elif mode == "pixelate":
            pixelate_region(image, face)

    save_image(image, output_path)
    return faces
