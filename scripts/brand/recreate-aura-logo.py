#!/usr/bin/env python3
"""Create lossless white and transparent Aura logo masters from the approved JPEG."""

from argparse import ArgumentParser
from pathlib import Path

import numpy as np
from PIL import Image


def main() -> None:
    parser = ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    source = Image.open(args.source).convert("RGB")
    rgb = np.asarray(source, dtype=np.float32)

    distance_from_white = np.max(255.0 - rgb, axis=2)
    alpha = np.clip((distance_from_white - 3.0) / 180.0, 0.0, 1.0)
    alpha[alpha < 0.06] = 0.0
    alpha[alpha > 0.92] = 1.0

    # Remove isolated JPEG blocks while retaining each disconnected wordmark
    # letter and the symbol as separate legitimate components.
    active = alpha > 0
    visited = np.zeros(active.shape, dtype=bool)
    keep = np.zeros(active.shape, dtype=bool)
    height, width = active.shape
    for start_y, start_x in zip(*np.where(active & ~visited)):
        if visited[start_y, start_x]:
            continue
        stack = [(int(start_y), int(start_x))]
        visited[start_y, start_x] = True
        component: list[tuple[int, int]] = []
        while stack:
            y, x = stack.pop()
            component.append((y, x))
            for next_y, next_x in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if (
                    0 <= next_y < height
                    and 0 <= next_x < width
                    and active[next_y, next_x]
                    and not visited[next_y, next_x]
                ):
                    visited[next_y, next_x] = True
                    stack.append((next_y, next_x))
        if len(component) >= 24:
            for y, x in component:
                keep[y, x] = True
    alpha[~keep] = 0.0

    safe_alpha = np.maximum(alpha[:, :, None], 1 / 255)
    clean_rgb = (rgb - (1.0 - safe_alpha) * 255.0) / safe_alpha
    clean_rgb = np.clip(clean_rgb, 0.0, 255.0)
    partial_edge = (alpha > 0.0) & (alpha < 1.0)
    clean_rgb[partial_edge] = np.array([20.0, 60.0, 96.0])
    clean_rgba = np.dstack((clean_rgb, alpha[:, :, None] * 255.0)).astype(np.uint8)

    full = Image.fromarray(clean_rgba, "RGBA")
    full.save(args.output_dir / "aura-logo-exact-transparent-full.png")

    mask = clean_rgba[:, :, 3] > 8
    ys, xs = np.where(mask)
    padding = 32
    left = max(0, int(xs.min()) - padding)
    top = max(0, int(ys.min()) - padding)
    right = min(source.width, int(xs.max()) + padding + 1)
    bottom = min(source.height, int(ys.max()) + padding + 1)
    cropped = full.crop((left, top, right, bottom))
    cropped.save(args.output_dir / "aura-logo-exact-transparent.png")
    cropped.resize((cropped.width * 2, cropped.height * 2), Image.Resampling.LANCZOS).save(
        args.output_dir / "aura-logo-exact-transparent-2x.png"
    )

    active_rows = np.where(mask.any(axis=1))[0]
    row_runs: list[tuple[int, int]] = []
    run_start = previous = int(active_rows[0])
    for row in active_rows[1:]:
        row = int(row)
        if row > previous + 1:
            row_runs.append((run_start, previous))
            run_start = row
        previous = row
    row_runs.append((run_start, previous))

    symbol_top, symbol_bottom = row_runs[0]
    symbol_mask = mask[symbol_top : symbol_bottom + 1]
    symbol_columns = np.where(symbol_mask.any(axis=0))[0]
    symbol_padding = 24
    symbol_box = (
        max(0, int(symbol_columns.min()) - symbol_padding),
        max(0, symbol_top - symbol_padding),
        min(source.width, int(symbol_columns.max()) + symbol_padding + 1),
        min(source.height, symbol_bottom + symbol_padding + 1),
    )
    symbol = full.crop(symbol_box)
    symbol.save(args.output_dir / "aura-mark-exact-transparent.png")
    symbol.resize((symbol.width * 2, symbol.height * 2), Image.Resampling.LANCZOS).save(
        args.output_dir / "aura-mark-exact-transparent-2x.png"
    )

    symbol_white = Image.new("RGBA", symbol.size, (255, 255, 255, 0))
    symbol_white.putalpha(symbol.getchannel("A"))
    symbol_white.save(args.output_dir / "aura-mark-exact-white.png")

    logo_white = Image.new("RGBA", cropped.size, (255, 255, 255, 0))
    logo_white.putalpha(cropped.getchannel("A"))
    logo_white.save(args.output_dir / "aura-logo-exact-reversed.png")

    for icon_size in (32, 64, 192, 512):
        canvas = Image.new("RGBA", (icon_size, icon_size), (246, 250, 252, 255))
        target = int(icon_size * 0.78)
        fitted = symbol.copy()
        fitted.thumbnail((target, target), Image.Resampling.LANCZOS)
        canvas.alpha_composite(
            fitted,
            ((icon_size - fitted.width) // 2, (icon_size - fitted.height) // 2),
        )
        canvas.save(args.output_dir / f"aura-icon-exact-{icon_size}.png")

    source.save(args.output_dir / "aura-logo-exact-white.png")
    source.resize((source.width * 2, source.height * 2), Image.Resampling.LANCZOS).save(
        args.output_dir / "aura-logo-exact-white-2x.png"
    )


if __name__ == "__main__":
    main()
