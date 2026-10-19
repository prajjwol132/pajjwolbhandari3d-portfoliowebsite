import type { PageMedia } from "@/types/database";

export const defaultPageMedia: PageMedia[] = [
  { key: "hero_room_background", label: "Home hero room background", image_url: "/media/character/rotation/room.webp", alt_text: "White and yellow creative studio", display_order: 1, created_at: "", updated_at: "" },
  { key: "hero_character_poster", label: "Home hero character poster", image_url: "/media/character/room-poster.webp", alt_text: "Prajjwol seated on his yellow chair in a white and yellow studio", display_order: 2, created_at: "", updated_at: "" },
  { key: "brand_logo", label: "Navigation logo", image_url: "/media/brand/pb-logo.png", alt_text: "PB", display_order: 3, created_at: "", updated_at: "" },
  { key: "about_photo_1", label: "About composition photo 1", image_url: "/media/about/1b2f4686abf5-9aac752109.jpeg", alt_text: "Prajjwol seated outdoors in a plaid blazer", display_order: 4, created_at: "", updated_at: "" },
  { key: "about_photo_2", label: "About composition photo 2", image_url: "/media/about/d462b6136b07-13c85efd5e.jpeg", alt_text: "Prajjwol at Surya Events", display_order: 5, created_at: "", updated_at: "" },
  { key: "about_photo_3", label: "About composition photo 3", image_url: "/media/about/5a2d5930e3aa-f3380b6597.jpeg", alt_text: "An evening portrait of Prajjwol", display_order: 6, created_at: "", updated_at: "" },
  { key: "about_photo_4", label: "About composition photo 4", image_url: "/media/about/d0142608e030-cdf9168d86.jpeg", alt_text: "Prajjwol seated on a stool, smiling at the camera", display_order: 7, created_at: "", updated_at: "" },
  { key: "history_foundation", label: "Story: The Foundation", image_url: "/media/portraits/19.webp", alt_text: "Prajjwol seated outdoors in a blazer", display_order: 8, created_at: "", updated_at: "" },
  { key: "history_edit", label: "Story: The Edit", image_url: "/media/portraits/18.webp", alt_text: "Prajjwol seated on a stool, smiling", display_order: 9, created_at: "", updated_at: "" },
  { key: "history_motion_ai", label: "Story: Motion & AI", image_url: "/media/portraits/17.webp", alt_text: "An evening portrait of Prajjwol", display_order: 10, created_at: "", updated_at: "" },
  { key: "history_beyond_views", label: "Story: Beyond the Views", image_url: "/media/about/d462b6136b07-13c85efd5e.jpeg", alt_text: "Prajjwol at Surya Events", display_order: 11, created_at: "", updated_at: "" },
  { key: "history_beyond_edit", label: "Story: Beyond the Edit", image_url: "/media/about/977b411908ae-ffbd1ded8b.jpeg", alt_text: "Prajjwol in a red jacket overlooking a mountain landscape", display_order: 12, created_at: "", updated_at: "" },
  { key: "feature_video_fallback", label: "Featured film fallback image", image_url: "/media/portraits/12.webp", alt_text: "Prajjwol looking across the mountains", display_order: 13, created_at: "", updated_at: "" },
  { key: "gallery_photo_1", label: "Gallery photo 1", image_url: "/media/portraits/19.webp", alt_text: "Prajjwol seated in Kathmandu", display_order: 14, created_at: "", updated_at: "" },
  { key: "gallery_photo_2", label: "Gallery photo 2", image_url: "/media/portraits/18.webp", alt_text: "Prajjwol smiling on a stool", display_order: 15, created_at: "", updated_at: "" },
  { key: "gallery_photo_3", label: "Gallery photo 3", image_url: "/media/portraits/17.webp", alt_text: "An evening out", display_order: 16, created_at: "", updated_at: "" },
  { key: "gallery_photo_4", label: "Gallery photo 4", image_url: "/media/about/d462b6136b07-13c85efd5e.jpeg", alt_text: "Prajjwol at Surya Events", display_order: 17, created_at: "", updated_at: "" },
  { key: "gallery_photo_5", label: "Gallery photo 5", image_url: "/media/about/977b411908ae-ffbd1ded8b.jpeg", alt_text: "Prajjwol in a red jacket overlooking a mountain landscape", display_order: 18, created_at: "", updated_at: "" },
];

export function mergePageMedia(rows: readonly Partial<PageMedia>[] | null | undefined): PageMedia[] {
  const savedByKey = new Map((rows ?? []).map((row) => [row.key, row]));
  return defaultPageMedia.map((fallback) => {
    const saved = savedByKey.get(fallback.key);
    return saved
      ? { ...fallback, ...saved, key: fallback.key, label: fallback.label }
      : fallback;
  });
}

export function getPageImage(rows: readonly PageMedia[], key: string) {
  return rows.find((item) => item.key === key)?.image_url
    ?? defaultPageMedia.find((item) => item.key === key)?.image_url
    ?? "";
}
