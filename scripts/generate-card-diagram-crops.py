from __future__ import annotations

import json
from pathlib import Path
from PIL import Image, ImageChops, ImageOps

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "assets" / "data" / "drive-catalog.json"
CANVAS = (760, 420)
PAGE_ASPECT = 923 / 1306


def local_path(value: str | None) -> Path | None:
    if not value or value.startswith(("http://", "https://")):
        return None
    return ROOT / value.replace("/", str(Path("/")).replace("/", "\\"))


def first_page(image: Image.Image, page_count: int) -> Image.Image:
    page_count = max(1, page_count)
    expected = round(image.width / PAGE_ASPECT)
    page_height = min(image.height, expected)
    if page_count > 1 and image.height // page_count > 900:
        page_height = min(page_height, image.height // page_count)
    return image.crop((0, 0, image.width, page_height))


def content_crop(page: Image.Image) -> Image.Image:
    width, height = page.size
    # Kubota first pages keep the drawing between the source header and parts table.
    region = page.crop((round(width * 0.045), round(height * 0.11), round(width * 0.955), round(height * 0.52))).convert("RGB")
    gray = ImageOps.grayscale(region)
    ink = gray.point(lambda value: 255 if value < 238 else 0)
    bbox = ink.getbbox()
    if bbox:
        left, top, right, bottom = bbox
        pad_x = max(14, round(region.width * 0.025))
        pad_y = max(12, round(region.height * 0.025))
        region = region.crop((max(0, left - pad_x), max(0, top - pad_y), min(region.width, right + pad_x), min(region.height, bottom + pad_y)))
    return region


def render_card(source: Path, target: Path, page_count: int) -> None:
    with Image.open(source) as image:
        crop = content_crop(first_page(image.convert("RGB"), page_count))
        fitted = ImageOps.contain(crop, (CANVAS[0] - 36, CANVAS[1] - 28), Image.Resampling.LANCZOS)
        canvas = Image.new("RGB", CANVAS, "white")
        canvas.paste(fitted, ((CANVAS[0] - fitted.width) // 2, (CANVAS[1] - fitted.height) // 2))
        target.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(target, "WEBP", quality=86, method=6)


def main() -> None:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    completed = 0
    missing: list[str] = []
    for product in catalog["products"]:
        source = local_path(product.get("fullImage"))
        target = local_path(product.get("previewImage"))
        if not source or not target or not source.exists():
            missing.append(str(product.get("id") or product.get("diagramCode")))
            continue
        render_card(source, target, int(product.get("pageCount") or 1))
        completed += 1
    if missing:
        raise SystemExit(f"Missing full-image source for {len(missing)} products: {missing[:10]}")
    print(f"Generated {completed} diagram-only card previews at {CANVAS[0]}x{CANVAS[1]}")


if __name__ == "__main__":
    main()
