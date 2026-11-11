"""Full-page (9:16) artwork → public/media.

Each ceremony, the story, the venue and the closing photo is a complete, framed portrait page, so they
are exported whole (never cropped) at responsive widths. Originals are only read, never modified.

Usage:
  python scripts/prepare_new_art.py [SOURCE_DIR]      (default: ./groom-new-image)

Only pages whose source file exists in SOURCE_DIR are (re)built; every other entry already in
pages.json is kept as it is.

Outputs:
  events/<id>-full-{720,1080,1440}.webp
  venue/page-{720,1080,1440}.webp
  story/page-{720,941}.webp            (source is 941 px wide — never upscaled)
  closing/couple-{720,1200,1600}.webp
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "groom-new-image"
OUT = ROOT / "public" / "media"

PAGES = {
    "events/engagement-full": ("1.png", (720, 1080, 1440)),
    "events/mandap-full": ("2.png", (720, 1080, 1440)),
    "events/haldi-full": ("3.png", (720, 1080, 1440)),
    "events/garba-full": ("4.png", (720, 1080, 1440)),
    "events/wedding-full": ("5.png", (720, 1080, 1440)),
    "venue/page": ("6.png", (720, 1080, 1440)),
    "story/page": ("file_000000007ccc824690b0191bcf4fb9c3.png", (720, 1200)),
    "closing/couple": ("Groom.png", (720, 1200, 1600)),
}


def main():
    manifest_path = OUT / "pages.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    for stem, (name, widths) in PAGES.items():
        if not (SRC / name).exists():
            continue
        im = Image.open(SRC / name).convert("RGB")
        written = []
        for w in widths:
            w = min(w, im.width)  # never upscale
            if w in written:
                continue
            h = round(im.height * w / im.width)
            path = OUT / f"{stem}-{w}.webp"
            path.parent.mkdir(parents=True, exist_ok=True)
            im.resize((w, h), Image.LANCZOS).save(path, "WEBP", quality=84, method=6)
            written.append(w)
        manifest[stem] = {"w": im.width, "h": im.height, "widths": written}
        print(stem, im.size, written)
    manifest_path.write_text(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
