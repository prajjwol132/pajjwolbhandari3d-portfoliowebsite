create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  headline text not null,
  title text,
  tagline text,
  bio text not null,
  location text,
  email text,
  github_url text,
  linkedin_url text,
  website_url text,
  resume_url text,
  avatar_url text,
  social_links jsonb not null default '[]'::jsonb,
  metrics jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  slug text not null unique,
  short_description text not null,
  full_description text not null,
  tech_stack text[] not null default '{}'::text[],
  featured_image_url text,
  video_url text,
  gallery_images text[] not null default '{}'::text[],
  github_url text,
  live_demo_url text,
  technical_breakdown jsonb,
  is_featured boolean not null default false,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;

drop policy if exists "Public can read profile" on public.profiles;
create policy "Public can read profile"
on public.profiles for select
using (true);

drop policy if exists "Authenticated users can manage profile" on public.profiles;
create policy "Authenticated users can manage profile"
on public.profiles for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
on public.categories for select
using (true);

drop policy if exists "Authenticated users can manage categories" on public.categories;
create policy "Authenticated users can manage categories"
on public.categories for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read published projects" on public.projects;
create policy "Public can read published projects"
on public.projects for select
using (status = 'published');

drop policy if exists "Authenticated users can manage projects" on public.projects;
create policy "Authenticated users can manage projects"
on public.projects for all
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('project-media', 'project-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read project media" on storage.objects;
create policy "Public can read project media"
on storage.objects for select
using (bucket_id = 'project-media');

drop policy if exists "Authenticated users can upload project media" on storage.objects;
create policy "Authenticated users can upload project media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'project-media');

drop policy if exists "Authenticated users can update project media" on storage.objects;
create policy "Authenticated users can update project media"
on storage.objects for update
to authenticated
using (bucket_id = 'project-media')
with check (bucket_id = 'project-media');

drop policy if exists "Authenticated users can delete project media" on storage.objects;
create policy "Authenticated users can delete project media"
on storage.objects for delete
to authenticated
using (bucket_id = 'project-media');
