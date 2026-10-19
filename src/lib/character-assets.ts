import { z } from "zod";

export const CHARACTER_POSTER = "/media/character/room-poster.webp";
export const CHARACTER_CLEAN_PLATE = "/media/character/room-body.webp";
export const CHARACTER_ROOM = "/media/character/rotation/room.webp";
export const CHARACTER_SEQUENCE = "/media/character/rotation/sequence.json";
export const CHARACTER_ROOM_SIZE = [1672, 941] as const;
export const CHARACTER_AXIS_X = 943;
export const HEAD_REGION = { x: 830, y: 50, width: 200, height: 246, neckX: 113, neckY: 231 } as const;

const localImage = z.string().regex(/^\/media\/character\/[a-zA-Z0-9/_-]+\.(webp|png)$/);
const sequenceSchema = z.object({
  version: z.literal(1),
  kind: z.literal("sequence"),
  width: z.number().int().min(128).max(1024),
  height: z.number().int().min(128).max(1536),
  durationSeconds: z.number().min(4).max(12),
  frames: z.array(z.object({ src: localImage, angle: z.number().min(0).lt(360) })).min(72).max(240),
}).superRefine((sequence, context) => {
  const count = sequence.frames.length;
  // Bound decoded memory; compressed file size alone is not a useful GPU/RAM budget.
  if (sequence.width * sequence.height * count > 32 * 1024 * 1024) {
    context.addIssue({ code: "custom", message: "Sequence exceeds the 128 MiB decoded-image budget." });
  }
  if (new Set(sequence.frames.map(frame => frame.src)).size !== count) {
    context.addIssue({ code: "custom", message: "Every angle needs a distinct image." });
  }
  sequence.frames.forEach((frame, index) => {
    if (Math.abs(frame.angle - index * 360 / count) > 0.01) {
      context.addIssue({ code: "custom", message: "Frames must cover 360 degrees at equal, ascending intervals." });
    }
  });
});

export const characterManifestSchema = z.union([
  z.object({ version: z.literal(1), kind: z.literal("unavailable"), reason: z.string().min(1).max(240) }),
  sequenceSchema,
]);
export type CharacterSequence = z.infer<typeof sequenceSchema>;

export function rotationFrameAt(elapsedMs: number, sequence: Pick<CharacterSequence, "durationSeconds" | "frames">) {
  const duration = sequence.durationSeconds * 1000;
  return Math.floor(((Math.max(0, elapsedMs) % duration) / duration) * sequence.frames.length);
}
