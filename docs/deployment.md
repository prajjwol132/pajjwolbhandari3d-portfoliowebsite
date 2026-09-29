# Production Deployment Runbook

This runbook deploys the Prajjwol Bhandari portfolio to Vercel with Supabase-backed CMS data, storage, and a custom domain.

## 1. Local Preflight

Install dependencies from the lockfile:

```bash
npm ci
```

Create local environment values from the template:

```bash
cp .env.example .env.local
```

Fill `.env.local` with real Supabase values, then run:

```bash
npm run lint
npm run type-check
npm run validate:env
npm run validate:assets
npm run validate:webgl
npm run build
```

For the full production gate:

```bash
npm run predeploy
```

For bundle review:

```bash
npm run analyze
```

## 2. Supabase Production Setup

Create or select the production Supabase project.

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

Security rules:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are browser-safe.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is still supported as a legacy fallback.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never prefix it with `NEXT_PUBLIC_`.
- Enable Row Level Security for CMS tables before public production traffic.
- Keep admin mutations behind authenticated Supabase users and server policies.

Required storage bucket:

```text
project-media
```

Recommended storage layout:

```text
project-media/
  projects/
    {user-id}/
      {project-id}/
        featured/
        gallery/
        video/
```

Set storage policies so authenticated admins can upload, update, and delete media. If project media should be public, allow public read access or use signed URLs.

## 3. Vercel Project Setup

Install and authenticate the Vercel CLI when deploying from local:

```bash
npm run deploy:preview
```

Link the project when prompted. For production:

```bash
npm run deploy:prod
```

The repository includes `vercel.json` with:

- `npm ci` install command.
- `npm run predeploy` build command.
- Long-lived cache headers for `/models/*` and `/media/*`.
- Basic production security headers.

Set the following environment variables in Vercel for Production, Preview, and Development as needed:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
```

## 4. Custom Domain DNS

In Vercel, add the domain from Project Settings -> Domains.

For an apex/root domain:

```text
Type: A
Name: @
Value: 76.76.21.21
```

For `www`:

```text
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

After DNS propagates, set the preferred production domain in Vercel and update:

```text
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

## 5. Production Verification

After deployment:

```bash
curl -I https://your-production-domain.com
curl -I https://your-production-domain.com/admin/dashboard
```

Expected:

- `/` returns `200`.
- `/admin/dashboard` redirects unauthenticated visitors to `/admin/login`.
- `/models/developer-workstation.gltf` returns a long-lived cache header.
- Admin login succeeds with a Supabase Auth user.
- Project media uploads to the `project-media` bucket.

## 6. Rollback

Use Vercel Deployments to promote the previous healthy deployment if production validation fails. Supabase schema and storage changes should be applied with migration files before production changes that depend on them.
