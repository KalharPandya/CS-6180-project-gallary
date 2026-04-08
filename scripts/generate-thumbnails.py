"""
generate-thumbnails.py
----------------------
Generates assets/thumbnail.png for each team from assets/poster.pdf
using PyMuPDF at 1x (72 DPI) — smaller file, fast to load as card thumbnail.

Usage:
    pip install pymupdf
    python scripts/generate-thumbnails.py
"""
import json
import pathlib

try:
    import fitz  # PyMuPDF
except ImportError:
    raise SystemExit("PyMuPDF not found. Run:  pip install pymupdf")

ROOT = pathlib.Path(__file__).parent.parent / "teams"

converted = 0
skipped   = 0

for pjson in sorted(ROOT.glob("*/project.json")):
    data     = json.loads(pjson.read_text(encoding="utf-8"))
    poster   = data.get("poster", "")

    # Require a real PDF on disk
    pdf_path = pjson.parent / "assets" / "poster.pdf"
    if not pdf_path.exists():
        print(f"  SKIP (no poster.pdf): {pjson.parent.name}")
        skipped += 1
        continue

    thumb_path = pjson.parent / "assets" / "thumbnail.png"

    doc  = fitz.open(str(pdf_path))
    page = doc[0]
    mat  = fitz.Matrix(1.0, 1.0)          # 1× = 72 DPI — compact thumbnail
    pix  = page.get_pixmap(matrix=mat, alpha=False)
    pix.save(str(thumb_path))
    doc.close()

    # Update project.json thumbnail field
    data["thumbnail"] = "assets/thumbnail.png"
    pjson.write_text(
        json.dumps(data, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )

    print(f"  OK  {pjson.parent.name}  ->  thumbnail.png  ({thumb_path.stat().st_size // 1024} KB)")
    converted += 1

print(f"\nDone. {converted} generated, {skipped} skipped.")
