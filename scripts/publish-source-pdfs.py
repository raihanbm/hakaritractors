from __future__ import annotations

import argparse
import json
import re
import shutil
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "assets" / "data" / "drive-catalog.json"
SHEET_INDEX = ROOT / "assets" / "data" / "sheets-index.json"
DEFAULT_SOURCE = Path(r"D:\GITHUB\internalhikaritractors\data\catalog-runtime\assets")


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def diagram_codes(filename: str) -> set[str]:
    return set(re.findall(r"(?<![A-Z0-9])([A-Z]?\d{5,6})(?!\d)", filename.upper()))


def source_model(pdf: Path, source_root: Path) -> str:
    relative = pdf.relative_to(source_root)
    if relative.parts[0].lower() == "pdfs":
        return slug(relative.parts[1])
    if relative.parts[0].lower() == "documents":
        return slug(relative.parts[1])
    raise ValueError(f"Unsupported PDF source path: {relative}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Publish every source catalog PDF to the static Storefront.")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    args = parser.parse_args()
    source_root = args.source.resolve()
    if not source_root.is_dir():
        raise SystemExit(f"Internal runtime asset directory not found: {source_root}")

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    sheet_index = json.loads(SHEET_INDEX.read_text(encoding="utf-8"))
    sources: dict[tuple[str, str], list[Path]] = defaultdict(list)
    for pdf in source_root.rglob("*.pdf"):
        model = source_model(pdf, source_root)
        for code in diagram_codes(pdf.stem):
            sources[(model, code)].append(pdf)

    missing: list[str] = []
    ambiguous: list[str] = []
    copied = 0
    for product in catalog["products"]:
        model = slug(str(product["model"]))
        code = str(product["diagramCode"]).upper()
        candidates = list(dict.fromkeys(sources.get((model, code), [])))
        if not candidates:
            missing.append(f"{product['model']} {code}")
            continue
        if len(candidates) > 1:
            ambiguous.append(f"{product['model']} {code}: {[path.name for path in candidates]}")
            continue

        source = candidates[0]
        target = ROOT / "assets" / "documents" / model / source.name
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists() or target.read_bytes() != source.read_bytes():
            shutil.copy2(source, target)
        if target.read_bytes()[:5] != b"%PDF-":
            raise SystemExit(f"Not a valid PDF: {source}")

        pdf_url = target.relative_to(ROOT).as_posix()
        product["pdfUrl"] = pdf_url
        sheet_meta = sheet_index.get(str(product["sheetId"]))
        if not sheet_meta:
            missing.append(f"sheet index {product['sheetId']}")
            continue
        sheet_path = ROOT / sheet_meta["path"]
        sheet = json.loads(sheet_path.read_text(encoding="utf-8"))
        sheet["pdf_url"] = pdf_url
        sheet_path.write_text(json.dumps(sheet, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        copied += 1

    if missing or ambiguous:
        raise SystemExit(f"PDF mapping failed: missing={len(missing)} {missing[:10]}, ambiguous={len(ambiguous)} {ambiguous[:5]}")

    CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Published {copied} source PDFs and mapped every Storefront assembly.")


if __name__ == "__main__":
    main()
