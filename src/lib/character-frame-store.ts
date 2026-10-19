import { z } from "zod";

export const GAZE_GRID_SIZE = 65;
export const CHARACTER_FRAME_ROOT = "/media/character/frames-v3";
const framePath = z.string().regex(/^\/media\/character\/frames-v3\/(gaze|turn)\/\d{4}\.webp$/);
export const frameManifestSchema = z.object({
  version: z.literal(3), width: z.literal(480), height: z.literal(720),
  gaze: z.object({ columns: z.literal(GAZE_GRID_SIZE), rows: z.literal(GAZE_GRID_SIZE), frames: z.array(framePath).length(GAZE_GRID_SIZE ** 2) }),
  turn: z.object({ durationSeconds: z.number().min(4).max(32), frames: z.array(framePath).length(768) }),
}).superRefine((value, context) => {
  for (const group of ["gaze", "turn"] as const) {
    value[group].frames.forEach((path, index) => {
      if (path !== `${CHARACTER_FRAME_ROOT}/${group}/${String(index).padStart(4, "0")}.webp`) {
        context.addIssue({ code: "custom", message: "Frames must be unique and in chronological order." });
      }
    });
  }
});
export type FrameManifest = z.infer<typeof frameManifestSchema>;

/** Keep compressed frames, but only a small sliding window of decoded pixels. */
export class CharacterFrameStore {
  private blobs = new Map<string, Promise<Blob>>();
  private bitmaps = new Map<string, ImageBitmap>();
  private queue: string[] = [];
  private decoding = new Set<string>();
  private active = 0;
  private disposed = false;
  private abort = new AbortController();

  constructor(private limit: number, private onReady: () => void, private onError: () => void) {}

  get size() { return this.bitmaps.size; }

  private blob(path: string) {
    let result = this.blobs.get(path);
    if (result) { this.blobs.delete(path); this.blobs.set(path, result); }
    if (!result) {
      result = fetch(path, { signal: this.abort.signal }).then(async response => {
        if (!response.ok) throw new Error(`Character frame failed: ${response.status}`);
        const blob = await response.blob();
        if (blob.size > 512 * 1024 || !blob.type.startsWith("image/")) throw new Error("Invalid character frame");
        // The denser gaze grid is streamed around the pointer, never retained whole.
        while (this.blobs.size > 192) this.blobs.delete(this.blobs.keys().next().value!);
        return blob;
      }).catch(error => { this.blobs.delete(path); throw error; });
      this.blobs.set(path, result);
    }
    return result;
  }

  async preload(paths: string[], onProgress?: (percent: number) => void) {
    let next = 0, done = 0;
    const worker = async () => {
      while (next < paths.length && !this.disposed) {
        const path = paths[next++];
        await this.blob(path);
        onProgress?.(Math.round(++done / paths.length * 100));
      }
    };
    await Promise.all(Array.from({ length: 4 }, worker));
  }

  get(path: string) {
    const bitmap = this.bitmaps.get(path);
    if (bitmap) { this.bitmaps.delete(path); this.bitmaps.set(path, bitmap); }
    return bitmap;
  }

  request(path: string, urgent = false) {
    if (this.disposed || this.bitmaps.has(path) || this.decoding.has(path)) return;
    const queued = this.queue.indexOf(path);
    if (queued >= 0) this.queue.splice(queued, 1);
    if (urgent) this.queue.unshift(path); else this.queue.push(path);
    this.queue = this.queue.slice(0, 16);
    this.drain();
  }

  private drain() {
    while (!this.disposed && this.active < 3 && this.queue.length) {
      const path = this.queue.shift()!;
      this.active++;
      this.decoding.add(path);
      void this.blob(path).then(blob => createImageBitmap(blob)).then(bitmap => {
        if (this.disposed) { bitmap.close(); return; }
        if (bitmap.width !== 480 || bitmap.height !== 720) { bitmap.close(); throw new Error("Frame size changed"); }
        this.bitmaps.set(path, bitmap);
        while (this.bitmaps.size > this.limit) {
          const oldest = this.bitmaps.keys().next().value!;
          this.bitmaps.get(oldest)!.close();
          this.bitmaps.delete(oldest);
        }
        this.onReady();
      }).catch(() => { if (!this.disposed) this.onError(); }).finally(() => {
        this.decoding.delete(path); this.active--; this.drain();
      });
    }
  }

  dispose() {
    this.disposed = true;
    this.abort.abort();
    this.queue = [];
    this.bitmaps.forEach(bitmap => bitmap.close());
    this.bitmaps.clear(); this.blobs.clear();
  }
}
