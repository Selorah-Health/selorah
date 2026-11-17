# Website admin

The public website content and partnership ad slots are edited from the website
admin at `/adb`. The blog has its own CMS at `/cms`.

## Who can use it

Any signed-in `@selorah.app` account is treated as an admin. Accounts with a
`writer` or `admin` role in `public.profiles.role` can also open it. The
bootstrap owner addresses are allowlisted in the browser and in
`public.site_admins`, so the owner can open the admin before a profile role is
set. Add more addresses with `VITE_SITE_ADMIN_EMAILS` and a matching row in
`public.site_admins`.

The route is wrapped in `RoleGuard`, so a signed-out visitor is sent to `/login`
first. A signed-in account without access sees an access message instead of
being bounced to `/dashboard`, which makes the reason clear and avoids a
redirect loop when the profile lookup is slow.

`/admin` redirects to `/adb` for old links.

## Open the admin

Local:

```text
http://localhost:4173/adb
```

Production:

```text
https://www.selorah.app/adb
```

## What can be edited

| Tab | What it controls |
| --- | --- |
| Home page | Announcement bar, hero, product preview, hospitals and doctors, ownership, trust, what happens next, final CTA |
| FAQ | FAQ headings and every question and answer |
| Founder | Founder name, role, quote, bio paragraphs, photo, LinkedIn and X links |
| Contact | Contact page copy and the four email routes |
| Ad slots | Partnership band, leaderboard, and native placement copy, images, aspect ratios, and visibility |
| Advanced JSON | The full site content object for bulk edits and agent handoffs |

Changes are saved to Supabase and read by the public site through
`SiteContentProvider`. The provider starts with the last cached snapshot and then
hydrates from the database, so the public pages do not wait on a network round
trip.

## Email routing

The contact page sends general and patient support to `customer@selorah.app`.
Hospital, investor, research, insurance, and press topics go to
`samuelamanze@selorah.app`. Privacy and security requests stay on the support
inbox. All four addresses can be changed from the Contact tab.

Hospitals, researchers, and insurers are routed to the contact form instead of
the waitlist. The links prefill the right topic and show a short context note,
so the conversation starts with the correct team.

## Ad slots and image upload

The three seeded slots are:

| Slot | Default aspect ratio | Recommended size |
| --- | --- | --- |
| `partner-band` | 16:3 | 1600 x 300 |
| `leaderboard` | 16:3 | 1600 x 300 |
| `native` | 16:9 | 1600 x 900 |

The aspect ratio is applied to both the uploaded image and the admin preview
placeholder. Public pages hide a slot until it has an image, so visitors never
see an empty ad box or an "open slot" placeholder. Only the admin preview shows
the placeholder and its ratio.

Uploads go to the public `site` Supabase Storage bucket. Only admins can write.
Accepted files are JPEG, PNG, WebP, and AVIF up to 5 MB. The admin card shows a
live preview, so you can confirm the placeholder and the uploaded image without
publishing first.

## Apply the migration

Run these migrations in the Supabase SQL editor, or apply them with the
Supabase CLI:

```text
supabase/migrations/20261115000002_site_cms.sql
supabase/migrations/20261115000003_site_admin_owner.sql
```

The first creates:

- `public.site_content`
- `public.ad_slots`
- the `site` storage bucket
- RLS policies for public reads and admin writes
- the three seeded ad slots

The second seeds the bootstrap owner rows in `public.site_admins` so the
allowlisted owner addresses can save before a profile role is assigned.

Until the migration is applied, `/adb` shows the built-in defaults and a clear
error when a save or upload is attempted. Public pages keep rendering the
defaults, so a missing migration does not break the landing page.

## Test the placeholder

1. Open `/adb` and choose the Ad slots tab.
2. Leave the image empty. The admin preview shows a dashed placeholder with the
   selected aspect ratio.
3. Change the aspect ratio and confirm the preview height changes.
4. Upload an image. The preview switches from placeholder to image.
5. Save changes, then open the home page and confirm the placement renders.
6. With no image saved, confirm the public home page does not render the slot.

The public slot containers expose `data-ad-slot` and the media area exposes
`data-ad-state="image"`. The admin preview can expose
`data-ad-state="placeholder"` while an image is missing. That makes the state
visible to browser tests and agents.

## Related files

- `frontend/src/lib/siteContent.ts`: types, defaults, merge rules, cache helpers
- `frontend/src/contexts/SiteContentContext.tsx`: public content provider
- `frontend/src/pages/cms/SiteCms.tsx`: website admin
- `frontend/src/components/landing/AdSections.tsx`: public ad rendering
- `supabase/migrations/20261115000002_site_cms.sql`: schema, policies, bucket, seeds
- `supabase/migrations/20261115000003_site_admin_owner.sql`: bootstrap owner rows
