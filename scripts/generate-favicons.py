#!/usr/bin/env python3
"""Gera favicons otimizados a partir da logo NuFit (fundo transparente, sem padding excessivo)."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC_LOGO = ROOT / "frontend" / "src" / "assets" / "Nufit-logo.png"
PUBLIC = ROOT / "frontend" / "public"


def trim_transparent(img: Image.Image, pad_ratio: float = 0.06) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    cropped = img.crop(bbox)
    w, h = cropped.size
    pad = max(1, int(max(w, h) * pad_ratio))
    canvas = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    canvas.paste(cropped, (pad, pad), cropped)
    return canvas


def fit_square(img: Image.Image, size: int, fill: float = 0.96) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    w, h = img.size
    scale = min((size * fill) / w, (size * fill) / h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (size - nw) // 2
    y = (size - nh) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas


def main() -> None:
    source = Image.open(SRC_LOGO).convert("RGBA")
    trimmed = trim_transparent(source)

    # Logo da UI: recorte sem padding excessivo
    trimmed.save(SRC_LOGO, "PNG")
    trimmed.save(PUBLIC / "nufit-logo.png", "PNG")

    favicon_sizes = [16, 32, 48, 64, 128, 192, 512]
    icons = {size: fit_square(trimmed, size) for size in favicon_sizes}

    icons[32].save(PUBLIC / "favicon-32x32.png", "PNG")
    icons[48].save(PUBLIC / "favicon-48x48.png", "PNG")
    icons[192].save(PUBLIC / "favicon-192x192.png", "PNG")
    icons[512].save(PUBLIC / "favicon-512x512.png", "PNG")
    fit_square(trimmed, 180).save(PUBLIC / "apple-touch-icon.png", "PNG")

    ico_images = [icons[s] for s in (16, 32, 48)]
    ico_images[0].save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=ico_images[1:],
    )

    print("Favicons gerados em", PUBLIC)


if __name__ == "__main__":
    main()
