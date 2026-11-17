# Blog CMS access

The blog is public at `/blog`. Posts are written and published from the blog CMS at `/cms`. The public website content and partnership ad slots use a separate website admin at `/adb`; see `docs/WEBSITE_CMS.md`.

## Who can use it

Any signed-in account with a `@selorah.app` email gets CMS access automatically and is treated as an admin. You do not need to change a role or app metadata for those accounts.

Other accounts need a `writer` or `admin` role in `public.profiles.role`. The app reads the role from `profiles`, not the legacy `public.users` table. `app_metadata.role` is only a fallback.

## Open the CMS

Local:

```text
http://localhost:4173/cms
```

Production:

```text
https://www.selorah.app/cms
```

If you are not signed in, the guard sends you to `/login`. Sign in with a `@selorah.app` account, then open `/cms` again. A domain staff login goes straight to `/cms` when no other return path is set.

There is also a development-only preview at `/cms-preview`. It uses sample posts and does not save to Supabase or upload covers.

## Create a staff account

### Option 1: create a confirmed account with the script

This is the recommended path when you want an account immediately and do not want to depend on a confirmation email.

```bash
cd frontend
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  npm run cms:user -- name@selorah.app "a-strong-password" "First" "Last"
```

The script:

- creates a confirmed Supabase auth user, or updates the password if the email already exists;
- sets `app_metadata.role` to `admin`;
- writes the matching `public.profiles` row with the admin role and display name.

Get the service role key from Supabase, Project Settings, API. Never commit it or put it in a `VITE_` variable.

### Option 2: normal signup

Sign up at `/signup` with a working `name@selorah.app` mailbox, confirm the email, and sign in. The domain rule opens the CMS. If the mailbox is not ready yet, use the script above.

## Email setup

The DNS for `selorah.app` is configured for both directions:

- Root MX records point to Name.com, so the domain can receive mail. The actual mailbox must be created in Name.com's email service.
- `send.selorah.app` has Resend MX and SPF records, and `resend._domainkey` has the DKIM key. DMARC is present with `p=none`.
- This means outbound mail from the app and Resend can work, and the root domain is ready to receive once a mailbox exists. The DNS records do not create the mailbox by themselves.

## Give a non-domain user a role

1. Open the Supabase dashboard for the project.
2. Go to Table Editor, then `profiles`.
3. Find the user row.
4. Set `role` to `writer` or `admin`.
5. Sign the user out and back in.

You can also set Raw App Meta Data in Authentication, Users as a fallback, but `profiles.role` is the source the app uses.

## Write and format a post

1. Open `/cms`.
2. Click New post.
3. Fill in the title, slug, excerpt, content, category, author name, and cover image.
4. Use the toolbar above the content box: bold, italic, underline, H1, H2, quote, bullet list, numbered list, link, and inline code.
5. Select text before clicking a format. Clicking the same format again removes it. Ctrl/Cmd+B, I, U, and K also work.
6. Use Preview to see the rendered post. Underline is stored as `<u>...</u>` and rendered safely as a React element, never as raw HTML.
7. Leave the status as Draft while you work, or choose Published.
8. Click Save draft or Save and publish.
9. Open View live to check the public post.

The public routes are:

```text
/blog
/blog/<slug>
```

## Cover images

Use a 16:9 image. Recommended upload size is 1600 x 900 or larger, for example 1920 x 1080. Keep the important subject near the centre because cards and the post hero crop around the middle.

Use Upload image in the post settings, or paste an image URL. The upload button uses the public `blog` Supabase Storage bucket and accepts JPEG, PNG, WebP, or AVIF up to 5 MB.

If a post has no cover image, the app renders a generated cover with the post
title on the standard `#6183FF` background. The same fallback appears in the CMS
preview, the blog index, and the post page, so a missing upload never leaves an
empty frame. The bundled covers live in `frontend/public/blog/covers/` and can be
regenerated with `npm run blog:covers`.

## Database and storage migrations

Apply these in order in the Supabase SQL editor, or with the Supabase CLI:

```text
supabase/migrations/20261112000001_blog_cms.sql
supabase/migrations/20261113000001_blog_storage.sql
supabase/migrations/20261114000001_cms_domain_access.sql
supabase/migrations/20261116000001_blog_linkedin_posts.sql
```

If you use the CLI, run `npx supabase login` and `npx supabase link --project-ref dbpyyhrbekamyejizson` first, then `npx supabase db push`. The SQL editor is simpler if the CLI is not set up.

- The first creates `blog_posts`, the `is_selorah_staff()` helper, and the `blog_role()` helper.
- The second creates the public `blog` bucket and its cover-image policies.
- The third adds the `@selorah.app` domain rule, points `author_id` at `profiles`, and refreshes the blog and storage policies.
- The fourth seeds the LinkedIn-derived launch posts. The public blog falls back to the same preview posts if `blog_posts` is missing, so the page still renders before the migration is applied.

If the table or bucket is missing, the CMS shows a clear error. The upload button is wired, but it cannot succeed until the `blog` bucket exists and the storage policies are applied.

## Current live status

As of this check, the live Supabase project still needs the four migrations above. Until they are applied:

- `/cms` cannot load or save posts.
- The cover upload button reports the missing `blog` bucket.

The `qa@selorah.app` profile already exists in `profiles`. Any `@selorah.app` login will get CMS access once the frontend changes are deployed and the migrations are applied.
