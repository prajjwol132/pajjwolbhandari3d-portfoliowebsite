"""Register generated whole-character keyframes and bake optical-flow in-betweens.

Build-time only: pip install -r scripts/character-frame-requirements.txt
The browser consumes complete WebP frames; no facial/body layers are shipped.
"""

import json
import argparse
import subprocess
from pathlib import Path

import cv2 as cv
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/character-source/frame-sequence-v1"
OUTPUT = ROOT / "public/media/character/frames-v3"
AUDIT = ROOT / "artifacts/character-frame-build-v3"
WIDTH, HEIGHT = 480, 720
GAZE_STEPS = 32
COLUMNS = ROWS = GAZE_STEPS * 2 + 1
TURN_STEPS = 64
TURN_COUNT = 12 * TURN_STEPS
cv.setNumThreads(4)


def read(path):
    image = cv.imread(str(path), cv.IMREAD_UNCHANGED)
    if image is None or image.shape[2] != 4:
        raise ValueError(f"Expected RGBA source: {path}")
    # Generated alpha includes near-zero matte noise and 253-valued opaque pixels.
    image[:, :, 3] = np.clip((image[:, :, 3].astype(np.float32) - 6) * 255 / 242, 0, 255).astype(np.uint8)
    image[image[:, :, 3] == 0, :3] = 0
    return image


def flatten(image):
    alpha = image[:, :, 3:4].astype(np.float32) / 255
    return (image[:, :, :3] * alpha + 255 * (1 - alpha)).astype(np.uint8)


def gaze_keys(name):
    sheet = read(SOURCE / name)
    h, w = sheet.shape[:2]
    if w % 3:
        raise ValueError("Gaze sheets need three equal columns")
    cell = w // 3
    result = []
    for index in range(3):
        tile = sheet[:, index * cell:(index + 1) * cell]
        count, labels, stats, _ = cv.connectedComponentsWithStats((tile[:, :, 3] > 100).astype(np.uint8), 8)
        largest = 1 + int(np.argmax(stats[1:, cv.CC_STAT_AREA]))
        tile = tile.copy()
        tile[:, :, 3] *= cv.dilate((labels == largest).astype(np.uint8), np.ones((5, 5), np.uint8))
        scale = HEIGHT / h
        scaled = cv.resize(tile, (round(cell * scale), HEIGHT), interpolation=cv.INTER_AREA)
        frame = np.zeros((HEIGHT, WIDTH, 4), np.uint8)
        left = (WIDTH - scaled.shape[1]) // 2
        frame[:, left:left + scaled.shape[1]] = scaled
        result.append(frame)
    return result


def turn_keys(name):
    sheet = read(SOURCE / name)
    mask = (sheet[:, :, 3] > 128).astype(np.uint8)
    count, labels, stats, centers = cv.connectedComponentsWithStats(mask, 8)
    ids = sorted(range(1, count), key=lambda index: stats[index, cv.CC_STAT_AREA], reverse=True)[:4]
    ids.sort(key=lambda index: centers[index, 0])
    if len(ids) != 4 or min(stats[index, cv.CC_STAT_AREA] for index in ids) < 20000:
        raise ValueError(f"Cannot identify four separate complete figures in {name}")
    result = []
    for index in ids:
        x, y, w, h, _ = stats[index]
        component = (labels == index).astype(np.uint8)
        edge = cv.dilate(component, np.ones((5, 5), np.uint8))
        tile = sheet[y:y + h, x:x + w].copy()
        tile[:, :, 3] *= edge[y:y + h, x:x + w]
        scale = 640 / h
        scaled = cv.resize(tile, (round(w * scale), 640), interpolation=cv.INTER_AREA)
        # Register the wooden chair-leg spread, not the protruding crossed shoe.
        b, g, r, a = cv.split(scaled)
        wood = (r > 100) & (g > 45) & (g < r * .83) & (b < g * .9) & (a > 150)
        wood[:420] = False
        yy, xx = np.where(wood)
        axis = (float(np.percentile(xx, 3)) + float(np.percentile(xx, 97))) / 2 if xx.size else scaled.shape[1] / 2
        left = round(WIDTH / 2 - axis)
        if left < 0 or left + scaled.shape[1] > WIDTH:
            left = (WIDTH - scaled.shape[1]) // 2
        if left < 0:
            raise ValueError(f"Figure wider than the frame in {name}")
        frame = np.zeros((HEIGHT, WIDTH, 4), np.uint8)
        frame[50:690, left:left + scaled.shape[1]] = scaled
        result.append(frame)
    return result


class InBetween:
    def __init__(self, first, last):
        self.first = first
        self.last = last
        a = cv.cvtColor(flatten(first), cv.COLOR_BGR2GRAY)
        b = cv.cvtColor(flatten(last), cv.COLOR_BGR2GRAY)
        dis = cv.DISOpticalFlow.create(cv.DISOPTICAL_FLOW_PRESET_MEDIUM)
        dis.setFinestScale(0)
        dis.setGradientDescentIterations(32)
        self.forward = dis.calc(a, b, None)
        self.backward = dis.calc(b, a, None)
        yy, xx = np.mgrid[:HEIGHT, :WIDTH]
        self.grid = np.stack((xx, yy), axis=-1).astype(np.float32)
        self.a = self.premultiply(first)
        self.b = self.premultiply(last)

    @staticmethod
    def premultiply(image):
        result = image.astype(np.float32) / 255
        result[:, :, :3] *= result[:, :, 3:4]
        return result

    def frame(self, t):
        if t <= 0:
            return self.first.copy()
        if t >= 1:
            return self.last.copy()
        # Bidirectional flow warps the full RGBA frame with one displacement field,
        # keeping alpha edges aligned with RGB rather than dissolving two silhouettes.
        a = cv.remap(self.a, self.grid - self.forward * t, None, cv.INTER_LINEAR, borderMode=cv.BORDER_CONSTANT)
        b = cv.remap(self.b, self.grid - self.backward * (1 - t), None, cv.INTER_LINEAR, borderMode=cv.BORDER_CONSTANT)
        mixed = a * (1 - t) + b * t
        alpha = mixed[:, :, 3:4]
        mixed[:, :, :3] /= np.maximum(alpha, 1 / 255)
        mixed[alpha[:, :, 0] < 1 / 255] = 0
        return np.clip(mixed * 255, 0, 255).astype(np.uint8)


def ground(image):
    """Bake floor contact into the full frame, at the actual shoe/leg tips."""
    mask = (image[:, :, 3] > 180).astype(np.uint8)
    mask[:int(HEIGHT * .73)] = 0
    depth = np.where(mask, np.arange(HEIGHT)[:, None], -1).max(axis=0).astype(np.float32)
    local_floor = cv.dilate(depth.reshape(1, WIDTH), np.ones((1, 25), np.uint8))[0]
    candidates = np.flatnonzero((depth >= HEIGHT * .855) & (depth >= local_floor - 3))
    contacts = []
    for cluster in np.split(candidates, np.flatnonzero(np.diff(candidates) > 6) + 1):
        if cluster.size:
            bottom = int(depth[cluster].max())
            xx = cluster[depth[cluster] >= bottom - 3]
            contacts.append((int(np.mean(xx)), bottom + 1, max(6, int((xx.max() - xx.min()) * .58))))
    shadow = np.zeros((HEIGHT, WIDTH), np.float32)
    for x, y, radius in contacts:
        ambient = np.zeros_like(shadow)
        cv.ellipse(ambient, (x, y + 1), (radius + 9, 5), 0, 0, 360, .13, -1)
        shadow = np.maximum(shadow, cv.GaussianBlur(ambient, (0, 0), 5))
        contact = np.zeros_like(shadow)
        cv.ellipse(contact, (x, y), (radius, 2), 0, 0, 360, .3, -1)
        shadow = np.maximum(shadow, cv.GaussianBlur(contact, (0, 0), 1.4))
    alpha = image[:, :, 3:4].astype(np.float32) / 255
    behind = shadow[:, :, None] * (1 - alpha)
    out_alpha = alpha + behind
    rgb = (image[:, :, :3] * alpha + 38 * behind) / np.maximum(out_alpha, 1 / 255)
    return np.dstack((np.clip(rgb, 0, 255), out_alpha[:, :, 0] * 255)).astype(np.uint8)


def save(path, image):
    if not cv.imwrite(str(path), ground(image), [cv.IMWRITE_WEBP_QUALITY, 94]):
        raise OSError(f"Could not export {path}")


def contact_sheet(images, path, columns=3):
    rows = (len(images) + columns - 1) // columns
    sheet = np.full((rows * 360, columns * 240, 3), 255, np.uint8)
    for index, image in enumerate(images):
        y, x = divmod(index, columns)
        sheet[y * 360:(y + 1) * 360, x * 240:(x + 1) * 240] = cv.resize(flatten(image), (240, 360))
    cv.imwrite(str(path), sheet)


def rife_sequence(keys, steps, name, rife, reuse=False):
    """Run the local GPU interpolator on color and coverage, then restore RGBA."""
    work = AUDIT / "rife-frames" / f"{name}-{steps}"
    for channel in ("color", "alpha"):
        source, destination = work / channel / "input", work / channel / "output"
        source.mkdir(parents=True, exist_ok=True)
        destination.mkdir(parents=True, exist_ok=True)
        cached = reuse and (destination / f"{len(keys) * steps:08d}.png").exists()
        for index, key in enumerate(keys):
            image = flatten(key) if channel == "color" else cv.cvtColor(key[:, :, 3], cv.COLOR_GRAY2BGR)
            previous = cv.imread(str(source / f"{index:03d}.png")) if cached else None
            cached = cached and previous is not None and np.array_equal(previous, image)
            cv.imwrite(str(source / f"{index:03d}.png"), image)
        # ncnn uses source_count/output_count for its time step and repeats the
        # last key; take only (keys-1)*steps+1 outputs below.
        command = [str(rife / "rife-ncnn-vulkan.exe"), "-i", str(source), "-o", str(destination),
                   "-n", str(len(keys) * steps), "-m", str(rife / "rife-v4.6"), "-j", "1:1:2", "-f", "%08d.png"]
        if not cached:
            result = subprocess.run(command, capture_output=True, text=True)
            if result.returncode:
                raise RuntimeError(result.stderr)
    frames = []
    for index in range((len(keys) - 1) * steps + 1):
        if index % steps == 0:
            frames.append(keys[index // steps].copy())
            continue
        filename = f"{index + 1:08d}.png"
        color = cv.imread(str(work / "color/output" / filename)).astype(np.float32)
        alpha = cv.imread(str(work / "alpha/output" / filename), cv.IMREAD_GRAYSCALE).astype(np.float32) / 255
        alpha = np.clip((alpha - .025) / .95, 0, 1)
        rgb = (color - 255 * (1 - alpha[:, :, None])) / np.maximum(alpha[:, :, None], 1 / 255)
        frame = np.dstack((np.clip(rgb, 0, 255), alpha * 255)).astype(np.uint8)
        frame[alpha < .01] = 0
        frames.append(frame)
    print(f"RIFE {name}: {len(frames)} frames", flush=True)
    return frames


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--rife", type=Path, help="Local rife-ncnn-vulkan folder, including rife-v4.6")
    parser.add_argument("--reuse", action="store_true", help="Reuse matching local RIFE output for shadow/export adjustments")
    args = parser.parse_args()
    for folder in (OUTPUT / "gaze", OUTPUT / "turn", AUDIT):
        folder.mkdir(parents=True, exist_ok=True)
    keys = [gaze_keys(f"gaze-{name}.png") for name in ("up", "level", "down")]
    neutral = keys[1][1]
    contact_sheet([frame for row in keys for frame in row], AUDIT / "gaze-keyframes.png")
    # Stabilize the already matching seated pose in exported whole-image frames.
    # This is baked content, never a separately movable head in the website.
    stationary = np.clip((np.arange(HEIGHT) - 245) / 32, 0, 1).reshape(HEIGHT, 1, 1)
    horizontal = []
    for row_index, row in enumerate(keys):
        if args.rife:
            horizontal.append(rife_sequence(row, GAZE_STEPS, f"gaze-row-{row_index}", args.rife, args.reuse))
            continue
        pairs = [InBetween(row[0], row[1]), InBetween(row[1], row[2])]
        horizontal.append([pairs[min(column // GAZE_STEPS, 1)].frame((column - min(column // GAZE_STEPS, 1) * GAZE_STEPS) / GAZE_STEPS) for column in range(COLUMNS)])
    middle_frames = []
    for column in range(COLUMNS):
        vertical = rife_sequence([row[column] for row in horizontal], GAZE_STEPS, f"gaze-column-{column}", args.rife, args.reuse) if args.rife else None
        pairs = None if vertical else [InBetween(horizontal[0][column], horizontal[1][column]), InBetween(horizontal[1][column], horizontal[2][column])]
        for row in range(ROWS):
            segment = min(row // GAZE_STEPS, 1)
            image = vertical[row] if vertical else pairs[segment].frame((row - segment * GAZE_STEPS) / GAZE_STEPS)
            image = np.round(image * (1 - stationary) + neutral * stationary).astype(np.uint8)
            save(OUTPUT / "gaze" / f"{row * COLUMNS + column:04d}.webp", image)
            if row == GAZE_STEPS:
                middle_frames.append(image)
        print(f"Gaze column {column + 1}/{COLUMNS}", flush=True)
    save(OUTPUT / "neutral.webp", neutral)
    strips = [turn_keys(f"turn-{index}.png") for index in range(4)]
    turns = [neutral, strips[0][1], strips[0][2], strips[1][0], strips[1][1], strips[1][2],
             strips[2][0], strips[2][1], strips[2][2], strips[3][0], strips[3][1], strips[3][2]]
    contact_sheet(turns, AUDIT / "turn-keyframes.png", 4)
    samples = []
    interpolated_turns = rife_sequence(turns + [turns[0]], TURN_STEPS, "turn", args.rife, args.reuse) if args.rife else None
    for index, image in enumerate(turns):
        pair = None if interpolated_turns else InBetween(image, turns[(index + 1) % len(turns)])
        for step in range(TURN_STEPS):
            frame = interpolated_turns[index * TURN_STEPS + step] if interpolated_turns else pair.frame(step / TURN_STEPS)
            save(OUTPUT / "turn" / f"{index * TURN_STEPS + step:04d}.webp", frame)
            if step in (0, TURN_STEPS // 2):
                samples.append(frame)
        print(f"Turn segment {index + 1}/{len(turns)}", flush=True)
    contact_sheet(samples, AUDIT / "turn-in-betweens.png", 6)
    contact_sheet(middle_frames, AUDIT / "gaze-in-betweens.png", 6)
    manifest = {"version": 3, "width": WIDTH, "height": HEIGHT, "gaze": {"columns": COLUMNS, "rows": ROWS,
                "frames": [f"/media/character/frames-v3/gaze/{index:04d}.webp" for index in range(COLUMNS * ROWS)]},
                "turn": {"durationSeconds": TURN_COUNT / 60, "frames": [f"/media/character/frames-v3/turn/{index:04d}.webp" for index in range(TURN_COUNT)]}}
    (OUTPUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="ascii")
    report = {"gazeFrames": COLUMNS * ROWS, "turnFrames": TURN_COUNT,
              "totalBytes": sum(path.stat().st_size for path in OUTPUT.rglob("*.webp")),
              "source": f"Built-in image generation keyframes; {'local RIFE v4.6' if args.rife else 'OpenCV DIS'} full-frame interpolation. Not a rigged 3D model."}
    (AUDIT / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="ascii")
    print(json.dumps(report), flush=True)


if __name__ == "__main__":
    main()
