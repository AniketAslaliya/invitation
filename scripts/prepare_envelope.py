"""Sprites for the interactive envelope opening, cut from the original artwork.

All coordinates are in the full-resolution pixel space of Groom/1.png (2941 x 5225) so the
front end can position every sprite as a percentage of the closed-envelope plate.

Outputs (public/media/envelope/):
  flap.webp     the closed top flap (seal area repainted as plain paper so it can lift away)
  liner.webp    maroon envelope lining: shown under the lifted flap and on the flap's back face
  seal.webp     the P&J wax seal
  card.webp     the invitation card from 2.png, extended downward so it can slide out
"""
import json

import cv2
import numpy as np
from PIL import Image, ImageDraw

from asset_lib import OUT, load, rgba, save_debug, save_webp

# Closed envelope (1.png)
TL, TR, TIP = (762, 2436), (2238, 2436), (1500, 3086)
SEAL_C, SEAL_R = (1496, 2964), 222
# Open envelope (2.png)
CARD = (711, 1466, 2235, 2700)        # x0, y0, x1, y1 of the cleanly visible card
HINGE2 = (1474, 2249)                  # centre of the envelope's top edge in 2.png
ENV_W1, ENV_W2 = 2244 - 756, 2505 - 444


def poly_mask(shape, pts, feather=1.5):
    m = Image.new("L", (shape[1], shape[0]), 0)
    ImageDraw.Draw(m).polygon(pts, fill=255)
    a = np.asarray(m).astype(np.float32) / 255
    return cv2.GaussianBlur(a, (0, 0), feather) if feather else a


def circle_mask(shape, c, r, feather=2.0):
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]]
    d = np.sqrt((xx - c[0]) ** 2 + (yy - c[1]) ** 2)
    return np.clip((r - d) / feather + 0.5, 0, 1).astype(np.float32)


def paper_noise(h, w, seed=3):
    rng = np.random.default_rng(seed)
    n = rng.normal(0, 1, (h // 4 + 1, w // 4 + 1)).astype(np.float32)
    n = cv2.resize(cv2.GaussianBlur(n, (0, 0), 2), (w, h), interpolation=cv2.INTER_CUBIC)
    fine = cv2.GaussianBlur(rng.normal(0, 1, (h, w)).astype(np.float32), (0, 0), 0.8)
    return n * 0.7 + fine * 0.3


def main():
    img = load("1.png")
    h, w, _ = img.shape
    manifest = {"plate": {"w": w, "h": h}}

    x0, y0 = TL[0] - 6, TL[1] - 6
    x1, y1 = TR[0] + 6, SEAL_C[1] + SEAL_R + 6

    # ---- flap: repaint the part of the seal that overlaps the flap with paper from just above it.
    flap_rgb = img.copy()
    seal = circle_mask(img.shape, SEAL_C, SEAL_R + 12, 6)
    hole = seal > 0.01
    # Low frequencies: smooth paper tone inpainted from the surrounding flap.
    from asset_lib import inpaint_background
    low = inpaint_background(img, hole, scale=4, radius=20, blur=4)
    # High frequencies: real paper grain borrowed from a plain patch of the envelope's lower pocket.
    patch = img[3170:3420, 1000:1480]
    grain = patch - cv2.GaussianBlur(patch, (0, 0), 6)
    gh, gw = grain.shape[:2]
    tile = np.concatenate([grain, grain[::-1]], axis=0)
    tile = np.concatenate([tile, tile[:, ::-1]], axis=1)
    reps = (int(np.ceil(h / tile.shape[0])), int(np.ceil(w / tile.shape[1])), 1)
    grain_full = np.tile(tile, reps)[:h, :w]
    paper = low + grain_full
    flap_rgb = flap_rgb * (1 - seal[..., None]) + paper * seal[..., None]
    tri = poly_mask(img.shape, [TL, TR, TIP], 1.2)
    # Soft shadow along the folded edges so the lifted flap reads as paper with thickness.
    edge = cv2.GaussianBlur(tri, (0, 0), 10)
    flap_rgb *= (0.86 + 0.14 * np.clip((edge - 0.5) * 2.2, 0, 1))[..., None]
    flap = rgba(flap_rgb[y0:y1, x0:x1], tri[y0:y1, x0:x1])
    # Trim to the triangle's own box.
    fy1 = TIP[1] + 8 - y0
    flap = flap[:fy1]
    save_debug(flap, "env-flap.jpg")
    save_webp(flap, "envelope/flap.webp", 900, quality=86)
    manifest["flap"] = {"x": x0, "y": y0, "w": x1 - x0, "h": fy1}

    # ---- liner: deep maroon, darker at the fold, with a fine gold deckle line along the edges.
    lh, lw = fy1, x1 - x0
    yy, xx = np.mgrid[0:lh, 0:lw].astype(np.float32)
    t = yy / lh
    base = np.array([104, 14, 32], np.float32) * (0.62 + 0.38 * t[..., None])
    noise = paper_noise(lh, lw)[..., None]
    # Subtle damask-like lattice so the lining is not a flat fill.
    lattice = (np.sin(xx / 34.0) * np.sin(yy / 34.0)) ** 2
    liner_rgb = base * (1 + noise * 0.06) + lattice[..., None] * np.array([10, 3, 2], np.float32)
    ltri = poly_mask((lh, lw), [(TL[0] - x0, TL[1] - y0), (TR[0] - x0, TR[1] - y0), (TIP[0] - x0, TIP[1] - y0)], 1.2)
    inner = poly_mask((lh, lw), [(TL[0] - x0 + 46, TL[1] - y0 + 14), (TR[0] - x0 - 46, TR[1] - y0 + 14), (TIP[0] - x0, TIP[1] - y0 - 40)], 2)
    rim = np.clip(ltri - inner, 0, 1)[..., None]
    liner_rgb = liner_rgb * (1 - rim * 0.55) + np.array([214, 178, 120], np.float32) * rim * 0.55
    liner = rgba(liner_rgb, ltri)
    save_debug(liner, "env-liner.jpg")
    save_webp(liner, "envelope/liner.webp", 900, quality=84)

    # ---- seal
    sx0, sy0 = SEAL_C[0] - SEAL_R - 4, SEAL_C[1] - SEAL_R - 4
    sx1, sy1 = SEAL_C[0] + SEAL_R + 4, SEAL_C[1] + SEAL_R + 4
    sm = circle_mask(img.shape, SEAL_C, SEAL_R, 2.5)
    seal_rgba = rgba(img[sy0:sy1, sx0:sx1], sm[sy0:sy1, sx0:sx1])
    save_debug(seal_rgba, "env-seal.jpg", 400)
    save_webp(seal_rgba, "envelope/seal.webp", 300, quality=90)
    manifest["seal"] = {"x": sx0, "y": sy0, "w": sx1 - sx0, "h": sy1 - sy0}

    # ---- card from 2.png, extended by reflecting its lower band so it can rise further.
    img2 = load("2.png")
    cx0, cy0, cx1, cy1 = CARD
    card = img2[cy0:cy1, cx0:cx1].copy()
    # Extend with blank parchment tiled from an empty area of the card itself (hidden inside the
    # envelope for most of the animation, so it only needs to read as paper).
    patch = card[770:1000, 95:325]
    tile = np.concatenate([patch, patch[:, ::-1]], axis=1)
    tile = np.concatenate([tile, tile[::-1]], axis=0)
    cw_ = card.shape[1]
    ext = np.tile(tile, (int(np.ceil(640 / tile.shape[0])), int(np.ceil(cw_ / tile.shape[1])), 1))[:640, :cw_]
    ext = ext - ext.mean((0, 1)) + card[-60:].reshape(-1, 3).mean(0)
    seam = 50
    blend = np.linspace(0, 1, seam, dtype=np.float32)[:, None, None]
    card[-seam:] = card[-seam:] * (1 - blend) + ext[:seam] * blend
    card = np.concatenate([card, ext[seam:]], axis=0)
    ch, cw = card.shape[:2]
    cm = np.ones((ch, cw), np.float32)
    inset = 7
    cm[:inset] = 0; cm[:, :inset] = 0; cm[:, -inset:] = 0
    cm = cv2.GaussianBlur(cm, (0, 0), 1.5)
    card_rgba = rgba(card, cm)
    save_debug(card_rgba, "env-card.jpg")
    save_webp(card_rgba, "envelope/card.webp", 900, quality=88)

    # Card placement in 1.png space: scale 2.png about the envelope's top-edge centre.
    s = ENV_W1 / ENV_W2
    hinge1 = ((TL[0] + TR[0]) / 2, TL[1])
    manifest["card"] = {
        "x": hinge1[0] + (cx0 - HINGE2[0]) * s,
        "y_final": hinge1[1] + (cy0 - HINGE2[1]) * s,
        "w": cw * s,
        "h": ch * s,
    }
    manifest["openPlate"] = {"scale": s, "hinge1": hinge1, "hinge2": HINGE2}
    manifest["triangle"] = {"tl": TL, "tr": TR, "tip": TIP}
    (OUT / "envelope").mkdir(parents=True, exist_ok=True)
    (OUT / "envelope" / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
