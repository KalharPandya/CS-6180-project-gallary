"""
convert-posters.py
------------------
Converts each team's poster.pdf -> poster.png and updates project.json.

Usage:
    pip install pymupdf
    python convert-posters.py
"""
import json
import pathlib

try:
    import fitz  # PyMuPDF
except ImportError:
    raise SystemExit("PyMuPDF not found. Run:  pip install pymupdf")

ROOT = pathlib.Path(__file__).parent / "teams"

converted = 0
skipped = 0

for pjson in sorted(ROOT.glob("*/project.json")):
    data = json.loads(pjson.read_text(encoding="utf-8"))
    poster = data.get("poster", "")

    if not poster.lower().endswith(".pdf"):
        continue

    pdf_path = pjson.parent / poster
    if not pdf_path.exists():
        print(f"  SKIP (pdf missing): {pjson.parent.name}/{poster}")
        skipped += 1
        continue

    png_rel  = poster[:-4] + ".png"          # e.g. "assets/poster.png"
    png_path = pjson.parent / png_rel

    doc  = fitz.open(str(pdf_path))
    page = doc[0]
    mat  = fitz.Matrix(2.0, 2.0)             # 2× = ~144 DPI, good quality
    pix  = page.get_pixmap(matrix=mat, alpha=False)
    pix.save(str(png_path))
    doc.close()

    data["poster"] = png_rel
    pjson.write_text(
        json.dumps(data, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )

    print(f"  OK  {pjson.parent.name}  ->  {png_path.name}")
    converted += 1

print(f"\nDone. {converted} converted, {skipped} skipped.")
