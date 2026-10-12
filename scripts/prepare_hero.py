"""Hero / envelope layers from Groom/1.png (closed envelope) and Groom/2.png (open envelope).

Outputs (public/media/hero/):
  plate-closed-*.webp   sunset palace + envelope, flowering branches & floating petals removed
  plate-open-*.webp     same for the open-envelope artwork
  branch-left.webp      transparent bougainvillea branch (top-left), from 1.png
  branch-right.webp     transparent bougainvillea branch (top-right), from 1.png
  petal-N.webp          individual rose petals lifted from the sky
"""
import json

import cv2
import numpy as np

from asset_lib import (OUT, bbox, decontaminate, inpaint_background, load, matte_against_background,
                       rgba, save_debug, save_webp)


def sky_region(h, w, protect=None):
    yy, xx = np.mgrid[0:h, 0:w]
    region = yy < 1880
    region |= (yy < 2240) & (xx > 560) & (xx < 2440)
    if protect:
        x0, y0, x1, y1 = protect
        region &= ~((xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1))
    return region


# The invitation card standing in the open envelope (2.png) must never be treated as sky.
CARD_PROTECT = {"open": (560, 1150, 2380, 5225)}


def extract(img, key):
    h, w, _ = img.shape
    region = sky_region(h, w, CARD_PROTECT.get(key))
    hard = (img[..., 1] < 72) & region
    hard = cv2.morphologyEx(hard.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0
    hole = cv2.dilate(hard.astype(np.uint8), np.ones((61, 61), np.uint8)) > 0
    hole &= region
    bg = inpaint_background(img, hole, scale=4, radius=14, blur=5)
    alpha = matte_against_background(img, bg, hole)
    return bg, alpha, region


def clean_plate(img, bg, alpha):
    cover = cv2.dilate((alpha > 0.01).astype(np.uint8), np.ones((31, 31), np.uint8)).astype(np.float32)
    cover = cv2.GaussianBlur(cover, (0, 0), 8)[..., None]
    return img * (1 - cover) + bg * cover


def components(alpha):
    solid = (alpha > 0.25).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(solid, 8)
    return n, labels, stats


def main():
    manifest = {}
    petals = []

    for src, key in (("1.png", "closed"), ("2.png", "open")):
        img = load(src)
        h, w, _ = img.shape
        bg, alpha, _ = extract(img, key)
        plate = clean_plate(img, bg, alpha)
        save_debug(plate, f"hero-plate-{key}.jpg")
        # Feathered side edges so the panel melts into the wide sunset backdrop on landscape screens
        # (on phones the plate is cropped past the feather, so nothing changes there).
        xs = np.linspace(0, 1, w, dtype=np.float32)
        edge = np.minimum(xs, 1 - xs) / 0.07
        feather = np.clip(edge, 0, 1)
        feather = feather * feather * (3 - 2 * feather)
        plate_rgba = rgba(plate, np.broadcast_to(feather[None, :], (h, w)))
        for width in (720, 1200, 1680):
            save_webp(plate_rgba, f"hero/plate-{key}-{width}.webp", width, quality=82)
        manifest[f"plate-{key}"] = {"w": w, "h": h}

        n, labels, stats = components(alpha)
        grown = cv2.dilate(labels.astype(np.uint16).astype(np.float32), np.ones((15, 15), np.uint8)).astype(np.int32)
        fg = decontaminate(img, bg, alpha)

        if key == "closed":
            for side in ("left", "right"):
                keep = np.zeros(n, bool)
                for i in range(1, n):
                    x, y, cw, ch, area = stats[i]
                    if area < 4000:
                        continue
                    touches_top = y <= 2
                    touches_side = x <= 2 if side == "left" else x + cw >= w - 2
                    in_half = (x + cw / 2) < w / 2 if side == "left" else (x + cw / 2) > w / 2
                    if (touches_top or touches_side) and in_half:
                        keep[i] = True
                    # small leaf clusters that sit close to the big branch still belong to it
                    elif in_half and area > 600 and y < (1700 if side == "left" else 1050) and \
                            (x < 1350 if side == "left" else x > 1900):
                        keep[i] = True
                m = keep[grown] & (alpha > 0.005)
                a = np.where(m, alpha, 0)
                x0, y0, x1, y1 = bbox(a, 4)
                # Anchor to the true image corner so the layer can be positioned in plate coordinates.
                if side == "left":
                    x0, y0 = 0, 0
                else:
                    x1, y0 = w, 0
                out = rgba(fg[y0:y1, x0:x1], a[y0:y1, x0:x1])
                save_debug(out, f"hero-branch-{side}.jpg")
                # Real-world check: composite onto the cleaned plate, shifted like parallax would.
                comp = plate.copy()
                sub = comp[y0 + 20:y1 + 20, x0:x1]
                aa = a[y0:y1, x0:x1][: sub.shape[0], : sub.shape[1], None]
                sub[:] = fg[y0:y1, x0:x1][: sub.shape[0], : sub.shape[1]] * aa + sub * (1 - aa)
                cx = 350 if side == "left" else w - 650
                save_debug(comp[300:1000, cx:cx + 700], f"hero-zoom-{side}.jpg", 700)
                size = save_webp(out, f"hero/branch-{side}.webp", min(out.shape[1], 1100), quality=86)
                manifest[f"branch-{side}"] = {"x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0), "file": size}

        # Floating petals: isolated mid-size blobs in the sky.
        for i in range(1, n):
            x, y, cw, ch, area = stats[i]
            if not (900 < area < 60000) or x <= 2 or y <= 2 or x + cw >= w - 2:
                continue
            if cw > 420 or ch > 420:
                continue
            m = (grown == i) & (alpha > 0.005)
            a = np.where(m, alpha, 0)
            x0, y0, x1, y1 = bbox(a, 6)
            crop = rgba(fg[y0:y1, x0:x1], a[y0:y1, x0:x1])
            petals.append((area, crop))

    petals.sort(key=lambda p: -p[0])
    for idx, (_, crop) in enumerate(petals[:8]):
        save_debug(crop, f"hero-petal-{idx}.jpg", 300)
        save_webp(crop, f"hero/petal-{idx}.webp", min(crop.shape[1], 160), quality=86)
    manifest["petals"] = min(len(petals), 8)

    (OUT / "hero").mkdir(parents=True, exist_ok=True)
    (OUT / "hero" / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__" and "--backdrop" not in __import__("sys").argv:
    main()


def backdrop():
    """Soft light field for landscape screens: the whole plate, blurred, mirrored left and right.

    Placed directly behind the sharp plate at the same scale, the mirrored copies continue its
    colours outward, so the feathered plate edges dissolve without a seam.
    """
    import cv2
    img = load("1.png")
    small = cv2.resize(img, (360, 640), interpolation=cv2.INTER_AREA)
    wide = np.concatenate([small, small[:, ::-1], small, small[:, ::-1], small], axis=1)
    wide = cv2.GaussianBlur(wide, (0, 0), 18)
    wide *= 0.86  # sit slightly darker than the plate so the eye stays on the envelope
    save_webp(wide, "hero/backdrop.webp", None, quality=72)
    # Sky-only variant (no envelope) for the story and closing chapters.
    sky = cv2.resize(img[0:2300], (360, 282), interpolation=cv2.INTER_AREA)
    sky = np.concatenate([sky, sky[:, ::-1], sky, sky[:, ::-1], sky], axis=1)
    save_webp(cv2.GaussianBlur(sky, (0, 0), 10) * 0.9, "hero/sky.webp", None, quality=72)


if __name__ == "__main__" and "--backdrop" in __import__("sys").argv:
    backdrop()
