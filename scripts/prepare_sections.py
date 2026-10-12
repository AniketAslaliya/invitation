"""Derivatives for the story, ceremonies, closing chapter and shared textures.

Outputs (public/media/):
  story/plate-*.webp          3.png with the polaroids lifted out (background gently filled)
  story/photos-right.webp     the two overlapping polaroids on the right (one layer)
  story/photo-left.webp       the polaroid on the bottom left
  story/full-*.webp           the untouched artwork (reduced-motion / fallback)
  events/<id>-*.webp          ceremony artwork, untouched, at responsive widths
  events/<id>-backdrop.webp   blurred light-field of each artwork for the ambient scene background
  closing/couple-*.webp       11.png at responsive widths
  ornaments/ganesha.webp      Ganesha line art lifted from 5.png
  textures/parchment.webp     seamless parchment tile
"""
import json

import cv2
import numpy as np

from asset_lib import (OUT, inpaint_background, load, rgba, save_debug, save_webp)

EVENTS = {"engagement": "5.png", "mandap": "6.png", "haldi": "7.png", "garba": "8.png", "wedding": "9.png"}


def polaroid_masks(img):
    h, w, _ = img.shape
    mn, mx = img.min(2), img.max(2)
    white = ((mn > 215) & (mx - mn < 30)).astype(np.uint8)
    white = cv2.morphologyEx(white, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(white, 8)
    masks = {}
    for i in range(1, n):
        if st[i, 4] < 150000:
            continue
        m = (lab == i).astype(np.uint8)
        # Treat the image border as frame so photos cut by the edge still close up.
        x, y, cw, ch, _ = st[i]
        if x == 0:
            m[y:y + ch, 0] = 1
        if x + cw >= w:
            m[y:y + ch, w - 1] = 1
        ff = m.copy()
        flood = np.zeros((h + 2, w + 2), np.uint8)
        # Flood from a point guaranteed outside the polaroids (centre of the parchment panel).
        cv2.floodFill(ff, flood, (1400, 2600), 1)
        filled = m | (1 - ff)
        filled = cv2.morphologyEx(filled, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
        name = "photos-right" if x > w / 2 else "photo-left"
        masks[name] = filled.astype(np.float32)
    return masks


def story():
    img = load("3.png")
    h, w, _ = img.shape
    manifest = {"w": w, "h": h, "layers": {}}
    masks = polaroid_masks(img)
    hole = np.zeros((h, w), bool)
    for name, m in masks.items():
        soft = cv2.GaussianBlur(m, (0, 0), 1.2)
        ys, xs = np.where(m > 0)
        pad = 60
        x0, y0 = max(xs.min() - pad, 0), max(ys.min() - pad, 0)
        x1, y1 = min(xs.max() + 1 + pad, w), min(ys.max() + 1 + pad, h)
        # Soft drop shadow baked under the photo so it reads as lifted paper while it drifts.
        a = soft[y0:y1, x0:x1]
        shadow = np.roll(np.roll(cv2.GaussianBlur(m[y0:y1, x0:x1], (0, 0), 22), 16, axis=0), 8, axis=1) * 0.5
        alpha = a + shadow * (1 - a)
        rgb = img[y0:y1, x0:x1] * (a / np.maximum(alpha, 1e-4))[..., None] + np.array([40, 18, 10], np.float32) * (1 - a / np.maximum(alpha, 1e-4))[..., None]
        out = rgba(rgb, alpha)
        save_debug(out, f"story-{name}.jpg", 600)
        save_webp(out, f"story/{name}.webp", min(x1 - x0, 1000), quality=86)
        manifest["layers"][name] = {"x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0)}
        hole |= cv2.dilate(m.astype(np.uint8), np.ones((25, 25), np.uint8)) > 0
    plate = inpaint_background(img, hole, scale=6, radius=18, blur=10)
    save_debug(plate, "story-plate.jpg")
    for width in (720, 1200, 1600):
        save_webp(plate, f"story/plate-{width}.webp", width, quality=82)
        save_webp(img, f"story/full-{width}.webp", width, quality=82)
    return manifest


def events():
    manifest = {}
    for key, src in EVENTS.items():
        img = load(src)
        for width in (640, 1080, 1600):
            save_webp(img, f"events/{key}-{width}.webp", width, quality=84)
        small = cv2.resize(img, (360, 360), interpolation=cv2.INTER_AREA)
        glow = cv2.GaussianBlur(small, (0, 0), 28)
        hsv = cv2.cvtColor(np.clip(glow, 0, 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
        hsv[..., 1] = np.clip(hsv[..., 1] * 1.25, 0, 255)
        hsv[..., 2] = hsv[..., 2] * 0.78
        glow = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)
        save_webp(glow, f"events/{key}-backdrop.webp", 360, quality=70)
        manifest[key] = {"w": img.shape[1], "h": img.shape[0]}
    return manifest


def closing():
    img = load("11.png")
    for width in (720, 1200, 1600):
        save_webp(img, f"closing/couple-{width}.webp", width, quality=84)
    return {"w": img.shape[1], "h": img.shape[0]}


def ganesha():
    img = load("5.png")
    # Line-art Ganesha at the top of the engagement card, on plain parchment.
    x0, y0, x1, y1 = 1500, 440, 1860, 900
    crop = img[y0:y1, x0:x1]
    luma = crop @ np.array([0.299, 0.587, 0.114], np.float32)
    paper = np.percentile(luma, 90)
    ink = np.percentile(luma, 1)
    a = np.clip((paper - 8 - luma) / (paper - 8 - ink), 0, 1) ** 0.85
    ys, xs = np.where(a > 0.05)
    a2 = a[ys.min() - 6:ys.max() + 7, xs.min() - 6:xs.max() + 7]
    # Recolour as antique gold so it sits on maroon and parchment alike; alpha carries the drawing.
    gold = np.zeros(a2.shape + (3,), np.float32) + np.array([176, 128, 58], np.float32)
    out = rgba(gold, a2)
    save_debug(out, "ganesha.jpg", 400)
    save_webp(out, "ornaments/ganesha.webp", None, quality=90)
    return {"w": out.shape[1], "h": out.shape[0]}


def parchment():
    """Seamless parchment: periodic filtered noise (FFT) so the tile repeats without seams."""
    n = 768
    rng = np.random.default_rng(7)
    fy = np.fft.fftfreq(n)[:, None]
    fx = np.fft.fftfreq(n)[None, :]
    f = np.sqrt(fx ** 2 + fy ** 2) + 1e-6

    def field(power, seed):
        r = np.random.default_rng(seed)
        spec = (r.normal(size=(n, n)) + 1j * r.normal(size=(n, n))) / f ** power
        spec[0, 0] = 0
        out = np.real(np.fft.ifft2(spec))
        return (out - out.mean()) / out.std()

    blotch = field(1.6, 1)
    grain = field(0.6, 2)
    # Long fibres: anisotropic noise stretched horizontally.
    fib = np.real(np.fft.ifft2((rng.normal(size=(n, n)) + 1j * rng.normal(size=(n, n))) *
                               np.exp(-(fx * 60) ** 2 - (fy * 10) ** 2)))
    fib = (fib - fib.mean()) / fib.std()
    base = np.array([244, 226, 189], np.float32)
    tone = blotch[..., None] * np.array([6.5, 7.5, 9.0]) + grain[..., None] * 2.4 + fib[..., None] * 0.7
    out = np.clip(base + tone, 0, 255)
    save_debug(out, "parchment.jpg", 500)
    save_webp(out, "textures/parchment.webp", None, quality=80)


def main():
    import sys
    if "--parchment" in sys.argv:
        parchment()
        return
    manifest = {"story": story(), "events": events(), "closing": closing(), "ganesha": ganesha()}
    parchment()
    (OUT / "sections.json").write_text(json.dumps(manifest, indent=2))
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
