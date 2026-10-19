create table if not exists public.page_media (
  key text primary key,
  label text not null,
  image_url text not null,
  alt_text text not null default '',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_page_media_updated_at on public.page_media;
create trigger set_page_media_updated_at
before update on public.page_media
for each row execute function public.set_updated_at();

alter table public.page_media enable row level security;

drop policy if exists "Public can read page media" on public.page_media;
create policy "Public can read page media"
on public.page_media for select
using (true);

drop policy if exists "Admins can manage page media" on public.page_media;
create policy "Admins can manage page media"
on public.page_media for all
to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

insert into public.page_media (key, label, image_url, alt_text, display_order)
values
  ('hero_room_background', 'Home hero room background', '/media/character/rotation/room.webp', 'White and yellow creative studio', 1),
  ('hero_character_poster', 'Home hero character poster', '/media/character/room-poster.webp', 'Prajjwol seated on his yellow chair in a white and yellow studio', 2),
  ('brand_logo', 'Navigation logo', '/media/brand/pb-logo.png', 'PB', 3),
  ('about_photo_1', 'About composition photo 1', '/media/about/1b2f4686abf5-9aac752109.jpeg', 'Prajjwol seated outdoors in a plaid blazer', 4),
  ('about_photo_2', 'About composition photo 2', '/media/about/d462b6136b07-13c85efd5e.jpeg', 'Prajjwol at Surya Events', 5),
  ('about_photo_3', 'About composition photo 3', '/media/about/5a2d5930e3aa-f3380b6597.jpeg', 'An evening portrait of Prajjwol', 6),
  ('about_photo_4', 'About composition photo 4', '/media/about/d0142608e030-cdf9168d86.jpeg', 'Prajjwol seated on a stool, smiling at the camera', 7),
  ('history_foundation', 'Story: The Foundation', '/media/portraits/19.webp', 'Prajjwol seated outdoors in a blazer', 8),
  ('history_edit', 'Story: The Edit', '/media/portraits/18.webp', 'Prajjwol seated on a stool, smiling', 9),
  ('history_motion_ai', 'Story: Motion & AI', '/media/portraits/17.webp', 'An evening portrait of Prajjwol', 10),
  ('history_beyond_views', 'Story: Beyond the Views', '/media/about/d462b6136b07-13c85efd5e.jpeg', 'Prajjwol at Surya Events', 11),
  ('history_beyond_edit', 'Story: Beyond the Edit', '/media/about/977b411908ae-ffbd1ded8b.jpeg', 'Prajjwol in a red jacket overlooking a mountain landscape', 12),
  ('feature_video_fallback', 'Featured film fallback image', '/media/portraits/12.webp', 'Prajjwol looking across the mountains', 13),
  ('gallery_photo_1', 'Gallery photo 1', '/media/portraits/19.webp', 'Prajjwol seated in Kathmandu', 14),
  ('gallery_photo_2', 'Gallery photo 2', '/media/portraits/18.webp', 'Prajjwol smiling on a stool', 15),
  ('gallery_photo_3', 'Gallery photo 3', '/media/portraits/17.webp', 'An evening out', 16),
  ('gallery_photo_4', 'Gallery photo 4', '/media/about/d462b6136b07-13c85efd5e.jpeg', 'Prajjwol at Surya Events', 17),
  ('gallery_photo_5', 'Gallery photo 5', '/media/about/977b411908ae-ffbd1ded8b.jpeg', 'Prajjwol in a red jacket overlooking a mountain landscape', 18)
on conflict (key) do nothing;
