from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Callable
import io

import fitz
import numpy as np
from PIL import Image

import ocr_preprocess as ocr


ProgressCallback = Callable[[dict], None]


@dataclass(slots=True)
class ProcessingOptions:
    dpi: int = ocr.RASTER_DPI
    output_format: str = "png"
    generate_zip: bool = False


@contextmanager
def progress_context(callback: ProgressCallback | None):
    ocr.set_progress_callback(callback)
    try:
        yield
    finally:
        ocr.set_progress_callback(None)


def output_extension(output_format: str) -> str:
    return "jpg" if output_format.lower() == "jpg" else "png"


def rasterize_pdf_page(page: fitz.Page, dpi: int) -> np.ndarray:
    pixmap = page.get_pixmap(dpi=dpi, colorspace=fitz.csRGB, alpha=False)
    return np.array(Image.open(io.BytesIO(pixmap.tobytes("png"))).convert("RGB"))


def load_image_file(image_path: Path) -> np.ndarray:
    with Image.open(image_path) as image:
        return np.array(image.convert("RGB"))


def save_image(image: np.ndarray, output_path: Path, output_format: str) -> int:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_format = output_format.lower()
    pil_image = Image.fromarray(image)

    if output_format == "jpg":
        pil_image = pil_image.convert("RGB")
        pil_image.save(
            output_path,
            format="JPEG",
            quality=92,
            optimize=True,
            subsampling=0,
        )
    else:
        pil_image.save(
            output_path,
            format="PNG",
            optimize=True,
            compress_level=3,
        )

    return output_path.stat().st_size


def preprocess_page_image(
    rgb: np.ndarray,
    page_number: int,
    page_count: int,
    filename: str,
    options: ProcessingOptions,
    progress_callback: ProgressCallback | None = None,
) -> tuple[np.ndarray, dict]:
    with progress_context(progress_callback):
        output_image, ocr_meta = ocr.prepare_document_image(
            rgb,
            page_number,
            page_count,
            filename,
        )
    return output_image, ocr_meta
