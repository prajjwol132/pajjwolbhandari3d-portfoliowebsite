export const ROTATION_ROOM = "/media/character/rotation/room.webp";
export const ROTATION_POSTER = "/media/character/room-poster.webp";
export const ROTATION_VIEWS = [
  { name: "front", label: "Front", src: "/media/character/rotation/front.webp" },
  { name: "three-quarter", label: "Three-quarter", src: "/media/character/rotation/three-quarter.webp" },
  { name: "profile", label: "Profile", src: "/media/character/rotation/profile.webp" },
  { name: "back", label: "Back", src: "/media/character/rotation/back.webp" },
] as const;

export const ROTATION_ROOM_SIZE = [1672, 941] as const;
export const ROTATION_AXIS_X = 943;

// A small dead band prevents repeated turns when the cursor rests at a boundary.
export function getDirectionalView(ratio: number, previous: number): number {
  const x = Math.max(0, Math.min(1, ratio));
  const candidate = Math.min(3, Math.floor(x * 4));
  if (candidate === previous) return previous;
  const boundary = candidate > previous ? (previous + 1) / 4 : previous / 4;
  if (Math.abs(candidate - previous) === 1 && Math.abs(x - boundary) < 0.025) return previous;
  return candidate;
}
