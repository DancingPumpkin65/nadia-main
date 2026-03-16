# Nadia.

## Python Face Privacy App

Local Python utilities for hiding faces in images using automatic detection (OpenCV Haar cascade) or manual face boxes.

## What this app does

- Processes a single image from the command line.
- Watches a folder and auto-processes new or updated images.
- Supports two masking modes: `pixelate` and `blur`.
- Supports manual face regions with `--face-box x,y,w,h`.

## Folder contents

- `face_privacy.py`: core image loading, face detection, masking, and save logic.
- `process_image.py`: one-shot CLI to process a single image.
- `watch_folder.py`: polling watcher that processes images in a folder continuously.
- `requirements.txt`: Python dependencies.
- `incoming/`: default input folder for watch mode.
- `processed/`: default output folder for watch mode.
- `.deps/` (optional): local dependency bundle; auto-added to `sys.path` when present.

## Requirements

- Python 3.10+ recommended.
- Pip.

## Setup

From this directory:

```bash
# create and activate a virtual environment
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS/Linux
source .venv/bin/activate

# install dependencies
pip install -r requirements.txt
```

## Usage

### 1) Process one image

```bash
python process_image.py --input incoming/photo.jpg --output processed/photo_pixelated.jpg --mode pixelate
```

Blur mode:

```bash
python process_image.py --input incoming/photo.jpg --output processed/photo_blurred.jpg --mode blur
```

Manual face box (repeat flag for multiple faces):

```bash
python process_image.py \
	--input incoming/photo.jpg \
	--output processed/photo_manual.jpg \
	--mode pixelate \
	--face-box 120,80,140,160 \
	--face-box 340,90,120,140
```

### 2) Watch a folder continuously

```bash
python watch_folder.py --input-dir incoming --output-dir processed --mode pixelate --interval 2.0
```

With manual boxes applied to every incoming image:

```bash
python watch_folder.py \
	--input-dir incoming \
	--output-dir processed \
	--mode blur \
	--face-box 120,80,140,160
```

## CLI options

### `process_image.py`

- `--input` (required): source image path.
- `--output` (required): destination image path.
- `--mode` (optional): `pixelate` (default) or `blur`.
- `--face-box` (optional, repeatable): `x,y,w,h` manual region.

### `watch_folder.py`

- `--input-dir` (optional): folder to monitor. Default: `incoming`.
- `--output-dir` (optional): folder for processed files. Default: `processed`.
- `--mode` (optional): `pixelate` (default) or `blur`.
- `--face-box` (optional, repeatable): `x,y,w,h` manual region(s) for each file.
- `--interval` (optional): polling interval in seconds. Default: `2.0`.

Output filenames in watch mode are generated as:

`<original_name>_<mode><extension>`

Example: `portrait.jpg` -> `portrait_pixelate.jpg`.

## Supported file types

`jpg`, `jpeg`, `png`, `webp`, `bmp`

## Notes and troubleshooting

- If no face is detected, the script raises an error and suggests using `--face-box`.
- In watch mode, files are skipped when output is newer than input.
- If activation fails in PowerShell, you may need:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Quick start

1. Put an image in `incoming/`.
2. Run:

```bash
python process_image.py --input incoming/your_image.jpg --output processed/your_image_pixelated.jpg
```

3. Open the file in `processed/`.
