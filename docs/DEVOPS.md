# Selorah DevOps

DevOps is the set of practices and automation that keeps Selorah healthy after
code leaves a laptop. For this app it covers five things:

1. Every change is reviewed and checked before it reaches production.
2. The frontend, database, and Edge Functions deploy the same way every time.
3. Secrets stay out of Git and are rotated when needed.
4. Errors, downtime, and slow pages are visible before patients report them.
5. Backups and a rollback plan exist for bad releases and data mistakes.

This document is the working runbook for the current stack.

## Current stack

| Layer | Service | Production config |
| --- | --- | --- |
| Frontend | Vercel | Root directory `frontend` |
| Auth and database | Supabase | Project `dbpyyhrbekamyejizson` |
| Server functions | Supabase Edge Functions | `send-email`, `verify-nin` |
| Files | Supabase Storage | Private buckets, including `emergency-attachments` |
| Email | Resend | Domain `selorah.app` |
| Identity checks | Dojah | Sandbox now, live after company verification |
| Payments | Paystack | Public key in Vercel |
| Onchain anchors | Base | Base Sepolia first, Base mainnet later |
| Source control | GitHub | `Selorah-Health/selorah` |

## What is now configured

- `.github/workflows/ci.yml` runs on every pull request and on `main`.
- CI installs the frontend, runs `tsc --noEmit`, builds the production bundle,
  and runs ESLint as a non-blocking report.
- `.github/workflows/supabase-production.yml` is a manual production workflow
  for migrations and Edge Function deploys.
- `frontend/vercel.json` now sends security headers for MIME sniffing, framing,
  referrer policy, browser permissions, and HSTS.
- `docs/LAUNCH_SETUP.md` is the external service checklist.
- `docs/GOOGLE_AUTH_SETUP.md` and `docs/RESEND_SETUP.md` cover those providers.

The CI lint step is intentionally non-blocking while the existing lint debt is
worked down. Do not make it blocking until `npm run lint` exits cleanly.

## 1. GitHub setup

Use `main` as the production branch. Protect it with these rules:

- Require a pull request before merging.
- Require the `Frontend checks` status check.
- Require branches to be up to date before merging.
- Block force pushes and deletions.

Create a branch for each change. Open a pull request. Let Vercel create a
preview deployment. Test the preview. Merge only after the preview and CI pass.

The `.github` folder used to be ignored by Git. It is no longer ignored, so the
workflows are versioned with the app.

## 2. CI checks

The CI workflow runs from the `frontend` directory with Node 20.

Checks:

- `npx tsc --noEmit` catches TypeScript errors.
- `npm run build` builds the Vite app and prerenders the four legal pages.
- `npm run lint` reports ESLint issues. It does not block yet.

The build uses placeholder Supabase and Paystack values. The real values are
only needed at runtime in Vercel.

The root `package-lock.json` is tracked. CI uses `npm install` until the
lockfile is confirmed in sync with the workspace on a clean runner. After that,
switch CI to `npm ci` for reproducible installs.

## 3. Vercel setup

Set the Vercel project root to `frontend`. Keep these environment variables in
Vercel, never in Git:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`
- `VITE_PAYSTACK_PUBLIC_KEY`

Use different values for Preview and Production when necessary. Add a preview
domain allowlist for Supabase Auth if preview sign in should work.

Production should deploy only from `main`. Use Vercel's instant rollback if a
release is bad. The previous deployment stays available.

The `frontend/vercel.json` file also rewrites the legal pages to static HTML and
sets cache headers for the service worker, web manifest, and Tesseract assets.

## 4. Supabase setup

Migrations live in `supabase/migrations`. Treat them as production code.

Local flow:

```sh
supabase link --project-ref dbpyyhrbekamyejizson --yes
supabase db push --remote --include-all --yes
```

`--remote` is required so the CLI targets the linked hosted project instead of
the local Docker stack. `--include-all` lets the push apply a local migration
whose timestamp is older than the last migration already recorded on the
remote. Run `supabase migration list --remote` first if the push reports a
history mismatch.

The manual GitHub workflow does the same thing in production after an approval
on the `production` environment. It can also deploy `send-email`,
`verify-nin`, `paystack-verify`, and `send-push`.

Add these GitHub repository secrets before using the workflow:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_ID`

Set Edge Function secrets with the Supabase CLI, not in the repository:

```sh
supabase secrets set RESEND_API_KEY=... EMAIL_FROM="Selorah Health <hello@selorah.app>" EMAIL_REPLY_TO=support@selorah.app EMAIL_CRON_SECRET=... --project-ref dbpyyhrbekamyejizson
supabase secrets set DOJAH_APP_ID=... DOJAH_API_KEY=... DOJAH_BASE_URL=https://sandbox.dojah.io --project-ref dbpyyhrbekamyejizson
supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:support@selorah.app --project-ref dbpyyhrbekamyejizson
```

Rotate a secret immediately if it appears in a screenshot, log, or chat.

Database rules:

- Row level security must be enabled on every patient table.
- Test with a real patient account, not only the service role.
- Keep the service role key on the server only.
- Never put health data or secrets on chain.
- Use the private `emergency-attachments` bucket for emergency media.

## 5. Monitoring

Add these before public launch:

- Sentry for the React app and Edge Functions. Capture exceptions, release
  version, and user id, but not health record contents.
- Vercel Analytics and Speed Insights for page performance.
- Better Stack or UptimeRobot checks for `https://www.selorah.app`,
  `https://www.selorah.app/privacy`, and the Supabase project health endpoint.
- Supabase log alerts for failed auth, failed function invocations, and storage
  errors.
- Resend webhooks for bounces and complaints. Route them to a monitored inbox.
- Paystack webhook monitoring for failed or late payments.
- A simple status page or a pinned incident note. Patients need to know when
  records or sign in are down.

Alert destinations should be a shared inbox and a phone. Do not rely on one
person's direct messages.

## 6. Backups and recovery

- Keep Supabase automated backups on. Move to Pro before public launch.
- Export a logical backup before large migrations.
- Test a restore into a separate project at least once per quarter.
- Keep an inventory of environment variables and account owners in a password
  manager.
- Store the production wallet recovery material offline, never in Git.
- Define two targets:
  - RPO: how much data can be lost. Aim for 24 hours now, lower later.
  - RTO: how long recovery can take. Aim for 4 hours for the database.

## 7. Security baseline

- Turn on 2-step verification for GitHub, Vercel, Supabase, Resend, Dojah,
  Paystack, Google Cloud, and Name.com.
- Add a second owner to each critical service.
- Use GitHub secret scanning and Dependabot.
- Keep dependencies current. Do not auto-merge major upgrades.
- Use least privilege for API keys.
- Limit CORS on Edge Functions to the Selorah domains when the current browser
  flow allows it.
- Add rate limiting to public Edge Functions.
- Do not log request bodies that contain NIN, phone numbers, or medical text.
- Review access logs after every production incident.

## 8. Release process

1. Create a branch.
2. Make the change and run `npx tsc --noEmit` and `npm run build` locally.
3. Open a pull request.
4. Wait for CI and the Vercel preview.
5. Test the preview on mobile and desktop.
6. Merge to `main`.
7. Vercel deploys production.
8. Run a smoke test:
   - `/` loads.
   - `/privacy` returns policy text, not the app shell.
   - `/login` can sign in.
   - `/dashboard` loads with a real patient.
   - `/dashboard/cycle` saves a cycle.
   - `/dashboard/emergency` can save a local report.
9. Watch Sentry and Supabase logs for 15 minutes.
10. Roll back with Vercel instant rollback if the release is bad.

## 9. Incident runbook

If the site is down:

1. Check Vercel status and the latest deployment.
2. Check Supabase status and the project health.
3. Roll back the latest Vercel deployment if the error started with a release.
4. If auth fails, check the Supabase provider settings and redirect URLs.
5. If email fails, check Resend domain verification and the `send-email` logs.
6. If NIN checks fail, check Dojah wallet balance and `DOJAH_BASE_URL`.
7. Post a short status update to the support inbox.
8. Write a short review after recovery: cause, impact, fix, and prevention.

## 10. Cost controls

- Stay on Vercel Hobby until team seats or limits are the real blocker.
- Move Supabase to Pro before public launch so the project does not pause.
- Keep Resend on Free until 3,000 emails per month or 100 per day is too low.
- Keep Dojah on sandbox until the company and wallet are ready.
- Set billing alerts in Vercel, Supabase, Resend, Dojah, and Paystack.
- Review the monthly bill on the first working day of each month.

## Next DevOps tasks

1. Verify the root `package-lock.json` on a clean runner and switch CI to `npm ci`.
2. Burn down the ESLint errors, then make lint blocking.
3. Add Sentry and uptime checks.
4. Add the GitHub secrets for the Supabase workflow.
5. Add a staging Supabase project or branch before public launch.
6. Add a restore drill to the calendar.
