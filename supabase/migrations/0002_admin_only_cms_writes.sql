create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false);
$$;

grant execute on function public.is_portfolio_admin() to authenticated;

drop policy if exists "Authenticated users can manage profile" on public.profiles;
drop policy if exists "Authenticated users can manage categories" on public.categories;
drop policy if exists "Authenticated users can manage projects" on public.projects;

create policy "Admins can manage profiles"
on public.profiles for all
to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

create policy "Admins can manage categories"
on public.categories for all
to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

create policy "Admins can manage projects"
on public.projects for all
to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

drop policy if exists "Authenticated users can upload project media" on storage.objects;
drop policy if exists "Authenticated users can update project media" on storage.objects;
drop policy if exists "Authenticated users can delete project media" on storage.objects;

create policy "Admins can upload project media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'project-media' and public.is_portfolio_admin());

create policy "Admins can update project media"
on storage.objects for update
to authenticated
using (bucket_id = 'project-media' and public.is_portfolio_admin())
with check (bucket_id = 'project-media' and public.is_portfolio_admin());

create policy "Admins can delete project media"
on storage.objects for delete
to authenticated
using (bucket_id = 'project-media' and public.is_portfolio_admin());

update storage.buckets
set file_size_limit = 262144000,
    allowed_mime_types = array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'video/mp4',
      'video/webm'
    ]
where id = 'project-media';
