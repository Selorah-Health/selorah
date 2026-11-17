# Subdomains and search console setup

This guide covers the public hostnames, DNS at Name.com, Vercel, Supabase Auth,
Google Cloud OAuth, Google Search Console, and Resend. It is written for the
current project values:

- Domain: `selorah.app`
- Registrar and DNS: Name.com
- Marketing site: `https://www.selorah.app`
- App: `https://app.selorah.app`
- Newsletter: `https://newsletter.selorah.app`
- Billing: `https://billings.selorah.app`
- Vercel project root: `frontend`
- Supabase project ref: `dbpyyhrbekamyejizson`
- Supabase OAuth callback: `https://dbpyyhrbekamyejizson.supabase.co/auth/v1/callback`
- Resend domain: `selorah.app`

Do one layer at a time. DNS first, then Vercel, then auth, then email, then
Search Console. If something breaks, you can tell which layer changed.

## Current status

Checked on 14 November 2026:

- `www.selorah.app` resolves through the Vercel CNAME
  `be8a91d4292e45bd.vercel-dns-017.com`.
- `app.selorah.app`, `newsletter.selorah.app`, and `billings.selorah.app` have
  no CNAME yet and do not resolve.
- The apex MX records point to Name.com. Leave them alone when you add the
  subdomains.
- `send.selorah.app` has the Resend MX and SPF records. Leave them alone when you
  add the subdomains.
- DMARC is present with `p=none`. Tighten it to `p=quarantine` only after the
  Resend domain is verified and real mail is flowing.
- Vercel project root is `frontend`. The same project can serve the marketing
  site and the app, or you can create a second project for `app`.

### Fast path for the three missing subdomains

Do this once per hostname, starting with `app`:

1. In Vercel, open the project, go to Settings, then Domains, and add
   `app.selorah.app`.
2. Vercel shows the exact CNAME target for that domain. It is currently
   `be8a91d4292e45bd.vercel-dns-017.com`.
3. In Name.com, open `selorah.app`, then Manage DNS.
4. Add a CNAME record: host `app`, value
   `be8a91d4292e45bd.vercel-dns-017.com`, TTL 300.
5. Wait for Vercel to show the domain as valid. This usually takes 5 to 30
   minutes.
6. Repeat for `newsletter` and `billings`. Use the same CNAME target unless
   Vercel shows a different one.
7. Open `https://app.selorah.app` and confirm it loads the app. Do not add
   `www` again, and do not touch the existing MX, SPF, DKIM, or DMARC records.

If a subdomain is served by a different provider, for example a newsletter
platform, add the CNAME target that provider gives you instead of the Vercel
target. Do not point a provider domain at Vercel unless the page is actually
served by Vercel.

## 1. Decide the hostname map

Start with four hostnames. Add the optional ones only when you can maintain them.

| Hostname | Purpose | Host | Indexed |
| --- | --- | --- | --- |
| `www.selorah.app` | Marketing site, blog, waitlist | Vercel | Yes |
| `selorah.app` | Apex redirect to `www` | Vercel | No, 308 redirect |
| `app.selorah.app` | Patient, doctor, and hospital app | Vercel | No, private app |
| `newsletter.selorah.app` | Newsletter signup or archive | Vercel or newsletter provider | Yes, if public |
| `billings.selorah.app` | Billing and subscription portal | Vercel | No, authenticated |
| `billing.selorah.app` | Optional 308 alias to `billings` | Vercel | No |
| `api.selorah.app` | Backend API, optional | Vercel functions or backend host | No |
| `status.selorah.app` | Status page, optional | External provider | Usually yes |
| `docs.selorah.app` | Documentation, optional | External provider | Yes |

Rules:

- The marketing site is the canonical public host. Use `www` as the canonical
  host and redirect the apex to it with a 308.
- The app is private. Do not index `/dashboard`, `/cms`, `/login`, or `/shared`.
- Do not add a wildcard `*` CNAME to Vercel. It makes every subdomain resolve to
  the app and creates duplicate content and security surprises.
- Keep health data on `app.selorah.app`. Do not share app sessions with the
  marketing host.

## 2. DNS at Name.com

### 2.1 Choose the DNS model

Option A, recommended for this project: keep DNS at Name.com. Add CNAME records
for each subdomain and use Vercel's A record or ALIAS for the apex. This keeps
your existing email records in one place.

Option B: move nameservers to Vercel DNS. This is clean for hosting, but you must
recreate every MX, SPF, DKIM, DMARC, and verification TXT record in Vercel DNS.
Do not switch if you are not ready to recreate email records.

If you use Cloudflare, make all DNS changes in Cloudflare instead of Name.com.
Set SSL/TLS to Full (strict) and do not proxy the Vercel CNAMEs unless you know
how Cloudflare and Vercel interact.

### 2.2 Add the records

1. Sign in to Name.com.
2. Open My Domains, select `selorah.app`, then Manage DNS.
3. Add the records below. Use the exact targets Vercel shows in the project
   domain settings. The values below are the common Vercel targets.

| Name | Type | Value | TTL |
| --- | --- | --- | --- |
| `www` | CNAME | `be8a91d4292e45bd.vercel-dns-017.com.` | 300 while verifying |
| `app` | CNAME | `be8a91d4292e45bd.vercel-dns-017.com.` | 300 while verifying |
| `newsletter` | CNAME | `be8a91d4292e45bd.vercel-dns-017.com.` | 300 while verifying |
| `billings` | CNAME | `be8a91d4292e45bd.vercel-dns-017.com.` | 300 while verifying |
| `billing` | CNAME | `be8a91d4292e45bd.vercel-dns-017.com.` | 300 while verifying |
| `@` | A | `76.76.21.21` | 300 while verifying |
| `@` | TXT | `google-site-verification=...` | 300 |

Notes:

- The CNAME target above is the current target on the live `www` record. Always
  copy the target Vercel shows in the domain settings for the specific hostname.
- Vercel may ask for a different A record. Use the value Vercel gives you.
- If Name.com supports ALIAS or ANAME for the apex, use it instead of an A
  record. It survives Vercel IP changes.
- Do not create both an A and a conflicting AAAA record for the apex unless
  Vercel tells you to.
- Do not add a second SPF TXT record. Merge providers into one record. See the
  Resend section.
- Keep the Google verification TXT record after verification. Do not delete it.

### 2.3 Verify DNS

Run these from a terminal:

```bash
dig +short www.selorah.app CNAME
dig +short app.selorah.app CNAME
dig +short newsletter.selorah.app CNAME
dig +short billings.selorah.app CNAME
dig +short billing.selorah.app CNAME
dig +short selorah.app A
dig +short TXT selorah.app
dig +short TXT _dmarc.selorah.app
```

If `dig` is not available, use the DNS-over-HTTPS endpoint:

```text
https://dns.google/resolve?name=app.selorah.app&type=CNAME
https://dns.google/resolve?name=selorah.app&type=A
```

CNAME changes usually appear in 5 to 30 minutes. Allow up to 24 to 48 hours
before assuming a record is wrong.

## 3. Vercel

### 3.1 Add the domains

1. Open the Vercel project that serves `frontend`.
2. Go to Settings, then Domains.
3. Add `www.selorah.app` and set it as the primary domain.
4. Add `selorah.app` and choose "Redirect to another domain". Redirect to
   `www.selorah.app` with status 308.
5. Add `app.selorah.app`.
6. Add `newsletter.selorah.app` and `billings.selorah.app` only if those pages
   are served by a Vercel project. If they redirect to an external provider, use
   a small redirect project or a Vercel rewrite.

If the app is a separate deployment, create a second Vercel project from the same
repository with root `frontend`. Use separate environment variables and a
separate Supabase redirect allow list. Do not point both projects at the same
production database without a plan.

### 3.2 Environment variables

Set these in Vercel, per environment:

```text
VITE_SUPABASE_URL=https://dbpyyhrbekamyejizson.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_API_URL=/api
VITE_PAYSTACK_PUBLIC_KEY=...
VITE_VAPID_PUBLIC_KEY=...
```

Add a public site URL variable if the code starts using one:

```text
VITE_PUBLIC_SITE_URL=https://www.selorah.app
VITE_APP_URL=https://app.selorah.app
```

Rules:

- Never put `SUPABASE_SERVICE_ROLE_KEY`, Resend API keys, or Paystack secret keys
  in a `VITE_` variable. Vite exposes `VITE_` values to the browser.
- Use different keys for preview and production. Do not let preview deployments
  write to the production database.
- Keep local values in `frontend/.env.local`. It is gitignored.

### 3.3 Rewrites and headers

The existing `frontend/vercel.json` already handles the legal pages and the SPA
fallback. If all subdomains serve the same SPA, the app can read
`window.location.hostname` and render the right shell. If you want a clean
security boundary, use separate Vercel projects for `www` and `app`.

If you keep one project, add host-specific rewrites carefully:

```json
{
  "source": "/(.*)",
  "has": [{ "type": "host", "value": "app.selorah.app" }],
  "destination": "/index.html"
}
```

Do not add a catch-all host rewrite that sends `www` traffic to the app shell.

### 3.4 SSL and verification

Vercel issues certificates automatically when DNS is correct. If a domain shows
"Invalid Configuration":

1. Compare the exact CNAME or A record with the value Vercel shows.
2. Remove conflicting AAAA or CAA records.
3. Wait for the TTL to expire.
4. Click Refresh in Vercel.
5. If it still fails, remove the domain from Vercel and add it again.

Verify:

```bash
curl -I https://www.selorah.app
curl -I https://app.selorah.app
curl -I https://www.selorah.app/sitemap.xml
curl -I https://www.selorah.app/robots.txt
```

You want a 200 for the marketing pages, a 308 from `https://selorah.app` to
`https://www.selorah.app`, and a valid certificate on every host.

## 4. Supabase Auth URLs

1. Open the Supabase dashboard for `dbpyyhrbekamyejizson`.
2. Go to Authentication, then URL Configuration.
3. Set Site URL to `https://app.selorah.app`. If auth starts on the marketing
   site, set it to `https://www.selorah.app` instead, but keep the app in the
   redirect allow list.
4. Add these Redirect URLs:

```text
https://www.selorah.app/**
https://app.selorah.app/**
https://billings.selorah.app/**
http://localhost:4173/**
http://localhost:5173/**
```

5. Add Vercel preview URLs only if you need auth on previews. Each preview URL is
   unique. Do not use a broad wildcard on a health app.
6. Check the email templates. Confirmation and magic link templates should use
   the app URL, not a hard-coded localhost URL.
7. For Google sign in, keep the provider callback as
   `https://dbpyyhrbekamyejizson.supabase.co/auth/v1/callback`.

Expected behavior:

- Sign in on `app.selorah.app` and return to `app.selorah.app`.
- Sign in on `www.selorah.app` only if the marketing site actually needs auth.
- A session on `www` does not automatically appear on `app` because this SPA
  stores the session per origin. That is expected. Do not share health sessions
  with the marketing host.

If the redirect goes to the wrong host, fix Site URL first, then the Redirect
URLs, then the client code that passes `redirectTo`.

## 5. Google Cloud OAuth

1. Open Google Cloud Console, then APIs and Services, then Credentials.
2. Open the OAuth 2.0 Client ID used by Supabase. It must be a Web application.
3. Add Authorized JavaScript origins:

```text
https://www.selorah.app
https://app.selorah.app
https://billings.selorah.app
http://localhost:4173
http://localhost:5173
```

4. Add Authorized redirect URIs:

```text
https://dbpyyhrbekamyejizson.supabase.co/auth/v1/callback
```

5. On the OAuth consent screen:
   - App name: `Selorah Health`
   - User support email: `support@selorah.app`
   - Authorized domains: `selorah.app` and `supabase.co`
   - Privacy policy: `https://www.selorah.app/privacy`
   - Terms of service: `https://www.selorah.app/terms`
   - Scopes: `openid`, `email`, `profile` only

6. If you see `Error 401: invalid_client` or `OAuth client was not found`, the
   Client ID in Supabase does not match the Google Cloud project. Copy the full
   Client ID and secret again, save both, and retry. Also confirm the client type
   is Web application.

7. Preview deployments: Google does not support wildcard redirect URIs. If you
   need OAuth on previews, add the exact preview URL for that deployment. Remove
   it when you are done.

## 6. Google Search Console

### 6.1 Use a Domain property

Create a Domain property for `selorah.app`, not only a URL-prefix property. A
Domain property covers `www`, `app`, and every other subdomain. It also covers
both HTTP and HTTPS.

1. Open Google Search Console.
2. Add a property, choose Domain, and enter `selorah.app`.
3. Copy the DNS TXT value.
4. Add it at Name.com:

| Name | Type | Value | TTL |
| --- | --- | --- | --- |
| `@` | TXT | `google-site-verification=...` | 300 |

5. Wait for DNS, then click Verify. Keep the TXT record after verification.
6. If you already have a URL-prefix property for `https://www.selorah.app/`, keep
   it for historical data. Make the Domain property the primary. Export data
   before deleting anything.

### 6.2 Submit the sitemap

Submit:

```text
https://www.selorah.app/sitemap.xml
```

The sitemap should contain only canonical, indexable, 200-status URLs. It should
not contain `/login`, `/cms`, `/dashboard`, `/shared`, or preview URLs. The
current sitemap includes the marketing pages, `/blog`, and the seed blog post.

### 6.3 Fix the common issues

**Page with redirect**

`http://selorah.app` and `https://selorah.app` should 308 redirect to
`https://www.selorah.app`. This is expected. Use permanent redirects, not 302.

**Duplicate, Google chose a different canonical**

Make sure every marketing page declares one canonical URL:

```html
<link rel="canonical" href="https://www.selorah.app/blog" />
```

The app and shared record pages should not be indexed. Add `noindex` to private
routes and disallow them in `robots.txt`.

**Soft 404**

A single-page app often returns 200 for unknown routes. Add a real not-found
route, show a clear 404 page, and add `noindex` to it. Keep the sitemap clean.

**Crawled - currently not indexed**

Improve the page, add internal links, and make sure the URL is in the sitemap.
Publish the blog. Submit the blog index and each post for indexing.

**Discovered - currently not indexed**

Check that the URL returns 200, is not blocked by `robots.txt`, and is not a
duplicate. Remove query-string variants from internal links.

**Blocked by robots.txt**

Open `https://www.selorah.app/robots.txt` and confirm it allows `/`, `/blog`, and
the assets needed to render. Block only private areas:

```text
User-agent: *
Allow: /
Disallow: /cms
Disallow: /dashboard
Disallow: /shared
Disallow: /login

Sitemap: https://www.selorah.app/sitemap.xml
```

Do not block CSS, JavaScript, or images. Google needs them to render the page.

**Excluded by noindex**

Remove the `noindex` tag from pages you want indexed. Keep it on private routes.

### 6.4 Inspect and request indexing

Use URL Inspection for:

```text
https://www.selorah.app/
https://www.selorah.app/blog
https://www.selorah.app/blog/welcome-to-selorah
https://www.selorah.app/pricing
https://www.selorah.app/about
```

Click "Test live URL", confirm the page renders, then click "Request indexing".
Do this after the production deploy, not before.

### 6.5 Bing and analytics

- In Bing Webmaster Tools, import the site from Google Search Console and submit
  the same sitemap.
- Link Google Analytics and Search Console so query data is available in one
  place.
- Check the Page Indexing report weekly for the first month.

## 7. Resend

### 7.1 Add and verify the domain

1. Open Resend, then Domains, then Add Domain.
2. Add `selorah.app`. If you want to isolate sending reputation, use
   `mail.selorah.app` instead and send from that subdomain.
3. Resend shows MX, SPF, DKIM, and DMARC records. Add them at Name.com exactly as
   shown.
4. Keep one SPF record only. If Google Workspace or another provider already has
   an SPF record, merge the includes:

```text
v=spf1 include:_spf.google.com include:amazonses.com ~all
```

Do not create a second `v=spf1` record. Multiple SPF records break SPF.

5. Add DMARC:

| Name | Type | Value |
| --- | --- | --- |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:dmarc@selorah.app; adkim=s; aspf=s; pct=100` |

6. Wait for Resend to verify. This can take 15 minutes to 48 hours.

### 7.2 Send from a real inbox

Use a monitored address:

```text
Selorah Health <hello@selorah.app>
Support <support@selorah.app>
```

Do not use `noreply@` for support. Replies should reach a real inbox.

### 7.3 API keys and the newsletter

- Create a Resend sending key with the minimum permissions.
- Store it in the backend environment only. Never in the frontend or Git.
- For the newsletter, use Resend Audiences and Broadcasts, or a dedicated
  newsletter platform. If you use `newsletter.selorah.app`, point it to the
  signup page or the provider's hosted page.
- Add double opt-in and a clear unsubscribe link.
- Test with a Gmail address and check SPF, DKIM, and DMARC pass in the headers.
- Warm up the domain slowly. Do not send a large blast on the first day.

If mail lands in spam:

- Check DMARC alignment.
- Remove URL shorteners.
- Keep the HTML simple.
- Send transactional mail from `mail.selorah.app` if the root domain has a lot of
  other email traffic.
- Check that the From domain matches the DKIM signing domain.

## 8. Supabase database, storage, and roles

1. Apply the blog migration:

```text
supabase/migrations/20261112000001_blog_cms.sql
```

Use the Supabase SQL editor or `npx supabase db push` with the project linked.

2. Confirm RLS on `blog_posts`:
   - Public can select published posts only.
   - Writers can create and edit their own drafts.
   - Admins can publish and manage every post.
   - Drafts are never visible to anonymous users.

3. For cover images, create a public `blog` storage bucket with file size and MIME
   limits. Do not allow SVG uploads from untrusted writers.

4. Set CMS roles in `app_metadata.role` to `writer` or `admin`. Do not use
   `user_metadata` for authorization.

5. Test as anonymous:

```sql
select id, slug, title, status
from public.blog_posts
where status = 'published';
```

The same query as anonymous should not return drafts.

6. Enable Point-in-Time Recovery if your plan supports it. Test a restore before
   you need it.

## 9. Newsletter and billing subdomains

### Newsletter

Option A, recommended now: `newsletter.selorah.app` is a simple signup page in
the marketing app. It posts to a serverless function or a newsletter provider.
No second app to maintain.

Option B: use Resend Broadcasts and link to the hosted page.

Option C: use a dedicated newsletter platform and CNAME `newsletter` to the
provider's exact target.

### Billing

1. If billing is a route in the app, point `billings.selorah.app` at the same
   Vercel project and protect the route with auth.
2. If you use Paystack or Stripe's hosted portal, make `billings.selorah.app` a
   redirect to the hosted portal or to `https://app.selorah.app/billing`.
3. Never expose secret keys in the frontend. Create checkout sessions in a
   serverless function.
4. Add `billings.selorah.app` to Supabase redirect URLs and Google OAuth origins
   only if it handles auth.

## 10. Security and SEO checklist

- [ ] Apex 308 redirects to `www`.
- [ ] `www` is the canonical marketing host.
- [ ] `app` is not indexed.
- [ ] `robots.txt` allows `/`, `/blog`, and assets, and blocks private routes.
- [ ] `sitemap.xml` contains only canonical, 200, indexable URLs.
- [ ] Google Search Console Domain property is verified with DNS TXT.
- [ ] Sitemap is submitted and processed.
- [ ] Google OAuth origins and redirect URIs match exactly.
- [ ] Supabase Site URL is `https://app.selorah.app`.
- [ ] Resend SPF, DKIM, and DMARC pass.
- [ ] No service-role, Resend, or Paystack secret keys in the frontend or Git.
- [ ] HSTS is enabled only after every subdomain is HTTPS.
- [ ] Real phone test: sign in, share a record, open the shared link, revoke
      access.

## 11. Rollback and correction

- If a subdomain breaks, remove the Vercel domain and the DNS record, then re-add
  them. Change one layer at a time.
- If Search Console shows the wrong property, keep the old property and add the
  Domain property. Do not delete history.
- If OAuth fails after a hostname change, update Google Cloud origins and
  Supabase redirect URLs in the same window.
- If Resend verification fails, compare the exact TXT values, check for duplicate
  SPF records, and wait for the TTL to expire.
- If a certificate fails, remove conflicting AAAA or CAA records and refresh the
  domain in Vercel.

## 12. Useful commands

```bash
# DNS
dig +short www.selorah.app CNAME
dig +short app.selorah.app CNAME
dig +short selorah.app A
dig +short TXT selorah.app
dig +short TXT resend._domainkey.selorah.app
dig +short TXT _dmarc.selorah.app

# HTTP
curl -I https://www.selorah.app
curl -I https://app.selorah.app
curl -I https://www.selorah.app/sitemap.xml
curl -I https://www.selorah.app/robots.txt

# Local checks
npx tsc --noEmit
npm run lint
npm run build
```
