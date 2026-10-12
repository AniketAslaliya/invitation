"""Shared helpers for preparing the invitation's layered artwork.

Originals in Groom/ are only ever read. Every derivative is written to public/media/.
"""
from __future__ import annotations

import os
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Groom"
OUT = ROOT / "public" / "media"
DEBUG = Path(os.environ.get("ASSET_DEBUG_DIR", ROOT / ".asset-debug"))


def load(name: str) -> np.ndarray:
    """Load an original as float32 RGB in 0..255."""
    return np.asarray(Image.open(SRC / name).convert("RGB")).astype(np.float32)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def inpaint_background(img: np.ndarray, hole: np.ndarray, scale: int = 4, radius: int = 12, blur: float = 6.0) -> np.ndarray:
    """Estimate what lies behind `hole` (bool mask) using Telea inpainting on a downscaled copy.

    Good for smooth regions such as sky and parchment. Pixels outside the hole are returned untouched.
    """
    h, w = hole.shape
    sw, sh = w // scale, h // scale
    small = cv2.resize(img, (sw, sh), interpolation=cv2.INTER_AREA).astype(np.uint8)
    small_hole = cv2.resize(hole.astype(np.uint8) * 255, (sw, sh), interpolation=cv2.INTER_AREA) > 0
    filled = cv2.inpaint(small, small_hole.astype(np.uint8) * 255, radius, cv2.INPAINT_TELEA)
    filled = cv2.GaussianBlur(filled.astype(np.float32), (0, 0), blur)
    big = cv2.resize(filled, (w, h), interpolation=cv2.INTER_CUBIC)
    out = img.copy()
    out[hole] = big[hole]
    return out


def matte_against_background(img: np.ndarray, bg: np.ndarray, region: np.ndarray, fg_ratio: float = 0.30, fg_luma: float = 32.0) -> np.ndarray:
    """Soft alpha for dark/crimson foliage in front of a known, brighter warm background.

    Combines a chroma test (green/red ratio drops sharply for crimson flowers) with a luminance
    test (leaves and stems are much darker than the sunset sky).
    """
    eps = 1e-3
    luma = img @ np.array([0.299, 0.587, 0.114], np.float32)
    bg_luma = bg @ np.array([0.299, 0.587, 0.114], np.float32)
    ratio = img[..., 1] / (img[..., 0] + eps)
    bg_ratio = bg[..., 1] / (bg[..., 0] + eps)
    a_ratio = np.clip((bg_ratio - ratio) / np.maximum(bg_ratio - fg_ratio, 0.05), 0, 1)
    a_luma = np.clip((bg_luma - luma) / np.maximum(bg_luma - fg_luma, 10), 0, 1)
    alpha = np.maximum(a_ratio, a_luma)
    # Remove faint noise and pull the edge in slightly so no sky-coloured rim survives.
    alpha = smoothstep(0.18, 0.95, alpha)
    alpha[~region] = 0
    # Pull the edge in by ~1px: the source flowers carry a soft depth-of-field glow.
    alpha = cv2.erode(alpha, np.ones((3, 3), np.uint8))
    return alpha.astype(np.float32)


def decontaminate(img: np.ndarray, bg: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Recover foreground colour for edge pixels.

    Edge pixels take their colour from nearby fully-opaque foreground (a normalised blur), so
    semi-transparent edges carry neither the old sky colour nor amplified noise (no halos/rims).
    """
    solid = (alpha > 0.9).astype(np.float32)
    acc = np.zeros_like(img)
    wsum = np.zeros(alpha.shape, np.float32)
    for sigma in (3, 8, 20):
        acc += cv2.GaussianBlur(img * solid[..., None], (0, 0), sigma)
        wsum += cv2.GaussianBlur(solid, (0, 0), sigma)
    near = acc / np.maximum(wsum, 1e-4)[..., None]
    a = np.clip(alpha, 0.05, 1.0)[..., None]
    unmixed = np.clip((img - (1.0 - a) * bg) / a, 0, 255)
    # Trust the unmixed colour only where alpha is high; fall back to neighbouring foreground.
    t = np.clip((alpha - 0.5) / 0.45, 0, 1)[..., None]
    fg = unmixed * t + near * (1 - t)
    return np.where(alpha[..., None] > 0.97, img, fg)


def fill_small_holes(alpha: np.ndarray, max_area: int = 2500) -> np.ndarray:
    """Close pin-holes inside flowers where bright highlights were mistaken for sky."""
    solid = (alpha > 0.5).astype(np.uint8)
    inv = 1 - solid
    n, labels, stats, _ = cv2.connectedComponentsWithStats(inv, 4)
    h, w = alpha.shape
    x, y, cw, ch, area = stats.T
    keep = (area <= max_area) & (x > 0) & (y > 0) & (x + cw < w) & (y + ch < h)
    keep[0] = False
    holes = keep[labels].astype(np.float32)
    holes = cv2.GaussianBlur(holes, (0, 0), 1.2)
    return np.maximum(alpha, np.clip(holes * 1.4, 0, 1))


def rgba(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    return np.dstack([np.clip(rgb, 0, 255), np.clip(alpha * 255.0, 0, 255)]).astype(np.uint8)


def save_webp(arr: np.ndarray, rel: str, width: int | None = None, quality: int = 84) -> tuple[int, int]:
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    im = Image.fromarray(arr.astype(np.uint8))
    if width and im.width != width:
        h = round(im.height * width / im.width)
        im = im.resize((width, h), Image.LANCZOS)
    im.save(path, "WEBP", quality=quality, method=6)
    return im.size


def save_debug(arr: np.ndarray, name: str, max_side: int = 1100) -> None:
    DEBUG.mkdir(parents=True, exist_ok=True)
    im = Image.fromarray(arr.astype(np.uint8))
    if im.mode == "RGBA":
        # Show transparency on a checkerboard so halos are easy to spot.
        bg = Image.new("RGBA", im.size, (40, 120, 60, 255))
        bg.alpha_composite(im)
        im = bg.convert("RGB")
    im.thumbnail((max_side, max_side))
    im.save(DEBUG / name, quality=88)


def bbox(alpha: np.ndarray, pad: int = 8) -> tuple[int, int, int, int]:
    ys, xs = np.where(alpha > 0.01)
    h, w = alpha.shape
    return (max(xs.min() - pad, 0), max(ys.min() - pad, 0), min(xs.max() + pad + 1, w), min(ys.max() + pad + 1, h))
