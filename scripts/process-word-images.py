"""Rembg generated word images into public/words.

Usage:
  python scripts/process-word-images.py 8
  python scripts/process-word-images.py 8 9 10
"""
from __future__ import annotations

import io
import sys
from pathlib import Path

from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parents[1]
SRC = Path("C:/Users/Admin/.cursor/projects/d-Auto-tool-LearnJapan/assets")
DST = ROOT / "public" / "words"


def orders_for_lesson(n: int) -> list[int]:
    import json

    data = json.loads((ROOT / "src" / "data" / "minna-vocabulary.json").read_text(encoding="utf-8"))
    return [int(w["order"]) for w in data if int(w["lesson"]) == n]


def process_lesson(n: int, session) -> tuple[int, list[str]]:
    DST.mkdir(exist_ok=True)
    ok, missing = 0, []
    for i in orders_for_lesson(n):
        name = f"l{n:02d}-{i:03d}.png"
        src = SRC / name
        if not src.exists():
            missing.append(name)
            print("MISSING", name, flush=True)
            continue
        out = remove(src.read_bytes(), session=session, post_process_mask=True)
        img = Image.open(io.BytesIO(out)).convert("RGBA")
        img.thumbnail((512, 512), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
        canvas.paste(img, ((512 - img.width) // 2, (512 - img.height) // 2), img)
        canvas.save(DST / name, "PNG")
        ok += 1
        print(f"{ok:02d} {name} corner={canvas.getpixel((0, 0))}", flush=True)
    return ok, missing


def main() -> None:
    lessons = [int(x) for x in sys.argv[1:]]
    if not lessons:
        raise SystemExit("usage: python scripts/process-word-images.py 8 [9 ...]")
    print("loading isnet-general-use...", flush=True)
    session = new_session("isnet-general-use")
    for n in lessons:
        print(f"=== lesson {n} ===", flush=True)
        ok, missing = process_lesson(n, session)
        print(f"DONE L{n:02d} {ok} missing {missing}", flush=True)


if __name__ == "__main__":
    main()
