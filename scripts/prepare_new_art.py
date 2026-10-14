"""Full-page (9:16) artwork from groom-new-image/ → public/media.

Each ceremony, the story and the closing photo is a complete, framed portrait page, so they are
exported whole (never cropped) at responsive widths. Originals are only read, never modified.

Outputs:
  events/<id>-full-{720,1080,1440}.webp
  story/page-{720,941}.webp            (source is 941 px wide — never upscaled)
  closing/couple-{720,1200,1600}.webp
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "groom-new-image"
OUT = ROOT / "public" / "media"

PAGES = {
    "events/engagement-full": ("1 (5).png", (720, 1080, 1440)),
    "events/mandap-full": ("2 (3).png", (720, 1080, 1440)),
    "events/haldi-full": ("3 (2).png", (720, 1080, 1440)),
    "events/garba-full": ("4 (1).png", (720, 1080, 1440)),
    "events/wedding-full": ("5 (2).png", (720, 1080, 1440)),
    "story/page": ("file_000000007ccc824690b0191bcf4fb9c3.png", (720, 1200)),
    "closing/couple": ("Groom.png", (720, 1200, 1600)),
}


def main():
    manifest = {}
    for stem, (name, widths) in PAGES.items():
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
    (OUT / "pages.json").write_text(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
