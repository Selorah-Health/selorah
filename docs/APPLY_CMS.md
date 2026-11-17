# Apply the CMS database changes

The live project already has the older tables (`profiles`, `waitlist`,
`medical_records`, and so on). Do not re-run the older files in
`supabase/migrations`. Several of them are not idempotent and will report
"already exists" errors.

Only these eight files are new:

```text
20261112000001_blog_cms.sql
20261113000001_blog_storage.sql
20261114000001_cms_domain_access.sql
20261115000001_referrals.sql
20261115000002_site_cms.sql
20261115000003_site_admin_owner.sql
20261116000000_waitlist_email.sql
20261116000001_blog_linkedin_posts.sql
```

They must run in that order. `site_cms` calls `is_selorah_staff()`, which is
created by `blog_cms`, and the site admin migration calls the same helper. That
ordering is the usual reason a manual paste fails.

If you saw `relation "public.blog_posts" does not exist`, a later blog migration
ran before `20261112000001_blog_cms.sql` created the table. The bundle below
fixes that ordering.

If you saw `ERROR: 42809: referenced relation "profiles" is not a table`, the
older bundle tried to add foreign keys to `public.profiles`. On this project
`public.profiles` is a read-only compatibility view, so the new bundle stores
author and admin ids as plain UUIDs. Referral usernames now live in
`public.usernames`, keyed by `public.users.id`.

## Easiest path: one file

Open the Supabase SQL editor and paste the whole of:

```text
supabase/APPLY_CMS.sql
```

That file contains the eight migrations in the correct order, wrapped in one
transaction. It is idempotent, so it is safe to run again if a later step failed.
Run it once, then reload `/adb`.

## CLI path

```bash
npx supabase login
npx supabase link --project-ref dbpyyhrbekamyejizson
npx supabase db push
```

The CLI applies migrations in filename order, which is already correct.

## If a storage policy step fails

The database tables and the public buckets can exist without the storage
policies. If the SQL editor reports that you must own `storage.objects`, apply
the database part first and then create the storage policies in the dashboard:

1. Open Storage in the Supabase dashboard.
2. Select the `blog` bucket, then Policies.
3. Add public read access.
4. Add insert, update, and delete access for authenticated users where
   `public.blog_role()` is `writer` or `admin`.
5. Repeat for the `site` bucket, using `public.blog_role() = 'admin'`.

The `site` and `blog` buckets already exist in the live project, so the bucket
insert is not the part that creates them.

## Verify

After the SQL finishes, these should return `200` instead of `404`:

```text
/rest/v1/site_content?select=*&limit=1
/rest/v1/ad_slots?select=*&limit=1
/rest/v1/blog_posts?select=*&limit=1
```

`/rest/v1/site_admins`, `/rest/v1/usernames`, and `/rest/v1/referrals` are
protected. With the anon key they return `401` or `403` once the table exists,
which is expected. Use a signed-in session or the service role to inspect them.

Then:

1. Open `/adb` with an allowlisted account.
2. Change the hero headline or a FAQ answer.
3. Save.
4. Open the public home page and confirm the change appears.
5. Open `/cms`, create a draft, and confirm it saves.

## Still needed for email

Applying SQL does not set Edge Function secrets. Set these in the Supabase
dashboard or with the CLI:

```bash
supabase secrets set \
  RESEND_API_KEY="re_your_key" \
  EMAIL_FROM="Selorah Health <hello@selorah.app>" \
  EMAIL_REPLY_TO="customer@selorah.app" \
  EMAIL_CRON_SECRET="$(openssl rand -hex 32)"
```

Then deploy the function:

```bash
supabase functions deploy send-email --no-verify-jwt
```

The waitlist confirmation trigger queues a row in `email_queue`. Delivery starts
once the Resend key and `EMAIL_FROM` are present.
